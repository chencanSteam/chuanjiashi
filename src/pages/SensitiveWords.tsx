import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Tags, X as XIcon } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { sensitiveWordsApi } from '../api/sensitiveWords';
import type { SensitiveWord, SensitiveWordAction, SensitiveWordCategory } from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import './SensitiveWords.css';

const categoryMap: Record<SensitiveWordCategory, { label: string; className: string }> = {
  politics: { label: '政治敏感', className: 'sw-badge cat-politics' },
  porn: { label: '色情低俗', className: 'sw-badge cat-porn' },
  violence: { label: '暴力恐怖', className: 'sw-badge cat-violence' },
  ads: { label: '广告营销', className: 'sw-badge cat-ads' },
  abuse: { label: '人身攻击', className: 'sw-badge cat-abuse' },
  custom: { label: '自定义', className: 'sw-badge cat-custom' },
};

const actionMap: Record<SensitiveWordAction, { label: string; className: string; desc: string }> = {
  block: { label: '直接拦截', className: 'sw-badge act-block', desc: '内容直接拦截，不展示' },
  review: { label: '转人工复核', className: 'sw-badge act-review', desc: '内容标记后转人工复核' },
  replace: { label: '自动替换', className: 'sw-badge act-replace', desc: '自动替换为指定字符' },
};

const formatTime = (iso: string) => new Date(iso).toLocaleString('zh-CN', { hour12: false });

export default function SensitiveWords() {
  const { addToast } = useToast();
  const [words, setWords] = useState<SensitiveWord[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'all' | SensitiveWordCategory>('all');
  const [actionFilter, setActionFilter] = useState<'all' | SensitiveWordAction>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [keyword, setKeyword] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SensitiveWord | null>(null);
  const [formWords, setFormWords] = useState('');
  const [formCategory, setFormCategory] = useState<SensitiveWordCategory>('custom');
  const [formAction, setFormAction] = useState<SensitiveWordAction>('block');
  const [formReplacement, setFormReplacement] = useState('**');
  const [submitting, setSubmitting] = useState(false);
  const [showDelete, setShowDelete] = useState<SensitiveWord | null>(null);

  const load = () => {
    sensitiveWordsApi
      .list()
      .then((list) => setWords(list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))))
      .catch(() => setWords([]));
  };

  useEffect(load, []);

  const stats = useMemo(() => ({
    total: words.length,
    enabled: words.filter((w) => w.enabled).length,
    block: words.filter((w) => w.action === 'block').length,
    review: words.filter((w) => w.action === 'review').length,
  }), [words]);

  const filtered = useMemo(() => words.filter((w) => {
    if (categoryFilter !== 'all' && w.category !== categoryFilter) return false;
    if (actionFilter !== 'all' && w.action !== actionFilter) return false;
    if (statusFilter === 'enabled' && !w.enabled) return false;
    if (statusFilter === 'disabled' && w.enabled) return false;
    if (keyword && !w.word.includes(keyword.trim())) return false;
    return true;
  }), [words, categoryFilter, actionFilter, statusFilter, keyword]);

  const openCreate = () => {
    setEditing(null);
    setFormWords('');
    setFormCategory('custom');
    setFormAction('block');
    setFormReplacement('**');
    setShowForm(true);
  };

  const openEdit = (item: SensitiveWord) => {
    setEditing(item);
    setFormWords(item.word);
    setFormCategory(item.category);
    setFormAction(item.action);
    setFormReplacement(item.replacement || '**');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    if (!formWords.trim()) {
      addToast('请录入敏感词', 'error');
      return;
    }
    try {
      setSubmitting(true);
      if (editing) {
        await sensitiveWordsApi.update(editing.id, {
          word: formWords.trim(),
          category: formCategory,
          action: formAction,
          replacement: formAction === 'replace' ? formReplacement : undefined,
        });
        addToast('敏感词已更新', 'success');
      } else {
        const list = await sensitiveWordsApi.createBatch({
          words: formWords.split('\n'),
          category: formCategory,
          action: formAction,
          replacement: formAction === 'replace' ? formReplacement : undefined,
        });
        setWords(list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
        addToast('敏感词新增成功', 'success');
      }
      if (editing) load();
      closeForm();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (item: SensitiveWord) => {
    try {
      const updated = await sensitiveWordsApi.toggleStatus(item.id, !item.enabled);
      setWords((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      addToast(updated.enabled ? `「${item.word}」已启用` : `「${item.word}」已停用`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    try {
      await sensitiveWordsApi.remove(showDelete.id);
      setWords((prev) => prev.filter((w) => w.id !== showDelete.id));
      addToast(`「${showDelete.word}」已删除`, 'success');
      setShowDelete(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : '删除失败', 'error');
    }
  };

  return (
    <div className="sensitive-words-page">
      <header className="page-header">
        <h1 className="page-title">敏感词库</h1>
        <Annotate id="sensitive-words.form" inline>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> 新增敏感词
        </button>
        </Annotate>
      </header>

      <div className="sw-stats">
        <div className="card sw-stat-card"><div className="sw-stat-value">{stats.total}</div><div className="sw-stat-label">词库总数</div></div>
        <div className="card sw-stat-card"><div className="sw-stat-value">{stats.enabled}</div><div className="sw-stat-label">启用中</div></div>
        <div className="card sw-stat-card"><div className="sw-stat-value">{stats.block}</div><div className="sw-stat-label">直接拦截</div></div>
        <div className="card sw-stat-card"><div className="sw-stat-value">{stats.review}</div><div className="sw-stat-label">转人工复核</div></div>
      </div>

      <div className="card sw-list-card">
        <div className="card-header sw-list-header">
          <Annotate id="sensitive-words.filter">
          <div className="sw-filters">
            <div className="sw-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="搜索敏感词…"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}>
              <option value="all">全部分类</option>
              {(Object.keys(categoryMap) as SensitiveWordCategory[]).map((key) => (
                <option value={key} key={key}>{categoryMap[key].label}</option>
              ))}
            </select>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value as typeof actionFilter)}>
              <option value="all">全部处置方式</option>
              {(Object.keys(actionMap) as SensitiveWordAction[]).map((key) => (
                <option value={key} key={key}>{actionMap[key].label}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
              <option value="all">全部状态</option>
              <option value="enabled">启用</option>
              <option value="disabled">停用</option>
            </select>
          </div>
          </Annotate>
        </div>
        <div className="card-body sw-list-body">
          {filtered.length === 0 ? (
            <div className="admin-table-empty">暂无敏感词</div>
          ) : (
            <Annotate id="sensitive-words.table">
            <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>敏感词</th>
                  <th>分类</th>
                  <th>处置方式</th>
                  <th>状态</th>
                  <th>累计命中</th>
                  <th>更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td><span className="sw-word">{item.word}</span></td>
                  <td><span className={categoryMap[item.category].className}>{categoryMap[item.category].label}</span></td>
                  <td>
                    <span className={actionMap[item.action].className}>{actionMap[item.action].label}</span>
                    {item.action === 'replace' && (
                      <div className="admin-table-muted">替换为 {item.replacement || '**'}</div>
                    )}
                  </td>
                  <td>
                    <span className={`sw-badge ${item.enabled ? 'st-enabled' : 'st-disabled'}`}>{item.enabled ? '启用' : '停用'}</span>
                  </td>
                  <td>{item.hitCount}</td>
                  <td>{formatTime(item.updatedAt)}</td>
                  <td>
                    <button className="admin-table-link" onClick={() => openEdit(item)}>编辑</button>
                    <button className="admin-table-link" onClick={() => handleToggle(item)}>{item.enabled ? '停用' : '启用'}</button>
                    <button className="admin-table-link danger" onClick={() => setShowDelete(item)}>删除</button>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
            </div>
            </Annotate>
          )}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{editing ? '编辑敏感词' : '新增敏感词'}</h4>
              <button className="modal-close" onClick={closeForm}><XIcon size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label><Tags size={12} /> 敏感词{!editing && '（支持批量录入）'}</label>
                {editing ? (
                  <input
                    type="text"
                    value={formWords}
                    onChange={(e) => setFormWords(e.target.value)}
                    placeholder="请输入敏感词"
                  />
                ) : (
                  <textarea
                    rows={4}
                    value={formWords}
                    onChange={(e) => setFormWords(e.target.value)}
                    placeholder={'每行一个，或用顿号、逗号分隔，例如：\n敏感词甲\n敏感词乙、敏感词丙'}
                  />
                )}
              </div>
              <div className="form-row">
                <label>分类</label>
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as SensitiveWordCategory)}>
                  {(Object.keys(categoryMap) as SensitiveWordCategory[]).map((key) => (
                    <option value={key} key={key}>{categoryMap[key].label}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>处置方式</label>
                <div className="sw-action-options">
                  {(Object.keys(actionMap) as SensitiveWordAction[]).map((key) => (
                    <label className={`sw-action-option ${formAction === key ? 'active' : ''}`} key={key}>
                      <input
                        type="radio"
                        name="sw-action"
                        checked={formAction === key}
                        onChange={() => setFormAction(key)}
                      />
                      <span className="sw-action-option-label">{actionMap[key].label}</span>
                      <span className="sw-action-option-desc">{actionMap[key].desc}</span>
                    </label>
                  ))}
                </div>
              </div>
              {formAction === 'replace' && (
                <div className="form-row">
                  <label>替换文案</label>
                  <input
                    type="text"
                    value={formReplacement}
                    onChange={(e) => setFormReplacement(e.target.value)}
                    placeholder="默认 **"
                  />
                </div>
              )}
              <div className="sw-form-actions">
                <button className="btn btn-outline" onClick={closeForm}>取消</button>
                <button className="btn btn-primary" disabled={submitting} onClick={handleSubmit}>
                  {submitting ? '提交中…' : editing ? '保存' : '确认新增'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(null)}>
          <div className="modal-content sw-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>删除敏感词</h4>
              <button className="modal-close" onClick={() => setShowDelete(null)}><XIcon size={16} /></button>
            </div>
            <div className="modal-body">
              <p className="sw-confirm-text">确定要删除敏感词「{showDelete.word}」吗？删除后新内容将不再命中该词，历史命中记录保留。</p>
              <div className="sw-form-actions">
                <button className="btn btn-outline" onClick={() => setShowDelete(null)}>取消</button>
                <button className="btn btn-danger" onClick={handleDelete}>确认删除</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
