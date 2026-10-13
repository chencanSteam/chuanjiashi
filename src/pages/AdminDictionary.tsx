import { useMemo, useState } from 'react';
import { Check, Edit3, Plus, RefreshCw, Search, Tags, Trash2, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import {
  dictionaryNowText, PLATFORM_FEE_CODE, readAdminDictionary, saveAdminDictionary,
  type AdminDictionaryData, type DictionaryCategory, type DictionaryEntry,
} from '../data/adminDictionary';
import './AdminDictionary.css';

type EntryForm = { name: string; code: string; value: string; note: string; enabled: boolean };
type CategoryForm = { name: string; code: string; group: string };
const emptyEntry: EntryForm = { name: '', code: '', value: '', note: '', enabled: true };
const emptyCategory: CategoryForm = { name: '', code: '', group: '业务配置' };
const pageSize = 10;

export default function AdminDictionary() {
  const { addToast } = useToast();
  const [data, setData] = useState<AdminDictionaryData>(readAdminDictionary);
  const [selectedId, setSelectedId] = useState('biographer_service');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [page, setPage] = useState(1);
  const [entryModal, setEntryModal] = useState<DictionaryEntry | 'create' | null>(null);
  const [categoryModal, setCategoryModal] = useState(false);
  const [entryForm, setEntryForm] = useState<EntryForm>(emptyEntry);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategory);

  const selectedCategory = data.categories.find(item => item.id === selectedId) || data.categories[0];
  const groups = useMemo(() => [...new Set(data.categories.map(item => item.group))], [data.categories]);
  const filtered = useMemo(() => data.entries.filter(item => {
    const search = keyword.trim().toLowerCase();
    return item.categoryId === selectedCategory?.id
      && (status === 'all' || item.enabled === (status === 'enabled'))
      && (!search || `${item.name} ${item.code} ${item.value} ${item.note}`.toLowerCase().includes(search));
  }), [data.entries, keyword, selectedCategory?.id, status]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const persist = (next: AdminDictionaryData) => {
    setData(next);
    saveAdminDictionary(next);
  };

  const openCreateEntry = () => {
    setEntryForm(emptyEntry);
    setEntryModal('create');
  };
  const openEditEntry = (item: DictionaryEntry) => {
    setEntryForm({ name: item.name, code: item.code, value: item.value, note: item.note, enabled: item.enabled });
    setEntryModal(item);
  };
  const saveEntry = () => {
    const name = entryForm.name.trim();
    const code = entryForm.code.trim().toUpperCase();
    const rawValue = entryForm.value.trim();
    if (!name || !code || !rawValue) { addToast('请填写名称、编码和值', 'error'); return; }
    if (!/^[A-Z][A-Z0-9_]*$/.test(code)) { addToast('编码只能使用大写字母、数字和下划线，并以字母开头', 'error'); return; }
    const editingId = typeof entryModal === 'object' && entryModal ? entryModal.id : '';
    if (data.entries.some(item => item.code === code && item.id !== editingId)) { addToast('字典项编码已存在', 'error'); return; }
    let value = rawValue;
    if (code === PLATFORM_FEE_CODE) {
      const percent = Number(rawValue.replace(/%$/, '').trim());
      if (!/^\d+(\.\d{1,2})?%?$/.test(rawValue) || !Number.isFinite(percent) || percent < 0 || percent > 100) {
        addToast('平台服务费率请输入 0–100 之间的百分比，最多两位小数', 'error'); return;
      }
      value = `${percent}%`;
    }
    const nextItem: DictionaryEntry = {
      id: editingId || `dict-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      categoryId: editingId ? (entryModal as DictionaryEntry).categoryId : selectedCategory.id,
      name, code, value, note: entryForm.note.trim(), enabled: code === PLATFORM_FEE_CODE || entryForm.enabled, updatedAt: dictionaryNowText(),
    };
    persist({ ...data, entries: editingId
      ? data.entries.map(item => item.id === editingId ? nextItem : item)
      : [...data.entries, nextItem] });
    setEntryModal(null);
    addToast(editingId ? '字典项已保存' : '字典项已新增', 'success');
  };

  const saveCategory = () => {
    const name = categoryForm.name.trim();
    const code = categoryForm.code.trim().toUpperCase();
    const group = categoryForm.group.trim();
    if (!name || !code || !group) { addToast('请填写分类名称、编码和分组', 'error'); return; }
    if (!/^[A-Z][A-Z0-9_]*$/.test(code)) { addToast('分类编码格式不正确', 'error'); return; }
    if (data.categories.some(item => item.code === code || (item.name === name && item.group === group))) {
      addToast('该分类名称或编码已存在', 'error'); return;
    }
    const category: DictionaryCategory = { id: `category-${Date.now()}`, name, code, group };
    persist({ ...data, categories: [...data.categories, category] });
    setSelectedId(category.id);
    setPage(1);
    setCategoryModal(false);
    addToast('分类已新增', 'success');
  };

  const toggleEntry = (item: DictionaryEntry) => {
    if (item.code === PLATFORM_FEE_CODE) { addToast('平台服务费率需保持启用，可将其值设为 0%', 'error'); return; }
    persist({ ...data, entries: data.entries.map(current => current.id === item.id
      ? { ...current, enabled: !current.enabled, updatedAt: dictionaryNowText() } : current) });
    addToast(item.enabled ? '字典项已停用' : '字典项已启用', 'success');
  };
  const removeEntry = (item: DictionaryEntry) => {
    if (item.code === PLATFORM_FEE_CODE) { addToast('平台服务费率是演示流程必需的配置项，可编辑为 0% 但不可删除', 'error'); return; }
    if (!window.confirm(`确定删除“${item.name}”吗？`)) return;
    persist({ ...data, entries: data.entries.filter(current => current.id !== item.id) });
    addToast('字典项已删除', 'success');
  };
  const removeCategory = (category: DictionaryCategory) => {
    if (category.id === 'biographer_service') { addToast('传记师服务配置分类不可删除', 'error'); return; }
    if (data.entries.some(item => item.categoryId === category.id)) { addToast('请先清空该分类下的字典项', 'error'); return; }
    if (!window.confirm(`确定删除分类“${category.name}”吗？`)) return;
    const categories = data.categories.filter(item => item.id !== category.id);
    persist({ ...data, categories });
    setSelectedId(categories[0]?.id || '');
    addToast('分类已删除', 'success');
  };

  return <div className="admin-dict-page">
    <header className="admin-dict-page-header">
      <div><h1>数据字典</h1><p className="admin-dict-page-desc">统一维护基础选项与业务配置</p></div>
      <button type="button" className="admin-dict-light-button" onClick={() => { setCategoryForm(emptyCategory); setCategoryModal(true); }}><Plus size={15} /> 新增分类</button>
    </header>

    <div className="admin-dict-layout">
      <aside className="admin-dict-nav" aria-label="字典分类">
        <h2 className="admin-dict-nav-title">字典分类</h2>
        {groups.map(group => <div className="admin-dict-group" key={group}>
          <div className="admin-dict-group-name">{group}</div>
          {data.categories.filter(item => item.group === group).map(category => <div className="admin-dict-category-line" key={category.id}>
            <button type="button" className={`admin-dict-nav-item${selectedCategory?.id === category.id ? ' active' : ''}`}
              onClick={() => { setSelectedId(category.id); setPage(1); setKeyword(''); setStatus('all'); }}>
              {category.name}
            </button>
            {selectedCategory?.id === category.id && <button type="button" className="admin-dict-category-delete" aria-label={`删除${category.name}分类`} onClick={() => removeCategory(category)}><Trash2 size={13} /></button>}
          </div>)}
        </div>)}
      </aside>

      <section className="admin-dict-main">
        <div className="admin-dict-header">
          <div><h2>{selectedCategory?.name || '字典项'}</h2><p>{selectedCategory?.group} · {selectedCategory?.code}</p></div>
          <div className="admin-dict-tools">
            <label className="admin-dict-search"><Search size={15} /><input value={keyword} onChange={event => { setKeyword(event.target.value); setPage(1); }} placeholder="搜索名称或编码" /></label>
            <select aria-label="筛选状态" value={status} onChange={event => { setStatus(event.target.value as typeof status); setPage(1); }}>
              <option value="all">全部状态</option><option value="enabled">已启用</option><option value="disabled">已停用</option>
            </select>
            <button type="button" className="admin-dict-light-button" onClick={() => { setKeyword(''); setStatus('all'); setPage(1); }}><RefreshCw size={14} /> 重置</button>
            <button type="button" className="admin-dict-primary-button" onClick={openCreateEntry} disabled={!selectedCategory}><Plus size={15} /> 新增字典项</button>
          </div>
        </div>
        <div className="admin-dict-table-scroll">
          <div className="admin-dict-table-head"><span>名称</span><span>编码</span><span>值</span><span>状态</span><span>更新时间</span><span>操作</span></div>
          {rows.length ? <div className="admin-dict-table-body">{rows.map(item => <div className="admin-dict-table-row" key={item.id}>
            <div className="admin-dict-name"><Tags size={15} /><div><strong>{item.name}</strong>{item.note && <small>{item.note}</small>}</div></div>
            <span className="admin-dict-code">{item.code}</span>
            <strong className="admin-dict-value">{item.value}</strong>
            <span className={`admin-dict-status ${item.enabled ? 'enabled' : 'disabled'}`}>{item.enabled ? '已启用' : '已停用'}</span>
            <span className="admin-dict-muted">{item.updatedAt}</span>
            <div className="admin-dict-actions"><button type="button" className="admin-dict-link" onClick={() => openEditEntry(item)}><Edit3 size={13} /> 编辑</button><button type="button" className="admin-dict-link" onClick={() => toggleEntry(item)} disabled={item.code === PLATFORM_FEE_CODE}><Check size={13} /> {item.enabled ? '停用' : '启用'}</button><button type="button" className="admin-dict-link danger" onClick={() => removeEntry(item)} disabled={item.code === PLATFORM_FEE_CODE}><Trash2 size={13} /> 删除</button></div>
          </div>)}</div> : <div className="admin-dict-empty">没有符合条件的字典项</div>}
        </div>
        <div className="admin-dict-table-footer"><span>共 {filtered.length} 条</span><div><button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>上一页</button><span>{currentPage} / {totalPages}</span><button type="button" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>下一页</button></div></div>
      </section>
    </div>

    {entryModal && <div className="modal-overlay admin-dict-modal-overlay" onClick={() => setEntryModal(null)}>
      <div className="modal-content admin-dict-modal" onClick={event => event.stopPropagation()}>
        <div className="modal-header"><h3>{entryModal === 'create' ? '新增字典项' : '编辑字典项'}</h3><button type="button" className="modal-close" onClick={() => setEntryModal(null)} aria-label="关闭"><X size={17} /></button></div>
        <div className="modal-body">
          <div className="admin-dict-form-row"><label htmlFor="dict-entry-name">名称</label><input id="dict-entry-name" value={entryForm.name} onChange={event => setEntryForm({ ...entryForm, name: event.target.value })} placeholder="请输入名称" autoFocus /></div>
          <div className="admin-dict-form-row"><label htmlFor="dict-entry-code">编码</label><input id="dict-entry-code" value={entryForm.code} onChange={event => setEntryForm({ ...entryForm, code: event.target.value })} placeholder="例如 PLATFORM_FEE_RATE" disabled={entryModal !== 'create'} /></div>
          <div className="admin-dict-form-row"><label htmlFor="dict-entry-value">值</label><input id="dict-entry-value" value={entryForm.value} onChange={event => setEntryForm({ ...entryForm, value: event.target.value })} placeholder={entryForm.code === PLATFORM_FEE_CODE ? '例如 15%' : '请输入字典值'} /></div>
          <div className="admin-dict-form-row"><label htmlFor="dict-entry-status">状态</label><select id="dict-entry-status" value={entryForm.enabled ? 'enabled' : 'disabled'} onChange={event => setEntryForm({ ...entryForm, enabled: event.target.value === 'enabled' })} disabled={entryForm.code === PLATFORM_FEE_CODE}><option value="enabled">启用</option><option value="disabled">停用</option></select></div>
          <div className="admin-dict-form-row"><label htmlFor="dict-entry-note">备注</label><textarea id="dict-entry-note" rows={3} value={entryForm.note} onChange={event => setEntryForm({ ...entryForm, note: event.target.value })} placeholder="可填写使用说明" /></div>
          {entryForm.code === PLATFORM_FEE_CODE && <p className="admin-dict-hint">费率仅影响新创建的服务订单，历史订单保持原费率。</p>}
          <div className="admin-dict-modal-actions"><button type="button" className="admin-dict-light-button" onClick={() => setEntryModal(null)}>取消</button><button type="button" className="admin-dict-primary-button" onClick={saveEntry}>保存</button></div>
        </div>
      </div>
    </div>}

    {categoryModal && <div className="modal-overlay admin-dict-modal-overlay" onClick={() => setCategoryModal(false)}>
      <div className="modal-content admin-dict-modal" onClick={event => event.stopPropagation()}>
        <div className="modal-header"><h3>新增分类</h3><button type="button" className="modal-close" onClick={() => setCategoryModal(false)} aria-label="关闭"><X size={17} /></button></div>
        <div className="modal-body">
          <div className="admin-dict-form-row"><label htmlFor="dict-category-name">分类名称</label><input id="dict-category-name" value={categoryForm.name} onChange={event => setCategoryForm({ ...categoryForm, name: event.target.value })} placeholder="例如 服务配置" autoFocus /></div>
          <div className="admin-dict-form-row"><label htmlFor="dict-category-code">分类编码</label><input id="dict-category-code" value={categoryForm.code} onChange={event => setCategoryForm({ ...categoryForm, code: event.target.value })} placeholder="例如 SERVICE_CONFIG" /></div>
          <div className="admin-dict-form-row"><label htmlFor="dict-category-group">所属分组</label><input id="dict-category-group" value={categoryForm.group} onChange={event => setCategoryForm({ ...categoryForm, group: event.target.value })} list="admin-dict-groups" /><datalist id="admin-dict-groups">{groups.map(group => <option key={group} value={group} />)}</datalist></div>
          <div className="admin-dict-modal-actions"><button type="button" className="admin-dict-light-button" onClick={() => setCategoryModal(false)}>取消</button><button type="button" className="admin-dict-primary-button" onClick={saveCategory}>保存</button></div>
        </div>
      </div>
    </div>}
  </div>;
}
