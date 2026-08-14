import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, X, Package, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { productApi } from '../api/product';
import Annotate from '../components/annotation/Annotate';
import type { ProductPackage, ProductType } from '../mocks/types';
import './ProductManagement.css';

const typeGroups: { type: ProductType; label: string }[] = [
  { type: 'biography', label: 'AI 传记' },
  { type: 'digital_person', label: '数字人' },
  { type: 'video', label: '短视频' },
  { type: 'qrcode', label: '码记二维码' },
  { type: 'book', label: '精装书' },
  { type: 'biographer_service', label: '传记师服务' },
  { type: 'derivative', label: '机器人预售' },
];

interface ProductForm {
  type: ProductType;
  name: string;
  price: string;
  originalPrice: string;
  description: string;
  rights: string[];
  hot: boolean;
}

const emptyForm: ProductForm = {
  type: 'biography',
  name: '',
  price: '',
  originalPrice: '',
  description: '',
  rights: [],
  hot: false,
};

export default function ProductManagement() {
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ProductPackage | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [rightInput, setRightInput] = useState('');
  const [showDelete, setShowDelete] = useState<ProductPackage | null>(null);

  const [products, setProducts] = useState<ProductPackage[]>([]);

  const loadProducts = () => {
    productApi
      .adminList()
      .then(setProducts)
      .catch(() => setProducts([]));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const grouped = useMemo(() => {
    return typeGroups.map((g) => ({
      ...g,
      items: products.filter((p) => p.type === g.type),
    }));
  }, [products]);

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

      <Annotate id="product-management.groups">
      <>
      {grouped.map((group) => (
        <div className="card product-mgmt-group" key={group.type}>
          <div className="card-header product-mgmt-group-header">
            <h3 className="card-title"><Package size={16} /> {group.label}</h3>
            <button className="btn btn-outline product-mgmt-add-btn" onClick={() => openCreate(group.type)}>
              <Plus size={14} /> 新增套餐
            </button>
          </div>
          <div className="card-body product-mgmt-body">
            {group.items.length === 0 ? (
              <div className="product-mgmt-empty">暂无套餐</div>
            ) : (
              group.items.map((item) => {
                const offline = item.status === 'inactive';
                return (
                  <div className={`product-mgmt-item ${offline ? 'offline' : ''}`} key={item.id}>
                    <div className="product-mgmt-info">
                      <div className="product-mgmt-name">
                        {item.name}
                        {item.hot && <span className="product-mgmt-hot">热销</span>}
                        {offline && <span className="product-mgmt-offline-badge">已下架</span>}
                      </div>
                      <div className="product-mgmt-desc">{item.description}</div>
                      <div className="product-mgmt-rights">
                        {item.rights.map((r) => (
                          <span className="product-mgmt-right-tag" key={r}>{r}</span>
                        ))}
                      </div>
                    </div>
                    <div className="product-mgmt-price">
                      <div className="product-mgmt-price-now">¥{item.price}</div>
                      {item.originalPrice != null && (
                        <div className="product-mgmt-price-orig">¥{item.originalPrice}</div>
                      )}
                      {item.sales != null && <div className="product-mgmt-sales">已售 {item.sales}</div>}
                    </div>
                    <div className="product-mgmt-actions">
                      <button className="icon-btn" title={offline ? '上架' : '下架'} onClick={() => toggleShelf(item)}>
                        {offline ? <ArrowUpFromLine size={14} /> : <ArrowDownToLine size={14} />}
                      </button>
                      <button className="icon-btn" title="编辑" onClick={() => openEdit(item)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="icon-btn" title="删除" onClick={() => setShowDelete(item)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
      </>
      </Annotate>

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
