import { useState } from 'react';
import { BookOpen, Check, Download, Info, Package, Printer, QrCode, Save, Settings2, X } from 'lucide-react';
import './ProductManagement.css';

type ProductIcon = 'pdf' | 'book' | 'qr';
type PriceTier = { id: string; label: string; price: string };
type PlatformProduct = {
  id: ProductIcon;
  name: string;
  description: string;
  icon: ProductIcon;
  accent: string;
  unit: string;
  tiers: PriceTier[];
};
type BiographerLevel = {
  id: string;
  level: string;
  minPrice: number;
  maxPrice: number;
  color: string;
};

const initialProducts: PlatformProduct[] = [
  {
    id: 'pdf', name: 'PDF 电子书下载', description: '生成排版完成的电子传记，支持下载与保存。', icon: 'pdf', accent: '#1b5e4b', unit: '元 / 千字',
    tiers: [{ id: 'pdf-1', label: '0–5 万字', price: '0.60' }, { id: 'pdf-2', label: '5–10 万字', price: '0.50' }, { id: 'pdf-3', label: '10 万字以上', price: '0.40' }],
  },
  {
    id: 'book', name: '生成实体书', description: '生成实体书印刷文件并进入实体书制作流程。', icon: 'book', accent: '#b8860b', unit: '元 / 千字',
    tiers: [{ id: 'book-1', label: '0–5 万字', price: '2.80' }, { id: 'book-2', label: '5–10 万字', price: '2.40' }, { id: 'book-3', label: '10 万字以上', price: '2.00' }],
  },
  {
    id: 'qr', name: '生成传记二维码', description: '为已完成的传记生成专属二维码，便于分享与长期保存。', icon: 'qr', accent: '#7c3aed', unit: '元 / 千字',
    tiers: [{ id: 'qr-1', label: '0–5 万字', price: '0.20' }, { id: 'qr-2', label: '5–10 万字', price: '0.16' }, { id: 'qr-3', label: '10 万字以上', price: '0.12' }],
  },
];

const initialLevels: BiographerLevel[] = [
  { id: 'gold', level: '金牌传记师', minPrice: 12000, maxPrice: 30000, color: '#b8860b' },
  { id: 'silver', level: '银牌传记师', minPrice: 6000, maxPrice: 12000, color: '#7b8794' },
  { id: 'standard', level: '标准传记师', minPrice: 2000, maxPrice: 6000, color: '#6b8f82' },
];

const productIcon = (type: ProductIcon) => {
  if (type === 'pdf') return <Download size={22} />;
  if (type === 'book') return <Printer size={22} />;
  return <QrCode size={22} />;
};

export default function ProductManagement() {
  const [products, setProducts] = useState(initialProducts);
  const [levels, setLevels] = useState(initialLevels);
  const [editingProduct, setEditingProduct] = useState<PlatformProduct | null>(null);
  const [editingLevel, setEditingLevel] = useState<BiographerLevel | null>(null);

  const openProductEditor = (product: PlatformProduct) => setEditingProduct({ ...product, tiers: product.tiers.map((tier) => ({ ...tier })) });
  const saveProduct = () => {
    if (!editingProduct) return;
    setProducts((items) => items.map((item) => item.id === editingProduct.id ? editingProduct : item));
    setEditingProduct(null);
  };
  const saveLevel = () => {
    if (!editingLevel) return;
    setLevels((items) => items.map((item) => item.id === editingLevel.id ? editingLevel : item));
    setEditingLevel(null);
  };

  return (
    <div className="product-mgmt-page pricing-page">
      <header className="page-header pricing-page-header">
        <div><h1 className="page-title">商品与定价管理</h1></div>
      </header>

      <section className="pricing-section">
        <div className="pricing-section-head"><div><h2>平台商品</h2></div><span className="pricing-rule-pill"><Package size={14} /> 按字数计价</span></div>
        <div className="platform-product-grid">
          {products.map((product) => (
            <article className="platform-product-card card" key={product.id}>
              <div className="platform-product-head"><div className="platform-product-icon" style={{ color: product.accent, background: `${product.accent}15` }}>{productIcon(product.icon)}</div><span className="pricing-active"><Check size={12} /> 已启用</span></div>
              <h3>{product.name}</h3>
              <div className="platform-product-unit"><span>计价单位</span><strong>{product.unit}</strong></div>
              <div className="word-price-list">{product.tiers.map((tier) => <div className="word-price-row" key={tier.id}><span>{tier.label}</span><strong>¥{tier.price}</strong></div>)}</div>
              <button className="pricing-edit-button" onClick={() => openProductEditor(product)}><Settings2 size={14} /> 调整字数价格</button>
            </article>
          ))}
        </div>
      </section>

      <section className="pricing-section biographer-pricing-section">
        <div className="pricing-section-head"><div><h2>传记师服务标准</h2></div><span className="pricing-rule-pill gold"><BookOpen size={14} /> 传记师自主报价</span></div>
        <div className="biographer-level-grid">
          {levels.map((level) => <article className="biographer-level-card card" key={level.id}><div className="level-marker" style={{ background: level.color }} /><div className="level-card-top"><div><h3>{level.level}</h3></div><span className="level-range">¥{level.minPrice.toLocaleString()}–¥{level.maxPrice.toLocaleString()}</span></div><div className="level-card-footer"><span><Info size={13} /> 标准范围</span><button className="pricing-text-button" onClick={() => setEditingLevel({ ...level })}>编辑范围</button></div></article>)}
        </div>
      </section>

      {editingProduct && <div className="modal-overlay" onClick={() => setEditingProduct(null)}><div className="modal-content pricing-editor-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><h4>{editingProduct.name}</h4></div><button className="modal-close" onClick={() => setEditingProduct(null)}><X size={16} /></button></div><div className="modal-body"><p className="pricing-modal-tip">按传记字数设置价格</p>{editingProduct.tiers.map((tier, index) => <div className="pricing-tier-editor" key={tier.id}><label>{tier.label}</label><div><span>¥</span><input type="number" min="0" step="0.01" value={tier.price} onChange={(event) => setEditingProduct((current) => current && ({ ...current, tiers: current.tiers.map((item, itemIndex) => itemIndex === index ? { ...item, price: event.target.value } : item) }))} /><small>每 1,000 字</small></div></div>)}<button className="btn btn-primary pricing-save-button" onClick={saveProduct}><Save size={14} /> 保存字数价格</button></div></div></div>}

      {editingLevel && <div className="modal-overlay" onClick={() => setEditingLevel(null)}><div className="modal-content pricing-editor-modal level-editor-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><h4>{editingLevel.level}</h4></div><button className="modal-close" onClick={() => setEditingLevel(null)}><X size={16} /></button></div><div className="modal-body"><div className="level-range-editor"><label>建议服务范围</label><div className="level-range-inputs"><div><span>¥</span><input type="number" min="0" value={editingLevel.minPrice} onChange={(event) => setEditingLevel((current) => current && ({ ...current, minPrice: Number(event.target.value) }))} /></div><em>至</em><div><span>¥</span><input type="number" min="0" value={editingLevel.maxPrice} onChange={(event) => setEditingLevel((current) => current && ({ ...current, maxPrice: Number(event.target.value) }))} /></div></div></div><button className="btn btn-primary pricing-save-button" onClick={saveLevel}><Save size={14} /> 保存标准范围</button></div></div></div>}
    </div>
  );
}
