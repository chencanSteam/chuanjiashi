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
} from 'lucide-react';
import { productApi, type ProductReview } from '../api/product';
import { orderApi } from '../api/order';
import { paymentApi } from '../api/payment';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
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
        amount: product.price,
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
        <div className="product-detail-empty">
          <Package size={48} color="#d1d5db" />
          <p>商品不存在或已下架</p>
          <button className="btn btn-primary" onClick={() => navigate('/store')}>返回商城</button>
        </div>
      </div>
    );
  }

  const Icon = iconFor(product.type);

  return (
    <div className="product-detail-page">
      <button className="product-detail-back" onClick={() => navigate('/store')}>
        <ArrowLeft size={16} /> 返回商城
      </button>

      <div className="product-detail-hero">
        <div className={`product-detail-icon ${product.type}`}>
          <Icon size={48} />
        </div>
        <div className="product-detail-info">
          <div className="product-detail-header">
            <h1 className="product-detail-name">{product.name}</h1>
            <div className="product-detail-badges">
              {(product.hot || (product.sales || 0) >= 50) && <span className="product-detail-hot">HOT</span>}
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="product-detail-discount">
                  {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                </span>
              )}
            </div>
          </div>
          <p className="product-detail-desc">{product.description}</p>
          <div className="product-detail-meta">
            <span className="product-detail-price">
              <strong>¥{product.price.toLocaleString()}</strong>
              {product.originalPrice && <del>¥{product.originalPrice.toLocaleString()}</del>}
            </span>
            <span className="product-detail-sales">已售 {product.sales || 0}</span>
          </div>
          <div className="product-detail-actions">
            <button className="btn btn-primary" onClick={() => setShowBuy(true)}>
              <ShoppingBag size={14} /> 立即购买
            </button>
          </div>
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

      {showBuy && (
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

              <div className="form-row">
                <label>订单备注</label>
                <textarea rows={2} value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="如有特殊要求请填写" />
              </div>

              <button className="btn btn-primary" style={{ width: '100%' }} disabled={paying} onClick={handleBuy}>
                <ShoppingBag size={14} /> {paying ? '支付中…' : `微信支付 ¥${product.price.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
