import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  User,
  Phone,
  Mail,
  Briefcase,
  X,
  CheckCircle,
  Camera,
  Star,
  Award,
  Medal,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { useToast } from '../hooks/useToast';
import { biographerApi } from '../api/biographer';
import { getStatusLabel } from '../data/biographerData';
import type { Biographer as MockBiographer } from '../mocks/types';
import type { Biographer, BiographerFormData, BiographerStatus } from '../types/biographer';
import BiographerProfile from './BiographerProfile';
import BiographerProfilePreview from '../components/BiographerProfilePreview';
import Annotate from '../components/annotation/Annotate';
import './BiographerManagement.css';
import { ENROLLMENT_EVENT, readEnrollments, enrollmentStatusLabel, enrollmentAccountForm, generateEnrollmentAccount, saveEnrollment, type Enrollment } from '../data/biographerEnrollment';
import Modal from '../components/ui/Modal';
import { EnrollmentSummary } from './BiographerApply';

const emptyForm: BiographerFormData = {
  name: '',
  phone: '',
  email: '',
  intro: '',
  specialties: [],
  experience: 0,
  status: 'active',
  certificationLevel: 'standard',
};

export default function BiographerManagement() {
  const { addToast } = useToast();
  const [biographers, setBiographers] = useState<Biographer[]>([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<BiographerStatus | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Biographer | null>(null);
  const [form, setForm] = useState<BiographerFormData>(emptyForm);
  const [showDelete, setShowDelete] = useState<Biographer | null>(null);
  const [selectedBiographerId, setSelectedBiographerId] = useState<string | null>(null);
  const [selectedProfileReview, setSelectedProfileReview] = useState<Biographer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [enrollments, setEnrollments] = useState(readEnrollments);
  const [saving, setSaving] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [generatingOwner, setGeneratingOwner] = useState<string | null>(null);
  const localRows = enrollments.filter(item => item.status === 'approved' &&
    (!keyword || [item.name, item.phone, item.intro].some(value => value.includes(keyword))) &&
    statusFilter === 'all'
  );
  const localEnrollment = (id: string) => readEnrollments().find(item => item.status === 'active' && `enrollment-${item.owner}` === id);

  useEffect(() => {
    const owner = searchParams.get('enrollment');
    if (!owner) return;
    const record = readEnrollments().find(item => item.owner === owner);
    if (record?.status === 'approved' && record.depositPaidAt) {
      setEditing(null);
      setGeneratingOwner(owner);
      setForm(enrollmentAccountForm(record));
      setShowModal(true);
    }
    const next = new URLSearchParams(searchParams);
    next.delete('enrollment');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    biographerApi.adminList().then(list => setBiographers(list.map(mapMockBiographer)))
      .catch(() => setBiographers([]));
    const refresh = () => setEnrollments(readEnrollments());
    window.addEventListener(ENROLLMENT_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener(ENROLLMENT_EVENT, refresh); window.removeEventListener('storage', refresh); };
  }, []);

  const filtered = useMemo(() => {
    const generated: Biographer[] = enrollments.filter(item => item.status === 'active').map(item => ({
      ...enrollmentAccountForm(item), id: `enrollment-${item.owner}`,
      createdAt: item.accountGeneratedAt || item.activatedAt || item.updatedAt,
    }));
    return [...generated, ...biographers].filter((item) => {
      const matchKeyword =
        !keyword ||
        item.name.includes(keyword) ||
        item.phone.includes(keyword) ||
        item.email?.includes(keyword) ||
        item.intro.includes(keyword);
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchKeyword && matchStatus;
    });
  }, [biographers, enrollments, keyword, statusFilter]);

  const openCreate = () => {
    setGeneratingOwner(null);
    setEditing(null);
    setForm(emptyForm);
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
    setGeneratingOwner(null);
    setEditing(item);
    setForm({
      avatar: item.avatar,
      name: item.name,
      phone: item.phone,
      email: item.email || '',
      intro: item.intro,
      specialties: [...item.specialties],
      experience: item.experience,
      status: item.status,
      certificationLevel: item.certificationLevel || 'standard',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setGeneratingOwner(null);
    setShowModal(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    if (saving) return;
    if (!form.name.trim() || !/^1\d{10}$/.test(form.phone.trim())) {
      addToast('请填写姓名和手机号', 'error');
      return;
    }
    if (!Number.isFinite(form.experience) || form.experience < 0) {
      addToast('请填写有效的从业年限', 'error');
      return;
    }
    setSaving(true);
    try {
      const enrollment = editing && localEnrollment(editing.id);
      if (generatingOwner || enrollment) {
        if (generatingOwner) {
          if (!generateEnrollmentAccount(generatingOwner, form)) {
            addToast('申请状态已变化，请返回申请详情查看', 'error');
            return;
          }
          addToast('演示账号生成成功', 'success');
        } else if (enrollment) {
          saveEnrollment({ ...enrollment, accountProfile: form });
          addToast('传记师信息已更新', 'success');
        }
        closeModal();
        return;
      }
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
    } finally { setSaving(false); }
  };

  const handleDisable = async () => {
    if (!showDelete) return;
    try {
      const enrollment = localEnrollment(showDelete.id);
      if (enrollment) {
        saveEnrollment({ ...enrollment, accountProfile: { ...enrollmentAccountForm(enrollment), status: 'inactive' } });
      } else {
        await biographerApi.update(showDelete.id, { status: 'suspended' });
        const list = await biographerApi.adminList();
        setBiographers(list.map(mapMockBiographer));
      }
      setShowDelete(null);
      addToast('传记师已停用', 'success');
    } catch (err: any) {
      addToast(err.message || '停用失败', 'error');
    }
  };

  const handleEnable = async (item: Biographer) => {
    try {
      const enrollment = localEnrollment(item.id);
      if (enrollment) {
        saveEnrollment({ ...enrollment, accountProfile: { ...enrollmentAccountForm(enrollment), status: 'active' } });
      } else {
        await biographerApi.update(item.id, { status: 'approved' });
        const list = await biographerApi.adminList();
        setBiographers(list.map(mapMockBiographer));
      }
      addToast('传记师已启用', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '启用失败', 'error');
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

  const handleProfileReview = async (item: Biographer, action: 'approve' | 'reject') => {
    let reason: string | undefined;
    if (action === 'reject') {
      const input = window.prompt('请输入主页驳回原因', '请补充或修改主页内容后重新提交。');
      if (input === null) return;
      reason = input.trim();
      if (!reason) {
        addToast('驳回时必须填写原因', 'error');
        return;
      }
    }
    try {
      await biographerApi.profileReview(item.id, action, reason);
      const list = await biographerApi.adminList();
      setBiographers(list.map(mapMockBiographer));
      addToast(action === 'approve' ? `已通过「${item.name}」的主页审核` : `已驳回「${item.name}」的主页修改`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '主页审核失败', 'error');
    }
  };

  return (
    <div className="biographer-management-page">
      <header className="page-header">
        <h1 className="page-title">传记师管理</h1>
        <Annotate id="admin-biographers.add-biographer" inline>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> 新增传记师
        </button>
        </Annotate>
      </header>

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
              <option value="inactive">已停用</option>
            </select>
          </div>
          </Annotate>
        </div>
        <div className="card-body bio-list-body">
          {filtered.length === 0 && localRows.length === 0 ? (
            <div className="bio-empty">暂无符合条件的传记师</div>
          ) : (
            <Annotate id="admin-biographers.list-table">
            <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>传记师</th>
                  <th>联系方式</th>
                  <th>经验</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
              {localRows.map(item => <tr key={`enrollment-${item.owner}`}>
                <td className="admin-table-text-left"><div className="bio-name-cell"><Avatar name={item.name} size={40} /><div><strong>{item.name}</strong><div className="bio-contact-item">入驻审核关联</div></div></div></td>
                <td><div className="bio-contact-item"><Phone size={12} /> {item.phone}</div><div className="bio-contact-item">{item.status === 'active' ? '演示账号手机号' : '联系手机号 · 账号尚未生成'}</div></td>
                <td>{enrollmentAccountForm(item).experience} 年</td>
                <td><span className={`bio-status ${item.status === 'active' ? 'active' : 'pending'}`}>{enrollmentStatusLabel(item)}</span></td>
                <td><button className="admin-table-link" onClick={() => setSelectedEnrollment(item)}>查看详情</button></td>
              </tr>)}
              {filtered.map((item) => {
                return (
                <tr key={item.id}>
                  <td className="admin-table-text-left">
                    <div className="bio-name-cell bio-cell-clickable" onClick={() => localEnrollment(item.id) ? openEdit(item) : setSelectedBiographerId(item.id)}>
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
                  </td>
                  <td>
                    <div className="bio-contact-item"><Phone size={12} /> {item.phone}</div>
                    <div className="bio-contact-item"><Mail size={12} /> {item.email}</div>
                  </td>
                  <td>{item.experience} 年</td>
                  <td>
                    <span className={`bio-status ${item.status}`}>{getStatusLabel(item.status)}</span>
                    {item.profileReviewStatus === 'pending' && (
                      <div style={{ marginTop: 4 }}><span className="bio-status pending">主页待审核</span></div>
                    )}
                  </td>
                  <td>
                    {item.status === 'pending' && (
                      <>
                        <button className="admin-table-link" onClick={() => handleReview(item, 'approve')}>通过</button>
                        <button className="admin-table-link danger" onClick={() => handleReview(item, 'reject')}>驳回</button>
                      </>
                    )}
                    {item.profileReviewStatus === 'pending' && (
                      <button className="admin-table-link" onClick={() => setSelectedProfileReview(item)}>主页审核</button>
                    )}
                    <button className="admin-table-link" onClick={() => openEdit(item)}>编辑</button>
                    {item.status !== 'inactive'
                      ? <button className="admin-table-link danger" onClick={() => setShowDelete(item)}>停用</button>
                      : <button className="admin-table-link" onClick={() => handleEnable(item)}>启用</button>}
                  </td>
                </tr>
                );
              })}
              </tbody>
            </table>
            </div>
            </Annotate>
          )}
        </div>
      </div>

      <Modal open={!!selectedEnrollment} title={`${selectedEnrollment?.name || ''}的入驻资料`} onClose={() => setSelectedEnrollment(null)} className="enroll-admin enroll-review-modal">
        {selectedEnrollment && <><div className="enroll-notice">{selectedEnrollment.status === 'active' ? '已关联演示账号 · 账号手机号' : '账号尚未生成 · 联系手机号'}：{selectedEnrollment.phone} · {enrollmentStatusLabel(selectedEnrollment)}</div><EnrollmentSummary record={selectedEnrollment} /></>}
      </Modal>

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
                <label>个人简介</label>
                <textarea
                  rows={3}
                  value={form.intro}
                  onChange={(e) => setForm((prev) => ({ ...prev, intro: e.target.value }))}
                  placeholder="请输入个人简介"
                />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={saving} onClick={handleSubmit}>
                {saving ? '保存中…' : editing ? '保存修改' : generatingOwner ? '确认生成账号' : '确认新增'}
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
              <h4>确认停用</h4>
              <button className="modal-close" onClick={() => setShowDelete(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#6b7280', fontSize: 13 }}>停用后，传记师「{showDelete.name}」将暂时无法接收新订单，是否继续？</p>
              <div className="bio-delete-actions">
                <button className="btn btn-outline" onClick={() => setShowDelete(null)}>取消</button>
                <button className="btn btn-danger" onClick={handleDisable}>确认停用</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProfileReview && (
        <div className="modal-overlay bio-profile-modal-overlay" onClick={() => setSelectedProfileReview(null)}>
          <div className="modal-content bio-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>审核主页：{selectedProfileReview.name}</h4><button className="modal-close" onClick={() => setSelectedProfileReview(null)}><X size={16} /></button></div>
            <div className="modal-body profile-review-modal-body">
              <BiographerProfilePreview profile={selectedProfileReview.profileDraft || selectedProfileReview} reviewMode />
            </div>
            <div className="profile-review-modal-actions">
              <button className="btn btn-ghost danger" onClick={() => { const item = selectedProfileReview; setSelectedProfileReview(null); handleProfileReview(item, 'reject'); }}>驳回修改</button>
              <button className="btn btn-primary" onClick={() => { const item = selectedProfileReview; setSelectedProfileReview(null); handleProfileReview(item, 'approve'); }}>通过并发布</button>
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
    profileReviewStatus: b.profileReviewStatus,
    profileRejectReason: b.profileRejectReason,
    profileSubmittedAt: b.profileSubmittedAt,
    profileReviewedAt: b.profileReviewedAt,
    profileReviewedBy: b.profileReviewedBy,
    profileRevision: b.profileRevision,
    profileDraft: b.profileDraft,
    publishedProfile: b.publishedProfile,
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
