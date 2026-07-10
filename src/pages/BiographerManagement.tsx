import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Search,
  User,
  Phone,
  Mail,
  Briefcase,
  Clock,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Users,
  Camera,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { useToast } from '../hooks/useToast';
import { biographerApi } from '../api/biographer';
import { getStatusLabel } from '../data/biographerData';
import type { Biographer as MockBiographer } from '../mocks/types';
import type { Biographer, BiographerFormData, BiographerStatus } from '../types/biographer';
import BiographerProfile from './BiographerProfile';
import './BiographerManagement.css';

const emptyForm: BiographerFormData = {
  name: '',
  phone: '',
  email: '',
  intro: '',
  specialties: [],
  experience: 0,
  status: 'pending',
};

export default function BiographerManagement() {
  const { addToast } = useToast();
  const [biographers, setBiographers] = useState<Biographer[]>([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<BiographerStatus | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Biographer | null>(null);
  const [form, setForm] = useState<BiographerFormData>(emptyForm);
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [showDelete, setShowDelete] = useState<Biographer | null>(null);
  const [selectedBiographerId, setSelectedBiographerId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    biographerApi
      .adminList()
      .then((list) => setBiographers(list.map(mapMockBiographer)))
      .catch(() => setBiographers([]));
  }, []);

  const filtered = useMemo(() => {
    return biographers.filter((item) => {
      const matchKeyword =
        !keyword ||
        item.name.includes(keyword) ||
        item.phone.includes(keyword) ||
        item.email?.includes(keyword) ||
        item.intro.includes(keyword);
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchKeyword && matchStatus;
    });
  }, [biographers, keyword, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: biographers.length,
      active: biographers.filter((b) => b.status === 'active').length,
      pending: biographers.filter((b) => b.status === 'pending').length,
      inactive: biographers.filter((b) => b.status === 'inactive').length,
    };
  }, [biographers]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSpecialtyInput('');
    setShowModal(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setForm((prev) => ({ ...prev, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setForm((prev) => ({ ...prev, avatar: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openEdit = (item: Biographer) => {
    setEditing(item);
    setForm({
      name: item.name,
      phone: item.phone,
      email: item.email || '',
      intro: item.intro,
      specialties: [...item.specialties],
      experience: item.experience,
      status: item.status,
    });
    setSpecialtyInput('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      addToast('请填写姓名和手机号', 'error');
      return;
    }
    try {
      if (editing) {
        await biographerApi.update(editing.id, toMockBiographerData(form));
        addToast('传记师信息已更新', 'success');
      } else {
        await biographerApi.create(toMockBiographerData(form));
        addToast('传记师新增成功', 'success');
      }
      const list = await biographerApi.adminList();
      setBiographers(list.map(mapMockBiographer));
      closeModal();
    } catch (err: any) {
      addToast(err.message || '操作失败', 'error');
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    try {
      await biographerApi.delete(showDelete.id);
      const list = await biographerApi.adminList();
      setBiographers(list.map(mapMockBiographer));
      setShowDelete(null);
      addToast('传记师已删除', 'success');
    } catch (err: any) {
      addToast(err.message || '删除失败', 'error');
    }
  };

  const addSpecialty = () => {
    const value = specialtyInput.trim();
    if (!value) return;
    if (form.specialties.includes(value)) {
      addToast('该专长已存在', 'error');
      return;
    }
    setForm((prev) => ({ ...prev, specialties: [...prev.specialties, value] }));
    setSpecialtyInput('');
  };

  const removeSpecialty = (value: string) => {
    setForm((prev) => ({ ...prev, specialties: prev.specialties.filter((s) => s !== value) }));
  };

  return (
    <div className="biographer-management-page">
      <header className="page-header">
        <h1 className="page-title">传记师管理</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> 新增传记师
        </button>
      </header>

      <div className="bio-stats">
        <div className="card bio-stat-card">
          <div className="bio-stat-icon" style={{ color: '#1B5E4B', background: 'rgba(27,94,75,0.08)' }}>
            <Users size={20} />
          </div>
          <div className="bio-stat-value">{stats.total}</div>
          <div className="bio-stat-label">传记师总数</div>
        </div>
        <div className="card bio-stat-card">
          <div className="bio-stat-icon" style={{ color: '#1B5E4B', background: 'rgba(27,94,75,0.08)' }}>
            <CheckCircle size={20} />
          </div>
          <div className="bio-stat-value">{stats.active}</div>
          <div className="bio-stat-label">已启用</div>
        </div>
        <div className="card bio-stat-card">
          <div className="bio-stat-icon" style={{ color: '#d97706', background: 'rgba(217,119,6,0.1)' }}>
            <Clock size={20} />
          </div>
          <div className="bio-stat-value">{stats.pending}</div>
          <div className="bio-stat-label">待审核</div>
        </div>
        <div className="card bio-stat-card">
          <div className="bio-stat-icon" style={{ color: '#6b7280', background: '#f3f4f6' }}>
            <AlertCircle size={20} />
          </div>
          <div className="bio-stat-value">{stats.inactive}</div>
          <div className="bio-stat-label">已停用</div>
        </div>
      </div>

      <div className="card bio-list-card">
        <div className="card-header bio-list-header">
          <div className="bio-filters">
            <div className="bio-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="搜索姓名、手机号、邮箱…"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as BiographerStatus | 'all')}>
              <option value="all">全部状态</option>
              <option value="active">已启用</option>
              <option value="pending">待审核</option>
              <option value="inactive">已停用</option>
            </select>
          </div>
        </div>
        <div className="card-body bio-list-body">
          {filtered.length === 0 ? (
            <div className="bio-empty">暂无符合条件的传记师</div>
          ) : (
            <div className="bio-table">
              <div className="bio-row bio-header">
                <div className="bio-cell bio-cell-name">传记师</div>
                <div className="bio-cell bio-cell-contact">联系方式</div>
                <div className="bio-cell bio-cell-specialty">专长</div>
                <div className="bio-cell bio-cell-exp">经验</div>
                <div className="bio-cell bio-cell-status">状态</div>
                <div className="bio-cell bio-cell-action">操作</div>
              </div>
              {filtered.map((item) => (
                <div className="bio-row" key={item.id}>
                  <div className="bio-cell bio-cell-name bio-cell-clickable" onClick={() => setSelectedBiographerId(item.id)}>
                    {item.avatar ? (
                      <img src={item.avatar} alt={item.name} className="bio-avatar" />
                    ) : (
                      <Avatar name={item.name} size={40} />
                    )}
                    <div className="bio-name-info">
                      <div className="bio-name">{item.name}</div>
                      <div className="bio-intro" title={item.intro}>{item.intro}</div>
                    </div>
                  </div>
                  <div className="bio-cell bio-cell-contact">
                    <div className="bio-contact-item"><Phone size={12} /> {item.phone}</div>
                    <div className="bio-contact-item"><Mail size={12} /> {item.email}</div>
                  </div>
                  <div className="bio-cell bio-cell-specialty">
                    <div className="bio-tags">
                      {item.specialties.map((tag) => (
                        <span className="bio-tag" key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bio-cell bio-cell-exp">{item.experience} 年</div>
                  <div className="bio-cell bio-cell-status">
                    <span className={`bio-status ${item.status}`}>{getStatusLabel(item.status)}</span>
                  </div>
                  <div className="bio-cell bio-cell-action">
                    <button className="icon-btn" title="编辑" onClick={() => openEdit(item)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="icon-btn" title="删除" onClick={() => setShowDelete(item)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content bio-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{editing ? '编辑传记师' : '新增传记师'}</h4>
              <button className="modal-close" onClick={closeModal}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>头像</label>
                <div className="bio-avatar-upload">
                  {form.avatar ? (
                    <div className="bio-avatar-preview">
                      <img src={form.avatar} alt="avatar" />
                      <button className="bio-avatar-remove" onClick={removeAvatar} title="移除头像"><X size={12} /></button>
                    </div>
                  ) : (
                    <div className="bio-avatar-placeholder" onClick={() => fileInputRef.current?.click()}>
                      <Camera size={20} />
                      <span>上传头像</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleAvatarChange}
                  />
                  {form.avatar && (
                    <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>更换头像</button>
                  )}
                </div>
                <p className="bio-avatar-tip">支持 JPG/PNG，建议 1:1 比例，最大 2MB</p>
              </div>

              <div className="form-row">
                <label><User size={12} /> 姓名</label>
                <input type="text" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="请输入姓名" />
              </div>
              <div className="form-row">
                <label><Phone size={12} /> 手机号</label>
                <input type="text" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="请输入手机号" />
              </div>
              <div className="form-row">
                <label><Mail size={12} /> 邮箱</label>
                <input type="text" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="请输入邮箱" />
              </div>
              <div className="form-row">
                <label><Briefcase size={12} /> 从业年限</label>
                <input type="number" min={0} value={form.experience} onChange={(e) => setForm((prev) => ({ ...prev, experience: Number(e.target.value) }))} />
              </div>
              <div className="form-row">
                <label>状态</label>
                <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as BiographerStatus }))}>
                  <option value="pending">待审核</option>
                  <option value="active">已启用</option>
                  <option value="inactive">已停用</option>
                </select>
              </div>
              <div className="form-row">
                <label>专长标签</label>
                <div className="bio-specialty-input">
                  <input
                    type="text"
                    value={specialtyInput}
                    onChange={(e) => setSpecialtyInput(e.target.value)}
                    placeholder="输入专长后按回车添加"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSpecialty(); } }}
                  />
                  <button className="btn btn-outline" onClick={addSpecialty}>添加</button>
                </div>
                <div className="bio-tags" style={{ marginTop: 8 }}>
                  {form.specialties.map((tag) => (
                    <span className="bio-tag editable" key={tag}>
                      {tag}
                      <button onClick={() => removeSpecialty(tag)}><X size={10} /></button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="form-row">
                <label>个人简介</label>
                <textarea
                  rows={3}
                  value={form.intro}
                  onChange={(e) => setForm((prev) => ({ ...prev, intro: e.target.value }))}
                  placeholder="请输入个人简介"
                />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={handleSubmit}>
                {editing ? '保存修改' : '确认新增'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>确认删除</h4>
              <button className="modal-close" onClick={() => setShowDelete(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#6b7280', fontSize: 13 }}>删除后，传记师「{showDelete.name}」的数据将无法恢复，是否继续？</p>
              <div className="bio-delete-actions">
                <button className="btn btn-outline" onClick={() => setShowDelete(null)}>取消</button>
                <button className="btn btn-danger" onClick={handleDelete}>确认删除</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedBiographerId && (
        <div className="modal-overlay bio-profile-modal-overlay" onClick={() => setSelectedBiographerId(null)}>
          <div className="modal-content bio-profile-modal" onClick={(e) => e.stopPropagation()}>
            <BiographerProfile
              biographerId={selectedBiographerId}
              embedded
              onClose={() => setSelectedBiographerId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function mapMockBiographer(b: MockBiographer): Biographer {
  const statusMap: Record<MockBiographer['status'], BiographerStatus> = {
    approved: 'active',
    suspended: 'inactive',
    rejected: 'inactive',
    pending: 'pending',
  };
  return {
    id: b.id,
    name: b.name,
    phone: b.phone,
    email: b.email || '',
    avatar: b.avatar,
    intro: b.intro,
    specialties: b.specialties,
    experience: b.experience || 0,
    status: statusMap[b.status],
    createdAt: b.createdAt,
  };
}

function toMockBiographerData(form: BiographerFormData): Partial<MockBiographer> {
  const statusMap: Record<BiographerStatus, MockBiographer['status']> = {
    active: 'approved',
    inactive: 'suspended',
    pending: 'pending',
  };
  return {
    name: form.name,
    phone: form.phone,
    email: form.email,
    avatar: form.avatar,
    intro: form.intro,
    specialties: form.specialties,
    experience: form.experience,
    status: statusMap[form.status],
    city: '未知城市',
    services: [],
    cases: [],
    deposit: 0,
  };
}
