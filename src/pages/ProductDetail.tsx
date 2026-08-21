import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  ShoppingBag,
  Check,
  Package,
  QrCode,
  BookOpen,
  Video,
  UserCircle2,
  Gift,
  MessageCircle,
  BadgeCheck,
  Truck,
  Zap,
  Headset,
  FileText,
} from 'lucide-react';
import { productApi, type ProductReview } from '../api/product';
import { orderApi } from '../api/order';
import { paymentApi } from '../api/payment';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import Annotate from '../components/annotation/Annotate';
import type { ProductPackage, OrderAddress } from '../mocks/types';
import './ProductDetail.css';

const iconFor = (type: string) => {
  const map: Record<string, typeof Package> = {
    book: BookOpen,
    derivative: Gift,
    qrcode: QrCode,
    biography: BookOpen,
    digital_person: UserCircle2,
    video: Video,
  };
  return map[type] || Package;
};

const needsAddress = (type: string) => ['book', 'derivative'].includes(type);

const categoryLabel = (type: string) => {
  const map: Record<string, string> = {
    book: '实体书',
    derivative: '衍生品',
    qrcode: '二维码',
    biography: '传记服务',
    digital_person: '数字人',
    video: '纪念视频',
  };
  return map[type] || '商品';
};

/** 商品详情介绍（mock）：按商品类型展示图文详情块 */
const detailBlocksByType: Record<string, { title: string; text: string }[]> = {
  biography: [
    { title: '会聊天的 AI 采访师', text: '不用会写，只要会说。AI 按人生时间线一步步引导提问，支持语音输入，老人对着手机讲故事就能完成采访。' },
    { title: '8 章结构化传记', text: '从童年记忆、求学岁月到人生感悟，系统自动生成章节大纲并整理成文，脉络清晰、内容完整。' },
    { title: '在线编辑与一键润色', text: '生成后可以随时修改文字、调整章节顺序，温情叙事、朴实自然等四种文风一键切换润色。' },
    { title: 'PDF 一键导出', text: '排版好的传记随时导出 PDF，可直接打印装订，也能分享给家人共同补充完善。' },
  ],
  book: [
    { title: '专业排版设计', text: '资深设计师把关版式，封面可定制传主姓名与照片，内页图文混排，阅读体验媲美正式出版物。' },
    { title: '道林纸高清印刷', text: '采用 80g 道林纸，纸面柔和不刺眼，文字清晰、照片还原度高，适合长期翻阅保存。' },
    { title: '锁线装订工艺', text: '锁线胶装翻阅平整、摊开不回弹，经久耐用不易散页，收藏馈赠两相宜。' },
    { title: '7-10 天交付到家', text: '下单后排版确认再印刷，成品快递到家，全国包邮，进度可在订单中实时查看。' },
  ],
  digital_person: [
    { title: '基于真实传记构建', text: '数字人的回答全部来自采访与传记内容，讲的都是真实经历，不是泛泛而谈的聊天机器人。' },
    { title: '随时文字对话', text: '家人可以随时向数字人提问，听"ta"讲过去的故事，跨越时间和距离陪伴家人。' },
    { title: '家庭共享', text: '支持邀请家庭成员共同使用，让分散各地的亲人都能随时"回家看看"。' },
  ],
  video: [
    { title: '脚本自动提取', text: '系统从传记中提炼最动人的片段生成 60 秒短片脚本，无需自己撰写。' },
    { title: 'AI 配音与字幕', text: '多音色 AI 配音、自动字幕、背景音乐一站生成，导出高清视频，聚会播放、线上分享都合适。' },
  ],
  qrcode: [
    { title: '一扫即达的记忆入口', text: '为数字纪念馆生成专属二维码，可印制在书签、相框、纪念册上，扫一扫就能看到照片和故事。' },
    { title: '高清下载', text: '提供高清矢量图下载，打印放大依然清晰，多种样式模板可选。' },
  ],
  derivative: [
    { title: '把家风带在身边', text: '将家风家训、家族印记印制在日常物件上，让珍贵的家族记忆融入每天的生活。' },
    { title: '品质保障', text: '严选供应商，做工精细、包装妥帖，支持 7 天无理由退换。' },
  ],
  default: [
    { title: '商品介绍', text: '本商品由传家世平台提供，品质有保障。如有疑问可通过订单页联系客服。' },
  ],
};

const emptyAddress: OrderAddress = {
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [product, setProduct] = useState<ProductPackage | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuy, setShowBuy] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState<OrderAddress>(emptyAddress);
  const [remark, setRemark] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([productApi.get(id), productApi.reviews(id)])
      .then(([p, r]) => {
        setProduct(p || null);
        setReviews(r || []);
      })
      .catch(() => {
        setProduct(null);
        setReviews([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (user?.phone) {
      setAddress((prev) => ({ ...prev, phone: user.phone || '' }));
    }
  }, [user?.phone]);

  useEffect(() => {
    const saved = localStorage.getItem('cj_last_address');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as OrderAddress;
        setAddress((prev) => ({ ...parsed, phone: prev.phone || parsed.phone }));
      } catch {
        // ignore
      }
    }
  }, []);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) dist[5 - r.rating] += 1;
    });
    return dist;
  }, [reviews]);

  const handleBuy = async () => {
    if (!product) return;
    if (needsAddress(product.type)) {
      if (!address.name || !address.phone || !address.province || !address.city || !address.detail) {
        addToast('请填写完整收货地址', 'error');
        return;
      }
    }
    try {
      if (needsAddress(product.type)) {
        localStorage.setItem('cj_last_address', JSON.stringify(address));
      }
      setPaying(true);
      const order = await orderApi.create({
        type: product.type,
        productId: product.id,
        productName: product.name,
        amount: product.price * quantity,
        quantity,
        sku: product.name,
        remark,
        address: needsAddress(product.type) ? address : undefined,
      });
      await paymentApi.pay(order.id, 'wechat');
      addToast(`支付成功，订单号 ${order.id.slice(-8)}`, 'success');
      setShowBuy(false);
      navigate(`/order-success?orderId=${order.id}`);
    } catch (err: any) {
      addToast(err.message || '支付失败', 'error');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-loading">加载中…</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page">
        <Annotate id="product-detail.not-found">
        <div className="product-detail-empty">
          <Package size={48} color="#d1d5db" />
          <p>商品不存在或已下架</p>
          <button className="btn btn-primary" onClick={() => navigate('/store')}>返回商城</button>
        </div>
        </Annotate>
      </div>
    );
  }

  const Icon = iconFor(product.type);
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;
  const isPhysical = needsAddress(product.type);
  const promises = isPhysical
    ? [
        { icon: BadgeCheck, text: '官方正品保障' },
        { icon: Truck, text: '全国包邮' },
        { icon: Check, text: '7 天无理由退换' },
      ]
    : [
        { icon: BadgeCheck, text: '官方正品保障' },
        { icon: Zap, text: '下单自动发货' },
        { icon: Headset, text: '专属客服支持' },
      ];

  return (
    <div className="product-detail-page">
      <button className="product-detail-back" onClick={() => navigate('/store')}>
        <ArrowLeft size={16} /> 返回商城
      </button>

      <div className="product-detail-hero">
        <div className="product-detail-gallery">
          <div className={`product-detail-gallery-main ${product.type}`}>
            {discount > 0 && <span className="product-detail-gallery-badge">-{discount}%</span>}
            <Icon size={104} />
          </div>
          <div className="product-detail-gallery-thumbs">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`product-detail-gallery-thumb ${product.type} ${i === 0 ? 'active' : ''}`}>
                <Icon size={26} />
              </div>
            ))}
          </div>
        </div>

        <div className="product-detail-info">
          <span className="product-detail-category">{categoryLabel(product.type)}</span>
          <div className="product-detail-header">
            <h1 className="product-detail-name">{product.name}</h1>
            <div className="product-detail-badges">
              {(product.hot || (product.sales || 0) >= 50) && <span className="product-detail-hot">HOT</span>}
            </div>
          </div>
          <p className="product-detail-desc">{product.description}</p>

          <div className="product-detail-price-panel">
            <div className="product-detail-price-main">
              <span className="product-detail-price-symbol">¥</span>
              <strong>{product.price.toLocaleString()}</strong>
              {product.originalPrice && product.originalPrice > product.price && (
                <del>¥{product.originalPrice.toLocaleString()}</del>
              )}
              {discount > 0 && <span className="product-detail-price-tag">限时特惠</span>}
            </div>
            <div className="product-detail-price-side">
              <span>已售 {product.sales || 0}</span>
              <span>{reviews.length} 条评价</span>
            </div>
          </div>

          <div className="product-detail-promises">
            {promises.map(({ icon: PromiseIcon, text }) => (
              <span key={text} className="product-detail-promise"><PromiseIcon size={14} /> {text}</span>
            ))}
          </div>

          <div className="product-detail-actions">
            <Annotate id="product-detail.buy-button" inline>
            <button className="btn btn-primary product-detail-buy-btn" onClick={() => { setQuantity(1); setShowBuy(true); }}>
              <ShoppingBag size={16} /> 立即购买
            </button>
            </Annotate>
          </div>
        </div>
      </div>

      <div className="product-detail-section">
        <h3><FileText size={16} /> 商品详情</h3>
        <div className="product-detail-blocks">
          {(detailBlocksByType[product.type] || detailBlocksByType.default).map((block, idx) => (
            <div className="product-detail-block" key={block.title}>
              <div className={`product-detail-block-icon ${product.type}`}>
                <Icon size={22} />
                <span>{String(idx + 1).padStart(2, '0')}</span>
              </div>
              <div className="product-detail-block-body">
                <h4>{block.title}</h4>
                <p>{block.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="product-detail-section">
        <h3><Check size={16} /> 服务权益</h3>
        <div className="product-detail-rights">
          {product.rights.map((r) => (
            <div className="product-detail-right" key={r}><Check size={14} /> {r}</div>
          ))}
        </div>
      </div>

      <Annotate id="product-detail.reviews">
      <div className="product-detail-section">
        <div className="product-detail-reviews-header">
          <h3><MessageCircle size={16} /> 用户评价</h3>
          <div className="product-detail-rating-summary">
            <div className="product-detail-rating-score">{avgRating}</div>
            <div className="product-detail-rating-stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className={Number(avgRating) > i ? 'filled' : ''} />
              ))}
            </div>
            <div className="product-detail-rating-count">{reviews.length} 条评价</div>
          </div>
        </div>

        <div className="product-detail-rating-bars">
          {ratingDistribution.map((count, idx) => {
            const star = 5 - idx;
            const percent = reviews.length ? (count / reviews.length) * 100 : 0;
            return (
              <div className="product-detail-rating-bar" key={star}>
                <span>{star} 星</span>
                <div className="product-detail-rating-track">
                  <div className="product-detail-rating-fill" style={{ width: `${percent}%` }} />
                </div>
                <span>{count}</span>
              </div>
            );
          })}
        </div>

        {reviews.length === 0 ? (
          <div className="product-detail-no-reviews">暂无评价，购买后成为第一个评价的人吧</div>
        ) : (
          <div className="product-detail-review-list">
            {reviews.map((review) => (
              <div className="product-detail-review-item" key={review.id}>
                <div className="product-detail-review-header">
                  <div className="product-detail-review-user">
                    <div className="product-detail-review-avatar">{review.userName.slice(0, 1)}</div>
                    <span>{review.userName}</span>
                  </div>
                  <div className="product-detail-review-stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} className={i < review.rating ? 'filled' : ''} />
                    ))}
                  </div>
                </div>
                <p className="product-detail-review-content">{review.content}</p>
                <div className="product-detail-review-date">{new Date(review.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      </Annotate>

      {showBuy && (
        <Annotate id="product-detail.buy-modal">
        <div className="modal-overlay" onClick={() => setShowBuy(false)}>
          <div className="modal-content product-detail-buy-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>确认订单</h4>
              <button className="modal-close" onClick={() => setShowBuy(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="product-detail-buy-product">
                <div className={`product-detail-icon ${product.type}`}><Icon size={24} /></div>
                <div>
                  <div className="product-detail-buy-name">{product.name}</div>
                  <div className="product-detail-buy-price">¥{product.price.toLocaleString()}</div>
                </div>
              </div>

              {needsAddress(product.type) && (
                <div className="product-detail-buy-address">
                  <h5>收货地址</h5>
                  <div className="form-row">
                    <label>收件人</label>
                    <input type="text" value={address.name} onChange={(e) => setAddress((p) => ({ ...p, name: e.target.value }))} placeholder="收件人姓名" />
                  </div>
                  <div className="form-row">
                    <label>联系电话</label>
                    <input type="text" value={address.phone} onChange={(e) => setAddress((p) => ({ ...p, phone: e.target.value }))} placeholder="联系电话" />
                  </div>
                  <div className="product-detail-address-row">
                    <div className="form-row"><label>省</label><input type="text" value={address.province} onChange={(e) => setAddress((p) => ({ ...p, province: e.target.value }))} placeholder="省" /></div>
                    <div className="form-row"><label>市</label><input type="text" value={address.city} onChange={(e) => setAddress((p) => ({ ...p, city: e.target.value }))} placeholder="市" /></div>
                    <div className="form-row"><label>区</label><input type="text" value={address.district} onChange={(e) => setAddress((p) => ({ ...p, district: e.target.value }))} placeholder="区" /></div>
                  </div>
                  <div className="form-row">
                    <label>详细地址</label>
                    <input type="text" value={address.detail} onChange={(e) => setAddress((p) => ({ ...p, detail: e.target.value }))} placeholder="街道、门牌号等" />
                  </div>
                </div>
              )}

              {product.type === 'book' && (
                <div className="store-order-quantity">
                  <span className="store-order-quantity-label">购买份数</span>
                  <div className="store-order-quantity-stepper">
                    <button type="button" disabled={quantity <= 1} onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                    <span>{quantity} 份</span>
                    <button type="button" disabled={quantity >= 99} onClick={() => setQuantity((q) => Math.min(99, q + 1))}>＋</button>
                  </div>
                  <span className="store-order-quantity-total">小计 ¥{(product.price * quantity).toLocaleString()}</span>
                </div>
              )}

              <div className="form-row">
                <label>订单备注</label>
                <textarea rows={2} value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="如有特殊要求请填写" />
              </div>

              <button className="btn btn-primary" style={{ width: '100%' }} disabled={paying} onClick={handleBuy}>
                <ShoppingBag size={14} /> {paying ? '支付中…' : `微信支付 ¥${(product.price * quantity).toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
        </Annotate>
      )}
    </div>
  );
}
