import { useCallback, useEffect, useMemo, useState } from 'react';
import { Tags, Plus, X as XIcon, Search } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { dictionaryApi } from '../api/dictionary';
import type { DictionaryItem, DictionaryType } from '../mocks/types';
import './AdminDictionary.css';

const PAGE_SIZE = 20;

interface DictSectionProps {
  type: DictionaryType;
  title: string;
  desc: string;
}

function DictSection({ type, title, desc }: DictSectionProps) {
  const { addToast } = useToast();
  const [items, setItems] = useState<DictionaryItem[]>([]);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DictionaryItem | null>(null);
  const [label, setLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    dictionaryApi.adminList(type).then(setItems).catch(() => setItems([]));
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = keyword.trim();
    return q ? items.filter((item) => item.label.includes(q)) : items;
  }, [items, keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setLabel('');
    setModalOpen(true);
  };

  const openEdit = (item: DictionaryItem) => {
    setEditing(item);
    setLabel(item.label);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setLabel('');
  };

  const save = async () => {
    if (!label.trim()) {
      addToast('请填写名称', 'error');
      return;
    }
    try {
      setSubmitting(true);
      if (editing) await dictionaryApi.update(editing.id, label);
      else await dictionaryApi.create(type, label);
      addToast(editing ? '已更新' : '已新增', 'success');
      closeModal();
      load();
    } catch (err: any) {
      addToast(err.message || '保存失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = async (item: DictionaryItem) => {
    try {
      await dictionaryApi.updateStatus(item.id, !item.enabled);
      load();
    } catch (err: any) {
      addToast(err.message || '状态更新失败', 'error');
    }
  };

  const remove = async (item: DictionaryItem) => {
    if (!window.confirm(`确定删除“${item.label}”吗？`)) return;
    try {
      await dictionaryApi.remove(item.id);
      addToast('已删除', 'success');
      load();
    } catch (err: any) {
      addToast(err.message || '删除失败', 'error');
    }
  };

  const move = async (item: DictionaryItem, direction: -1 | 1) => {
    const index = items.findIndex((entry) => entry.id === item.id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return;
    const ids = items.map((entry) => entry.id);
    [ids[index], ids[nextIndex]] = [ids[nextIndex], ids[index]];
    try {
      await dictionaryApi.reorder(type, ids);
      load();
    } catch (err: any) {
      addToast(err.message || '排序失败', 'error');
    }
  };

  return (
    <div className="card admin-dict-section">
      <div className="card-header admin-dict-header">
        <div>
          <h3 className="card-title"><Tags size={16} /> {title}<span className="admin-dict-count">共 {items.length} 条</span></h3>
          <p className="admin-dict-desc">{desc}</p>
        </div>
        <div className="admin-dict-tools">
          <div className="admin-dict-search">
            <Search size={13} />
            <input
              type="text"
              placeholder="搜索名称…"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> 新增</button>
        </div>
      </div>
      <div className="card-body admin-dict-body">
        <table className="admin-dict-table">
          <thead>
            <tr>
              <th className="admin-dict-col-no">序号</th>
              <th>名称</th>
              <th className="admin-dict-col-status">状态</th>
              <th className="admin-dict-col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr><td colSpan={4} className="admin-dict-empty">{keyword ? '没有匹配的结果' : '暂无数据，点击右上角「新增」创建'}</td></tr>
            ) : pageItems.map((item) => (
              <tr key={item.id}>
                <td className="admin-dict-col-no">{item.order}</td>
                <td>{item.label}</td>
                <td className="admin-dict-col-status">
                  <span className={`admin-dict-status ${item.enabled ? 'enabled' : 'disabled'}`}>
                    {item.enabled ? '已启用' : '已停用'}
                  </span>
                </td>
                <td className="admin-dict-col-actions">
                  <button className="admin-dict-link" onClick={() => openEdit(item)}>编辑</button>
                  <button className="admin-dict-link" onClick={() => toggle(item)}>{item.enabled ? '停用' : '启用'}</button>
                  <button className="admin-dict-link" disabled={item.order <= 1} onClick={() => move(item, -1)}>上移</button>
                  <button className="admin-dict-link" disabled={item.order >= items.length} onClick={() => move(item, 1)}>下移</button>
                  <button className="admin-dict-link danger" onClick={() => remove(item)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="admin-dict-pagination">
            <span>第 {currentPage} / {totalPages} 页</span>
            <button className="admin-dict-link" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>上一页</button>
            <button className="admin-dict-link" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>下一页</button>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content admin-dict-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{editing ? `编辑${title}` : `新增${title}`}</h4>
              <button className="modal-close" onClick={closeModal}><XIcon size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="admin-dict-form-row">
                <label htmlFor={`admin-dict-label-${type}`}>名称</label>
                <input
                  id={`admin-dict-label-${type}`}
                  type="text"
                  maxLength={20}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="请输入名称"
                />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={submitting} onClick={save}>
                {submitting ? '保存中…' : editing ? '保存修改' : '确认新增'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDictionary() {
  return (
    <div className="admin-dict-page">
      <header className="page-header">
        <h1 className="page-title">数据字典</h1>
      </header>
      <DictSection
        type="book_occupation"
        title="职业标签"
        desc="用户上架传记时可多选的职业标签，停用后不再出现在上架弹窗中。"
      />
      <DictSection
        type="book_life_stage"
        title="人生阶段标签"
        desc="用户上架传记时可多选的人生阶段标签，停用后不再出现在上架弹窗中。"
      />
      <DictSection
        type="sensitive_words"
        title="敏感词库"
        desc="评论与上架申请的内容将按启用中的敏感词拦截，停用后该词不再拦截。"
      />
    </div>
  );
}
