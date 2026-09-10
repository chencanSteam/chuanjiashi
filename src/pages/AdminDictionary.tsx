import { useMemo, useState } from 'react';
import { Check, Edit3, Plus, RefreshCw, Search, Tags, Trash2, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { industryOccupations } from '../data/occupations';
import './AdminDictionary.css';

type DictionaryLevel = '行业' | '职业';

type DictionaryItem = {
  id: string;
  name: string;
  code: string;
  parent: string;
  level: DictionaryLevel;
  enabled: boolean;
  updatedAt: string;
};

type DictionaryForm = {
  name: string;
  level: DictionaryLevel;
  parent: string;
};

const STORAGE_KEY = 'cj_admin_dictionary_rows';

function createInitialItems(): DictionaryItem[] {
  const items: DictionaryItem[] = [];
  Object.entries(industryOccupations).forEach(([industry, occupations], industryIndex) => {
    const industryCode = 'INDUSTRY_' + String(industryIndex + 1).padStart(2, '0');
    items.push({
      id: 'industry-' + (industryIndex + 1),
      name: industry,
      code: industryCode,
      parent: '—',
      level: '行业',
      enabled: true,
      updatedAt: '2026-09-08 10:30:00',
    });

    occupations.forEach((occupation, occupationIndex) => {
      items.push({
        id: 'occupation-' + (industryIndex + 1) + '-' + (occupationIndex + 1),
        name: occupation,
        code:
          'JOB_' +
          String(industryIndex + 1).padStart(2, '0') +
          '_' +
          String(occupationIndex + 1).padStart(2, '0'),
        parent: industry,
        level: '职业',
        enabled: true,
        updatedAt: '2026-09-08 10:30:00',
      });
    });
  });
  return items;
}

function loadItems(): DictionaryItem[] {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as DictionaryItem[];
  } catch {
    // 原型环境下读取失败时直接使用默认 mock 数据。
  }
  return createInitialItems();
}

function getNowText() {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date()).replaceAll('/', '-');
}

export default function AdminDictionary() {
  const { addToast: showToast } = useToast();
  const [items, setItems] = useState<DictionaryItem[]>(loadItems);
  const [keyword, setKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | DictionaryLevel>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [modal, setModal] = useState<DictionaryItem | 'create' | null>(null);
  const [form, setForm] = useState<DictionaryForm>({
    name: '',
    level: '行业',
    parent: '',
  });

  const industries = useMemo(
    () => items.filter((item) => item.level === '行业'),
    [items],
  );

  const filteredItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return items.filter((item) => {
      const matchedKeyword =
        !normalizedKeyword ||
        item.name.toLowerCase().includes(normalizedKeyword) ||
        item.code.toLowerCase().includes(normalizedKeyword) ||
        item.parent.toLowerCase().includes(normalizedKeyword);
      const matchedLevel = levelFilter === 'all' || item.level === levelFilter;
      const matchedStatus =
        statusFilter === 'all' ||
        (statusFilter === 'enabled' && item.enabled) ||
        (statusFilter === 'disabled' && !item.enabled);
      return matchedKeyword && matchedLevel && matchedStatus;
    });
  }, [items, keyword, levelFilter, statusFilter]);

  const persist = (nextItems: DictionaryItem[]) => {
    setItems(nextItems);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
  };

  const openCreate = () => {
    setForm({ name: '', level: '行业', parent: industries[0]?.name ?? '' });
    setModal('create');
  };

  const openEdit = (item: DictionaryItem) => {
    setForm({ name: item.name, level: item.level, parent: item.parent === '—' ? '' : item.parent });
    setModal(item);
  };

  const closeModal = () => setModal(null);

  const saveItem = () => {
    const name = form.name.trim();
    if (!name) {
      showToast('请输入字典项名称', 'error');
      return;
    }
    if (form.level === '职业' && !form.parent) {
      showToast('请选择所属行业', 'error');
      return;
    }

    const editingId = typeof modal === 'object' && modal ? modal.id : '';
    const duplicate = items.some(
      (item) =>
        item.id !== editingId &&
        item.name === name &&
        item.level === form.level &&
        (form.level === '行业' || item.parent === form.parent),
    );
    if (duplicate) {
      showToast('相同层级下已存在同名字典项', 'error');
      return;
    }

    if (modal === 'create') {
      const sameLevelCount = items.filter((item) => item.level === form.level).length + 1;
      const prefix = form.level === '行业' ? 'INDUSTRY' : 'JOB';
      const newItem: DictionaryItem = {
        id: form.level + '-' + Date.now(),
        name,
        code: prefix + '_' + String(sameLevelCount).padStart(2, '0'),
        parent: form.level === '行业' ? '—' : form.parent,
        level: form.level,
        enabled: true,
        updatedAt: getNowText(),
      };
      persist([...items, newItem]);
      showToast('字典项已新增', 'success');
    } else if (modal) {
      persist(
        items.map((item) =>
          item.id === modal.id
            ? {
                ...item,
                name,
                level: form.level,
                parent: form.level === '行业' ? '—' : form.parent,
                updatedAt: getNowText(),
              }
            : item,
        ),
      );
      showToast('字典项已保存', 'success');
    }
    closeModal();
  };

  const toggleItem = (item: DictionaryItem) => {
    persist(
      items.map((current) =>
        current.id === item.id
          ? { ...current, enabled: !current.enabled, updatedAt: getNowText() }
          : current,
      ),
    );
    showToast(item.enabled ? '字典项已停用' : '字典项已启用', 'success');
  };

  const removeItem = (item: DictionaryItem) => {
    const nextItems =
      item.level === '行业'
        ? items.filter((current) => current.id !== item.id && current.parent !== item.name)
        : items.filter((current) => current.id !== item.id);
    persist(nextItems);
    showToast(item.level === '行业' ? '行业及其职业已删除' : '字典项已删除', 'success');
  };

  return (
    <div className="admin-dict-page">
      <div className="admin-dict-page-header">
        <div>
          <h1>数据字典</h1>
          <p className="admin-dict-page-desc">统一维护系统中的行业、职业等基础选项。</p>
        </div>
      </div>

      <section className="admin-dict-card">
        <div className="admin-dict-toolbar">
          <div className="admin-dict-search">
            <Search size={16} />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索名称、编码、上级字典"
            />
          </div>
          <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value as typeof levelFilter)}>
            <option value="all">全部层级</option>
            <option value="行业">行业</option>
            <option value="职业">职业</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            <option value="all">全部状态</option>
            <option value="enabled">已启用</option>
            <option value="disabled">已停用</option>
          </select>
          <div className="admin-dict-toolbar-actions">
            <button
              type="button"
              className="admin-dict-light-button"
              onClick={() => {
                setKeyword('');
                setLevelFilter('all');
                setStatusFilter('all');
                setItems(loadItems());
              }}
            >
              <RefreshCw size={14} />
              重置
            </button>
            <button type="button" className="admin-dict-primary-button" onClick={openCreate}>
              <Plus size={15} />
              新增字典项
            </button>
          </div>
        </div>

        <div className="admin-dict-table-head">
          <span>字典项</span>
          <span>编码</span>
          <span>层级</span>
          <span>上级字典</span>
          <span>状态</span>
          <span>更新时间</span>
          <span>操作</span>
        </div>

        {filteredItems.length > 0 ? (
          <div className="admin-dict-table-body">
            {filteredItems.map((item, index) => (
              <div className="admin-dict-table-row" key={item.id}>
                <div className="admin-dict-name">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <Tags size={15} />
                  <strong>{item.name}</strong>
                </div>
                <span className="admin-dict-code">{item.code}</span>
                <span>{item.level}</span>
                <span className="admin-dict-muted">{item.parent}</span>
                <span className={'admin-dict-status ' + (item.enabled ? 'enabled' : 'disabled')}>
                  {item.enabled ? '已启用' : '已停用'}
                </span>
                <span className="admin-dict-muted">{item.updatedAt}</span>
                <div className="admin-dict-actions">
                  <button type="button" className="admin-dict-link" onClick={() => openEdit(item)}>
                    <Edit3 size={13} />
                    编辑
                  </button>
                  <button type="button" className="admin-dict-link" onClick={() => toggleItem(item)}>
                    <Check size={13} />
                    {item.enabled ? '停用' : '启用'}
                  </button>
                  <button type="button" className="admin-dict-link danger" onClick={() => removeItem(item)}>
                    <Trash2 size={13} />
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-dict-empty">没有符合条件的字典项</div>
        )}

        <div className="admin-dict-table-footer">
          共 {filteredItems.length} 条，行业 {items.filter((item) => item.level === '行业').length} 个，职业{' '}
          {items.filter((item) => item.level === '职业').length} 个
        </div>
      </section>

      {modal && (
        <div className="modal-overlay admin-dict-modal-overlay" onClick={closeModal}>
          <div className="modal-content admin-dict-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal === 'create' ? '新增字典项' : '编辑字典项'}</h3>
              <button type="button" className="modal-close" onClick={closeModal} aria-label="关闭">
                <X size={17} />
              </button>
            </div>
            <div className="modal-body">
              <div className="admin-dict-form-row">
                <label htmlFor="dictionary-name">名称</label>
                <input
                  id="dictionary-name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="请输入字典项名称"
                  autoFocus
                />
              </div>
              <div className="admin-dict-form-row">
                <label htmlFor="dictionary-level">层级</label>
                <select
                  id="dictionary-level"
                  value={form.level}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      level: event.target.value as DictionaryLevel,
                      parent: event.target.value === '行业' ? '' : industries[0]?.name ?? '',
                    })
                  }
                >
                  <option value="行业">行业</option>
                  <option value="职业">职业</option>
                </select>
              </div>
              {form.level === '职业' && (
                <div className="admin-dict-form-row">
                  <label htmlFor="dictionary-parent">所属行业</label>
                  <select
                    id="dictionary-parent"
                    value={form.parent}
                    onChange={(event) => setForm({ ...form, parent: event.target.value })}
                  >
                    <option value="">请选择所属行业</option>
                    {industries.map((industry) => (
                      <option key={industry.id} value={industry.name}>
                        {industry.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="admin-dict-modal-actions">
                <button type="button" className="admin-dict-light-button" onClick={closeModal}>
                  取消
                </button>
                <button type="button" className="admin-dict-primary-button" onClick={saveItem}>
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
