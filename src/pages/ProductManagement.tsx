import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X, Package, Search, Image } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { productApi } from '../api/product';
import Annotate from '../components/annotation/Annotate';
import type { ProductPackage, ProductType } from '../mocks/types';
import './ProductManagement.css';

const typeGroups: { type: ProductType; label: string }[] = [
  { type: 'biography', label: 'AI传记' },
  { type: 'book', label: '实体书' },
];

interface ProductForm {
  type: ProductType;
  name: string;
  price: string;
  originalPrice: string;
  description: string;
  rights: string[];
  hot: boolean;
  headline: string;
  subheadline: string;
  detailBlocks: { id: string; title: string; content: string }[];
  promises: string[];
  faqs: { id: string; question: string; answer: string }[];
  tags: string[];
  coverImage: string;
}

const emptyForm: ProductForm = {
  type: 'biography',
  name: '',
  price: '',
  originalPrice: '',
  description: '',
  rights: [],
  hot: false,
  headline: '',
  subheadline: '',
  detailBlocks: [],
  promises: [],
  faqs: [],
  tags: [],
  coverImage: '',
};

export default function ProductManagement() {
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ProductPackage | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [rightInput, setRightInput] = useState('');
  const [showDelete, setShowDelete] = useState<ProductPackage | null>(null);
  const [previewProduct, setPreviewProduct] = useState<ProductPackage | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('请上传图片文件', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      addToast('图片大小不能超过 2MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, coverImage: reader.result as string }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const [products, setProducts] = useState<ProductPackage[]>([]);
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<ProductType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const loadProducts = () => {
    productApi
      .adminList()
      .then(setProducts)
      .catch(() => setProducts([]));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const visibleProducts = useMemo(() => products
    .filter((product) => product.type === 'biography' || product.type === 'book')
    .filter((product) => typeFilter === 'all' || product.type === typeFilter)
    .filter((product) => statusFilter === 'all' || (product.status || 'active') === statusFilter)
    .filter((product) => !keyword.trim() || `${product.name} ${product.description}`.toLowerCase().includes(keyword.trim().toLowerCase()))
    .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999)),
  [products, keyword, typeFilter, statusFilter]);

  const typeLabel = (type: ProductType) => typeGroups.find((group) => group.type === type)?.label || type;

  const openCreate = (type: ProductType) => {
    setEditing(null);
    setForm({ ...emptyForm, type });
    setRightInput('');
    setShowModal(true);
  };

  const openEdit = (item: ProductPackage) => {
    setEditing(item);
    setForm({
      type: item.type,
      name: item.name,
      price: String(item.price),
      originalPrice: item.originalPrice != null ? String(item.originalPrice) : '',
      description: item.description,
      rights: [...item.rights],
      hot: !!item.hot,
      headline: item.headline || '',
      subheadline: item.subheadline || '',
      detailBlocks: item.detailBlocks || [],
      promises: item.promises || [],
      faqs: item.faqs || [],
      tags: item.tags || [],
      coverImage: item.coverImage || '',
    });
    setRightInput('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const addRight = () => {
    const value = rightInput.trim();
    if (!value) return;
    if (form.rights.includes(value)) {
      addToast('该权益已存在', 'error');
      return;
    }
    setForm((prev) => ({ ...prev, rights: [...prev.rights, value] }));
    setRightInput('');
  };

  const removeRight = (value: string) => {
    setForm((prev) => ({ ...prev, rights: prev.rights.filter((r) => r !== value) }));
  };

  const handleSubmit = async () => {
    const price = Number(form.price);
    if (!form.name.trim()) {
      addToast('请填写套餐名称', 'error');
      return;
    }
    if (!form.price || Number.isNaN(price) || price <= 0) {
      addToast('请填写正确的价格', 'error');
      return;
    }
    const originalPrice = form.originalPrice ? Number(form.originalPrice) : undefined;
    const payload: Partial<ProductPackage> = {
      type: form.type,
      name: form.name.trim(),
      price,
      originalPrice: originalPrice && !Number.isNaN(originalPrice) ? originalPrice : undefined,
      description: form.description.trim(),
      rights: form.rights,
      hot: form.hot,
      headline: form.headline.trim(),
      subheadline: form.subheadline.trim(),
      detailBlocks: form.detailBlocks,
      promises: form.promises,
      faqs: form.faqs,
      tags: form.tags,
      coverImage: form.coverImage.trim() || undefined,
    };
    try {
      if (editing) {
        await productApi.update(editing.id, payload);
        addToast('套餐已更新', 'success');
      } else {
        await productApi.create(payload);
        addToast('套餐新增成功', 'success');
      }
      loadProducts();
      closeModal();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    try {
      await productApi.remove(showDelete.id);
      loadProducts();
      setShowDelete(null);
      addToast('套餐已删除', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '删除失败', 'error');
    }
  };

  const toggleShelf = async (item: ProductPackage) => {
    const offline = item.status === 'inactive';
    try {
      await productApi.updateStatus(item.id, offline ? 'active' : 'inactive');
      loadProducts();
      addToast(offline ? `「${item.name}」已上架` : `「${item.name}」已下架`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    }
  };

  return (
    <div className="product-mgmt-page">
      <header className="page-header">
        <h1 className="page-title">产品套餐管理</h1>
      </header>

      <div className="card product-mgmt-table-card">
        <div className="product-mgmt-toolbar">
          <div className="product-mgmt-search"><Search size={15} /><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索商品名称或描述" /></div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ProductType | 'all')}><option value="all">全部分类</option>{typeGroups.map((group) => <option key={group.type} value={group.type}>{group.label}</option>)}</select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}><option value="all">全部状态</option><option value="active">已上架</option><option value="inactive">已下架</option></select>
          <button className="btn btn-primary" onClick={() => openCreate('biography')}><Plus size={14} /> 新增商品</button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table"><thead><tr><th>商品名称</th><th>商品分类</th><th>价格</th><th>宣传页</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead><tbody>
            {visibleProducts.length === 0 ? <tr><td colSpan={7} className="admin-table-empty">暂无符合条件的商品</td></tr> : visibleProducts.map((item) => {
              const offline = item.status === 'inactive';
              const promotionReady = Boolean(item.headline || item.detailBlocks?.length || item.faqs?.length);
              return <tr key={item.id} className={offline ? 'offline' : ''}>
                <td className="admin-table-text-left"><div className="product-table-name"><Package size={16} /><strong>{item.name}</strong>{item.hot && <span className="product-mgmt-hot">热销</span>}</div><small>{item.description}</small></td>
                <td>{typeLabel(item.type)}</td><td><strong>¥{item.price}</strong>{item.originalPrice != null && <del>¥{item.originalPrice}</del>}</td>
                <td><span className={`product-table-badge ${promotionReady ? 'ready' : 'muted'}`}>{promotionReady ? '已配置' : '未配置'}</span></td>
                <td><span className={`product-table-badge ${offline ? 'muted' : 'active'}`}>{offline ? '已下架' : '已上架'}</span></td>
                <td>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('zh-CN') : new Date(item.createdAt).toLocaleDateString('zh-CN')}</td>
                <td><button className="admin-table-link" onClick={() => setPreviewProduct(item)}>预览</button><button className="admin-table-link" onClick={() => openEdit(item)}>编辑</button><button className="admin-table-link" onClick={() => toggleShelf(item)}>{offline ? '上架' : '下架'}</button><button className="admin-table-link danger" onClick={() => setShowDelete(item)}>删除</button></td>
              </tr>;
            })}
          </tbody></table>
        </div>
      </div>

      {showModal && (
        <Annotate id="product-management.form">
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content product-mgmt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{editing ? '编辑套餐' : '新增套餐'}</h4>
              <button className="modal-close" onClick={closeModal}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>套餐分类</label>
                <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as ProductType }))}>
                  {typeGroups.map((g) => (
                    <option value={g.type} key={g.type}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>套餐名称</label>
                <input type="text" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="请输入套餐名称" />
              </div>
              <div className="form-row">
                <label>价格（元）</label>
                <input type="number" min={0} value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} placeholder="如 99" />
              </div>
              <div className="form-row">
                <label>原价（元，选填）</label>
                <input type="number" min={0} value={form.originalPrice} onChange={(e) => setForm((prev) => ({ ...prev, originalPrice: e.target.value }))} placeholder="如 199" />
              </div>
              <div className="form-row">
                <label>套餐描述</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="请输入套餐描述" />
              </div>
              <div className="form-row">
                <label>权益列表</label>
                <div className="product-mgmt-right-input">
                  <input
                    type="text"
                    value={rightInput}
                    onChange={(e) => setRightInput(e.target.value)}
                    placeholder="输入权益后按回车添加"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRight(); } }}
                  />
                  <button className="btn btn-outline" onClick={addRight}>添加</button>
                </div>
                <div className="product-mgmt-rights" style={{ marginTop: 8 }}>
                  {form.rights.map((r) => (
                    <span className="product-mgmt-right-tag editable" key={r}>
                      {r}
                      <button onClick={() => removeRight(r)}><X size={10} /></button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="product-promotion-editor">
                <h4>宣传页配置</h4>
                <div className="form-row"><label>商品主图</label><div className="product-cover-editor">{form.coverImage ? <img className="product-cover-clickable" src={form.coverImage} alt="商品主图预览" onClick={() => coverInputRef.current?.click()} /> : <div className="product-cover-empty product-cover-clickable" onClick={() => coverInputRef.current?.click()}><Image size={18} /> 上传主图</div>}<input ref={coverInputRef} type="file" accept="image/*" hidden onChange={handleCoverUpload} /><div><div className="product-cover-actions"><button type="button" className="btn btn-outline" onClick={() => coverInputRef.current?.click()}>上传图片</button><input value={form.coverImage} onChange={(e) => setForm((prev) => ({ ...prev, coverImage: e.target.value }))} placeholder="或输入图片 URL" /></div><small>支持上传本地图片（不超过 2MB）或输入图片 URL</small></div></div></div>
                <div className="form-row"><label>首屏主标题</label><input value={form.headline} onChange={(e) => setForm((prev) => ({ ...prev, headline: e.target.value }))} placeholder="例如：把人生故事写成传记" /></div>
                <div className="form-row"><label>首屏副标题</label><input value={form.subheadline} onChange={(e) => setForm((prev) => ({ ...prev, subheadline: e.target.value }))} placeholder="一句话说明商品价值" /></div>
                <div className="form-row"><label>详情模块</label><textarea rows={4} value={form.detailBlocks.map((block) => `${block.title}：${block.content}`).join('\n')} onChange={(e) => setForm((prev) => ({ ...prev, detailBlocks: e.target.value.split('\n').filter(Boolean).map((line, index) => { const [title, ...content] = line.split('：'); return { id: `block_${index}`, title: title || `详情 ${index + 1}`, content: content.join('：') || title || '' }; }) }))} placeholder="每行一个模块，格式：标题：内容" /></div>
                <div className="form-row"><label>服务承诺</label><input value={form.promises.join('、')} onChange={(e) => setForm((prev) => ({ ...prev, promises: e.target.value.split('、').map((item) => item.trim()).filter(Boolean) }))} placeholder="例如：全国包邮、专属客服支持" /></div>
                <div className="form-row"><label>常见问题</label><textarea rows={3} value={form.faqs.map((faq) => `${faq.question}：${faq.answer}`).join('\n')} onChange={(e) => setForm((prev) => ({ ...prev, faqs: e.target.value.split('\n').filter(Boolean).map((line, index) => { const [question, ...answer] = line.split('：'); return { id: `faq_${index}`, question: question || '', answer: answer.join('：') || '' }; }) }))} placeholder="每行一个问题，格式：问题：答案" /></div>
              </div>
              <div className="form-row">
                <label className="product-mgmt-hot-check">
                  <input type="checkbox" checked={form.hot} onChange={(e) => setForm((prev) => ({ ...prev, hot: e.target.checked }))} />
                  标记为热销
                </label>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={handleSubmit}>
                {editing ? '保存修改' : '确认新增'}
              </button>
            </div>
          </div>
        </div>
        </Annotate>
      )}

      {previewProduct && (
        <div className="modal-overlay" onClick={() => setPreviewProduct(null)}>
          <div className="modal-content product-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>商品宣传页预览</h4><button className="modal-close" onClick={() => setPreviewProduct(null)}><X size={16} /></button></div>
            <div className="product-preview-modal-body">
              <div className="product-preview-hero"><Package size={28} /><div><strong>{previewProduct.name}</strong><span>{previewProduct.headline || previewProduct.description}</span></div><b>¥{previewProduct.price}</b></div>
              {previewProduct.subheadline && <p className="product-preview-subheadline">{previewProduct.subheadline}</p>}
              <div className="product-preview-section"><h5>商品权益</h5><div className="product-preview-tags">{previewProduct.rights.map((right) => <span key={right}>{right}</span>)}</div></div>
              <div className="product-preview-section"><h5>详情模块</h5>{(previewProduct.detailBlocks || []).length ? previewProduct.detailBlocks?.map((block) => <div className="product-preview-detail" key={block.id}><strong>{block.title}</strong><p>{block.content}</p></div>) : <p>未配置，用户端使用默认详情。</p>}</div>
              <div className="product-preview-section"><h5>服务承诺</h5><div className="product-preview-tags">{(previewProduct.promises || []).map((promise) => <span key={promise}>{promise}</span>)}</div></div>
              <div className="product-preview-section"><h5>常见问题</h5>{(previewProduct.faqs || []).map((faq) => <div className="product-preview-detail" key={faq.id}><strong>{faq.question}</strong><p>{faq.answer}</p></div>)}</div>
            </div>
            <div className="product-preview-modal-footer"><button className="btn btn-outline" onClick={() => setPreviewProduct(null)}>关闭预览</button><button className="btn btn-primary" onClick={() => { setPreviewProduct(null); openEdit(previewProduct); }}>编辑宣传页</button></div>
          </div>
        </div>
      )}

      {showDelete && (
        <Annotate id="product-management.delete">
        <div className="modal-overlay" onClick={() => setShowDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>确认删除</h4>
              <button className="modal-close" onClick={() => setShowDelete(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#6b7280', fontSize: 13 }}>删除后，套餐「{showDelete.name}」将无法恢复，是否继续？</p>
              <div className="product-mgmt-delete-actions">
                <button className="btn btn-outline" onClick={() => setShowDelete(null)}>取消</button>
                <button className="btn btn-danger" onClick={handleDelete}>确认删除</button>
              </div>
            </div>
          </div>
        </div>
        </Annotate>
      )}
    </div>
  );
}
