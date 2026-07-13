import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, Check, Package, QrCode, BookOpen, Video, UserCircle2, Gift, MapPin, Phone, User, FileText, CreditCard, X, Search } from 'lucide-react';
import { productApi } from '../api/product';
import { orderApi } from '../api/order';
import { paymentApi } from '../api/payment';
import { archiveApi } from '../api/archive';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import type { ProductPackage, OrderAddress, Archive } from '../mocks/types';
import './Store.css';

const categoryMap: Record<string, { label: string; icon: typeof Package }> = {
  all: { label: '全部商品', icon: ShoppingBag },
  book: { label: '实体书', icon: BookOpen },
  derivative: { label: '衍生品', icon: Gift },
  qrcode: { label: '二维码', icon: QrCode },
  biography: { label: '传记服务', icon: BookOpen },
  digital_person: { label: '数字人', icon: UserCircle2 },
  video: { label: '纪念视频', icon: Video },
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

export default function Store() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ProductPackage | null>(null);
  const [address, setAddress] = useState<OrderAddress>(emptyAddress);
  const [remark, setRemark] = useState('');
  const [paying, setPaying] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState<'default' | 'price_asc' | 'price_desc'>('default');
  const [linkedArchive, setLinkedArchive] = useState<Archive | null>(null);

  const activeCategory = searchParams.get('category') || 'all';
  const archiveId = searchParams.get('archiveId') || undefined;

  useEffect(() => {
    setLoading(true);
    productApi
      .list()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

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

  useEffect(() => {
    if (!archiveId) {
      setLinkedArchive(null);
      return;
    }
    archiveApi
      .get(archiveId)
      .then(setLinkedArchive)
      .catch(() => setLinkedArchive(null));
  }, [archiveId]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory === 'physical') {
      list = products.filter((p) => needsAddress(p.type));
    } else if (activeCategory !== 'all') {
      list = products.filter((p) => p.type === activeCategory);
    }
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    if (sort === 'price_asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, activeCategory, keyword, sort]);

  const handleBuy = async () => {
    if (!selected) return;
    if (needsAddress(selected.type)) {
      if (!address.name || !address.phone || !address.province || !address.city || !address.detail) {
        addToast('请填写完整收货地址', 'error');
        return;
      }
    }
    try {
      if (needsAddress(selected.type)) {
        localStorage.setItem('cj_last_address', JSON.stringify(address));
      }
      setPaying(true);
      const order = await orderApi.create({
        type: selected.type,
        productId: selected.id,
        productName: selected.name,
        amount: selected.price,
        archiveId,
        sku: selected.name,
        remark,
        address: needsAddress(selected.type) ? address : undefined,
      });
      await paymentApi.pay(order.id, 'wechat');
      addToast(`支付成功，订单号 ${order.id.slice(-8)}`, 'success');
      setSelected(null);
      navigate(`/order-success?orderId=${order.id}`);
    } catch (err: any) {
      addToast(err.message || '支付失败', 'error');
    } finally {
      setPaying(false);
    }
  };

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

  return (
    <div className="store-page">
      <div className="store-hero">
        <h1 className="store-title">传家世商城</h1>
        <p className="store-subtitle">把家族记忆变成可触摸、可传承的珍贵礼物</p>
      </div>

      <div className="store-categories">
        {Object.entries(categoryMap).map(([key, { label, icon: Icon }]) => (
          <button
            key={key}
            className={`store-category ${activeCategory === key ? 'active' : ''}`}
            onClick={() => setSearchParams({ category: key, ...(archiveId ? { archiveId } : {}) })}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
        <button
          className={`store-category ${activeCategory === 'physical' ? 'active' : ''}`}
          onClick={() => setSearchParams({ category: 'physical', ...(archiveId ? { archiveId } : {}) })}
        >
          <Package size={16} /> 实物商品
        </button>
      </div>

      <div className="store-toolbar">
        <div className="store-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="搜索商品名称…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          {keyword && <button className="store-search-clear" onClick={() => setKeyword('')}><X size={12} /></button>}
        </div>
        <select className="store-sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="default">默认排序</option>
          <option value="price_asc">价格从低到高</option>
          <option value="price_desc">价格从高到低</option>
        </select>
      </div>

      <div className="store-products">
        {loading ? (
          <div className="store-empty">加载中…</div>
        ) : filtered.length === 0 ? (
          <div className="store-empty">暂无该类商品</div>
        ) : (
          filtered.map((p) => {
            const Icon = iconFor(p.type);
            return (
              <div className="store-product-card" key={p.id}>
                <div className="store-product-header">
                  <div className={`store-product-icon ${p.type}`}>
                    <Icon size={28} />
                  </div>
                  <div className="store-product-badges">
                    {(p.hot || (p.sales || 0) >= 50) && <span className="store-product-hot">HOT</span>}
                    {p.originalPrice && p.originalPrice > p.price && (
                      <span className="store-product-discount">
                        {Math.round((1 - p.price / p.originalPrice) * 100)}% OFF
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="store-product-name">{p.name}</h3>
                <p className="store-product-desc">{p.description}</p>
                <div className="store-product-rights">
                  {p.rights.slice(0, 4).map((r) => (
                    <span key={r} className="store-product-right"><Check size={12} /> {r}</span>
                  ))}
                </div>
                <div className="store-product-sales">
                  {p.sales ? `已售 ${p.sales}` : '新品上线'}
                </div>
                <div className="store-product-footer">
                  <div className="store-product-price">
                    <strong>¥{p.price}</strong>
                    {p.originalPrice && <del>¥{p.originalPrice}</del>}
                  </div>
                  <button className="store-product-btn" onClick={() => setSelected(p)}>
                    立即购买
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content store-order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>确认订单</h4>
              <button className="modal-close" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="store-order-product">
                <div className={`store-product-icon ${selected.type}`}>
                  {(() => {
                    const Icon = iconFor(selected.type);
                    return <Icon size={24} />;
                  })()}
                </div>
                <div>
                  <div className="store-order-name">{selected.name}</div>
                  <div className="store-order-price">¥{selected.price.toLocaleString()}</div>
                </div>
              </div>

              {linkedArchive && (
                <div className="store-order-archive">
                  <strong>关联档案：</strong>{linkedArchive.name}
                  <span className="store-order-archive-type">{linkedArchive.type === 'self' ? '本人' : linkedArchive.relation || '亲友'}</span>
                </div>
              )}

              {needsAddress(selected.type) && (
                <div className="store-order-address">
                  <h5><MapPin size={14} /> 收货地址</h5>
                  <div className="form-row">
                    <label><User size={12} /> 收件人</label>
                    <input
                      type="text"
                      value={address.name}
                      onChange={(e) => setAddress((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="收件人姓名"
                    />
                  </div>
                  <div className="form-row">
                    <label><Phone size={12} /> 联系电话</label>
                    <input
                      type="text"
                      value={address.phone}
                      onChange={(e) => setAddress((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="联系电话"
                    />
                  </div>
                  <div className="store-address-row">
                    <div className="form-row">
                      <label>省</label>
                      <input
                        type="text"
                        value={address.province}
                        onChange={(e) => setAddress((prev) => ({ ...prev, province: e.target.value }))}
                        placeholder="省"
                      />
                    </div>
                    <div className="form-row">
                      <label>市</label>
                      <input
                        type="text"
                        value={address.city}
                        onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
                        placeholder="市"
                      />
                    </div>
                    <div className="form-row">
                      <label>区</label>
                      <input
                        type="text"
                        value={address.district}
                        onChange={(e) => setAddress((prev) => ({ ...prev, district: e.target.value }))}
                        placeholder="区"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <label><MapPin size={12} /> 详细地址</label>
                    <input
                      type="text"
                      value={address.detail}
                      onChange={(e) => setAddress((prev) => ({ ...prev, detail: e.target.value }))}
                      placeholder="街道、门牌号等"
                    />
                  </div>
                </div>
              )}

              <div className="form-row">
                <label><FileText size={12} /> 订单备注</label>
                <textarea
                  rows={2}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="如有特殊要求请填写"
                />
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 8 }}
                disabled={paying}
                onClick={handleBuy}
              >
                <CreditCard size={14} /> {paying ? '支付中…' : `微信支付 ¥${selected.price.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
