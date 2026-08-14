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
  Star,
  Award,
  Medal,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { useToast } from '../hooks/useToast';
import { biographerApi } from '../api/biographer';
import { biographerEarningsApi } from '../api/biographerEarnings';
import { getStatusLabel } from '../data/biographerData';
import type { Biographer as MockBiographer, BiographerDepositRecord, BiographerPenaltyRecord } from '../mocks/types';
import type { Biographer, BiographerFormData, BiographerStatus } from '../types/biographer';
import BiographerProfile from './BiographerProfile';
import Annotate from '../components/annotation/Annotate';
import './BiographerManagement.css';

const emptyForm: BiographerFormData = {
  name: '',
  phone: '',
  email: '',
  intro: '',
  specialties: [],
  experience: 0,
  status: 'pending',
  certificationLevel: 'standard',
};

const bioTabs = [
  { key: 'list', label: '传记师列表' },
  { key: 'deposits', label: '押金管理' },
  { key: 'penalties', label: '违规处罚' },
] as const;

type BioTabKey = (typeof bioTabs)[number]['key'];

const depositStatusLabels: Record<BiographerDepositRecord['status'], string> = {
  paid: '已缴纳',
  refunded: '已退还',
  deducted: '已扣除',
};

const violationTypeOptions = ['私单引流', '交付逾期', '服务质量', '违规内容', '其他'];
const measureOptions = ['扣款', '警告', '扣款+警告', '暂停接单', '清退'];

const emptyPenaltyForm = {
  biographerId: '',
  violationType: violationTypeOptions[0],
  measure: measureOptions[0],
  amount: '',
  reason: '',
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

  const [activeTab, setActiveTab] = useState<BioTabKey>('list');
  const [deposits, setDeposits] = useState<BiographerDepositRecord[]>([]);
  const [penalties, setPenalties] = useState<BiographerPenaltyRecord[]>([]);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [penaltyForm, setPenaltyForm] = useState(emptyPenaltyForm);
  const [penaltySubmitting, setPenaltySubmitting] = useState(false);

  useEffect(() => {
    biographerApi
      .adminList()
      .then((list) => setBiographers(list.map(mapMockBiographer)))
      .catch(() => setBiographers([]));
  }, []);

  useEffect(() => {
    if (activeTab === 'deposits') {
      biographerEarningsApi.adminDeposits().then(setDeposits).catch(() => setDeposits([]));
    }
    if (activeTab === 'penalties') {
      biographerEarningsApi.adminPenalties().then(setPenalties).catch(() => setPenalties([]));
    }
  }, [activeTab]);

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
      certificationLevel: item.certificationLevel || 'standard',
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

  const handleReview = async (item: Biographer, action: 'approve' | 'reject') => {
    let reason: string | undefined;
    if (action === 'reject') {
      const input = window.prompt('请输入驳回原因', '资质材料不符合要求，请修改后重新提交。');
      if (input === null) return;
      reason = input;
    }
    try {
      await biographerApi.review(item.id, action, reason);
      const list = await biographerApi.adminList();
      setBiographers(list.map(mapMockBiographer));
      addToast(action === 'approve' ? `已通过「${item.name}」的入驻审核` : `已驳回「${item.name}」的入驻申请`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    }
  };

  const handleDepositAction = async (record: BiographerDepositRecord, action: 'refund' | 'deduct') => {
    const label = action === 'refund' ? '退还' : '扣除';
    if (!window.confirm(`确定要${label}传记师「${record.biographerName}」的押金 ¥${record.amount.toLocaleString()} 吗？`)) return;
    try {
      if (action === 'refund') {
        await biographerEarningsApi.refundDeposit(record.id);
      } else {
        await biographerEarningsApi.deductDeposit(record.id);
      }
      const list = await biographerEarningsApi.adminDeposits();
      setDeposits(list);
      addToast(`押金已${label}`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    }
  };

  const handlePenaltySubmit = async () => {
    if (!penaltyForm.biographerId) {
      addToast('请选择传记师', 'error');
      return;
    }
    if (!penaltyForm.reason.trim()) {
      addToast('请填写处罚原因', 'error');
      return;
    }
    const amount = Number(penaltyForm.amount) || 0;
    if (amount < 0) {
      addToast('扣款金额无效', 'error');
      return;
    }
    try {
      setPenaltySubmitting(true);
      await biographerEarningsApi.createPenalty({
        biographerId: penaltyForm.biographerId,
        violationType: penaltyForm.violationType,
        measure: penaltyForm.measure,
        amount,
        reason: penaltyForm.reason.trim(),
      });
      const list = await biographerEarningsApi.adminPenalties();
      setPenalties(list);
      setShowPenaltyModal(false);
      setPenaltyForm(emptyPenaltyForm);
      addToast(amount > 0 ? '处罚已记录，扣款已同步扣减其可结算金额' : '处罚已记录', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    } finally {
      setPenaltySubmitting(false);
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
        {activeTab === 'list' && (
          <Annotate id="admin-biographers.add-biographer" inline>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> 新增传记师
          </button>
          </Annotate>
        )}
        {activeTab === 'penalties' && (
          <button className="btn btn-primary" onClick={() => setShowPenaltyModal(true)}>
            <Plus size={16} /> 新增处罚
          </button>
        )}
      </header>

      <Annotate id="admin-biographers.tabs">
      <div className="tabs">
        {bioTabs.map((t) => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      </Annotate>

      {activeTab === 'list' && (
      <>
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
          <Annotate id="admin-biographers.list-filter">
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
          </Annotate>
        </div>
        <div className="card-body bio-list-body">
          {filtered.length === 0 ? (
            <div className="bio-empty">暂无符合条件的传记师</div>
          ) : (
            <Annotate id="admin-biographers.list-table">
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
                      <div className="bio-name">
                        {item.name}
                        <span className={`bio-cert-badge ${item.certificationLevel || 'standard'}`}>
                          {item.certificationLevel === 'gold' && <Award size={12} />}
                          {item.certificationLevel === 'silver' && <Medal size={12} />}
                          {item.certificationLevel === 'standard' && <CheckCircle size={12} />}
                          {item.certificationLevel === 'gold' ? '金牌' : item.certificationLevel === 'silver' ? '银牌' : '标准'}
                        </span>
                      </div>
                      <div className="bio-intro" title={item.intro}>{item.intro}</div>
                      <div className="bio-rating-row">
                        <Star size={12} fill="currentColor" /> {item.rating?.toFixed(1) || '5.0'} · {item.reviewCount || 0} 条评价
                      </div>
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
                    {item.status === 'pending' && (
                      <>
                        <button className="icon-btn" title="审核通过" onClick={() => handleReview(item, 'approve')}>
                          <CheckCircle size={14} />
                        </button>
                        <button className="icon-btn" title="审核驳回" onClick={() => handleReview(item, 'reject')}>
                          <AlertCircle size={14} />
                        </button>
                      </>
                    )}
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
            </Annotate>
          )}
        </div>
      </div>
      </>
      )}

      {activeTab === 'deposits' && (
        <Annotate id="admin-biographers.deposit-table">
        <div className="card bio-list-card">
          <div className="card-body bio-list-body">
            {deposits.length === 0 ? (
              <div className="bio-empty">暂无押金记录</div>
            ) : (
              <div className="bio-table">
                <div className="bio-row bio-header bio-row-admin">
                  <div className="bio-cell bio-cell-name">传记师</div>
                  <div className="bio-cell bio-cell-contact">押金金额</div>
                  <div className="bio-cell bio-cell-specialty">缴纳时间</div>
                  <div className="bio-cell bio-cell-status">状态</div>
                  <div className="bio-cell bio-cell-action">操作</div>
                </div>
                {deposits.map((d) => (
                  <div className="bio-row bio-row-admin" key={d.id}>
                    <div className="bio-cell bio-cell-name">
                      <Avatar name={d.biographerName} size={32} />
                      <div className="bio-name-info">
                        <div className="bio-name">{d.biographerName}</div>
                      </div>
                    </div>
                    <div className="bio-cell bio-cell-contact">¥{d.amount.toLocaleString()}</div>
                    <div className="bio-cell bio-cell-specialty">{new Date(d.paidAt).toLocaleString()}</div>
                    <div className="bio-cell bio-cell-status">
                      <span className={`bio-status ${d.status === 'paid' ? 'active' : 'inactive'}`}>
                        {depositStatusLabels[d.status]}
                      </span>
                    </div>
                    <div className="bio-cell bio-cell-action">
                      {d.status === 'paid' ? (
                        <>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDepositAction(d, 'refund')}>退还押金</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDepositAction(d, 'deduct')}>扣除押金</button>
                        </>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: 12 }}>已处理</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </Annotate>
      )}

      {activeTab === 'penalties' && (
        <Annotate id="admin-biographers.penalty-table">
        <div className="card bio-list-card">
          <div className="card-body bio-list-body">
            {penalties.length === 0 ? (
              <div className="bio-empty">暂无处罚记录</div>
            ) : (
              <div className="bio-table">
                <div className="bio-row bio-header bio-row-penalty">
                  <div className="bio-cell bio-cell-name">传记师</div>
                  <div className="bio-cell">违规类型</div>
                  <div className="bio-cell">处罚措施</div>
                  <div className="bio-cell">扣款金额</div>
                  <div className="bio-cell bio-cell-specialty">原因</div>
                  <div className="bio-cell">时间</div>
                  <div className="bio-cell bio-cell-status">状态</div>
                </div>
                {penalties.map((p) => (
                  <div className="bio-row bio-row-penalty" key={p.id}>
                    <div className="bio-cell bio-cell-name">
                      <Avatar name={p.biographerName} size={32} />
                      <div className="bio-name-info">
                        <div className="bio-name">{p.biographerName}</div>
                      </div>
                    </div>
                    <div className="bio-cell">{p.violationType}</div>
                    <div className="bio-cell">{p.measure}</div>
                    <div className="bio-cell">{p.amount > 0 ? `¥${p.amount.toLocaleString()}` : '-'}</div>
                    <div className="bio-cell bio-cell-specialty" title={p.reason}>
                      <div className="bio-intro">{p.reason}</div>
                    </div>
                    <div className="bio-cell">{new Date(p.createdAt).toLocaleString()}</div>
                    <div className="bio-cell bio-cell-status">
                      <span className={`bio-status ${p.status === 'effective' ? 'pending' : 'inactive'}`}>
                        {p.status === 'effective' ? '生效中' : '已撤销'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </Annotate>
      )}

      {showPenaltyModal && (
        <Annotate id="admin-biographers.penalty-form">
        <div className="modal-overlay" onClick={() => setShowPenaltyModal(false)}>
          <div className="modal-content bio-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>新增处罚</h4>
              <button className="modal-close" onClick={() => setShowPenaltyModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label><User size={12} /> 传记师</label>
                <select
                  value={penaltyForm.biographerId}
                  onChange={(e) => setPenaltyForm((prev) => ({ ...prev, biographerId: e.target.value }))}
                >
                  <option value="">请选择传记师</option>
                  {biographers.map((b) => (
                    <option value={b.id} key={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>违规类型</label>
                <select
                  value={penaltyForm.violationType}
                  onChange={(e) => setPenaltyForm((prev) => ({ ...prev, violationType: e.target.value }))}
                >
                  {violationTypeOptions.map((t) => (
                    <option value={t} key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>处罚措施</label>
                <select
                  value={penaltyForm.measure}
                  onChange={(e) => setPenaltyForm((prev) => ({ ...prev, measure: e.target.value }))}
                >
                  {measureOptions.map((m) => (
                    <option value={m} key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>扣款金额（元）</label>
                <input
                  type="number"
                  min={0}
                  value={penaltyForm.amount}
                  onChange={(e) => setPenaltyForm((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="0 表示不扣款"
                />
              </div>
              <div className="form-row">
                <label>处罚原因</label>
                <textarea
                  rows={3}
                  value={penaltyForm.reason}
                  onChange={(e) => setPenaltyForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="请输入处罚原因"
                />
              </div>
              <p style={{ color: '#9ca3af', fontSize: 12, margin: '4px 0 0' }}>
                扣款金额将同步扣减该传记师的可结算金额，并写入其违规扣款记录。
              </p>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={penaltySubmitting} onClick={handlePenaltySubmit}>
                {penaltySubmitting ? '提交中…' : '确认提交'}
              </button>
            </div>
          </div>
        </div>
        </Annotate>
      )}

      {showModal && (
        <Annotate id="admin-biographers.biographer-form">
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
                <label>认证等级</label>
                <select value={form.certificationLevel} onChange={(e) => setForm((prev) => ({ ...prev, certificationLevel: e.target.value as Biographer['certificationLevel'] }))}>
                  <option value="gold">金牌认证</option>
                  <option value="silver">银牌认证</option>
                  <option value="standard">标准认证</option>
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
        </Annotate>
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
    certificationLevel: b.certificationLevel || 'standard',
    rating: b.rating ?? 5.0,
    reviewCount: b.reviewCount ?? 0,
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
    certificationLevel: form.certificationLevel || 'standard',
    city: '未知城市',
    services: [],
    cases: [],
    deposit: 0,
  };
}
