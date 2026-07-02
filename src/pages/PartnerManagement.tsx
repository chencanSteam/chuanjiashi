import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Users,
  MapPin,
  Share2,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  User,
  Percent,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import {
  loadPartners,
  createPartner,
  updatePartner,
  deletePartner,
  getPartnerTypeLabel,
  getPartnerStatusLabel,
} from '../data/partnerData';
import Avatar from '../components/ui/Avatar';
import type { Partner, PartnerFormData, PartnerType, PartnerStatus } from '../types/partner';
import './PartnerManagement.css';

const emptyForm: PartnerFormData = {
  name: '',
  phone: '',
  email: '',
  type: 'inviter',
  commissionRate: 0.2,
  status: 'active',
};

const regionData: Record<string, { code: string; name: string }[]> = {
  '330000': [
    { code: '330100', name: '杭州市' },
    { code: '330200', name: '宁波市' },
    { code: '330300', name: '温州市' },
  ],
  '330100': [
    { code: '330106', name: '西湖区' },
    { code: '330104', name: '江干区' },
    { code: '330105', name: '拱墅区' },
  ],
};

export default function PartnerManagement() {
  const { addToast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<PartnerType | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState<PartnerFormData>(emptyForm);
  const [showDelete, setShowDelete] = useState<Partner | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    setPartners(loadPartners());
  }, [refresh]);

  const filtered = useMemo(() => {
    return partners.filter((p) => {
      const matchKeyword =
        !keyword ||
        p.name.includes(keyword) ||
        p.phone.includes(keyword) ||
        p.inviteCode.includes(keyword) ||
        p.regionName?.includes(keyword);
      const matchType = typeFilter === 'all' || p.type === typeFilter;
      return matchKeyword && matchType;
    });
  }, [partners, keyword, typeFilter]);

  const stats = useMemo(() => {
    return {
      total: partners.length,
      province: partners.filter((p) => p.type === 'province').length,
      city: partners.filter((p) => p.type === 'city').length,
      district: partners.filter((p) => p.type === 'district').length,
      inviter: partners.filter((p) => p.type === 'inviter').length,
    };
  }, [partners]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (p: Partner) => {
    setEditing(p);
    setForm({
      name: p.name,
      phone: p.phone,
      email: p.email || '',
      type: p.type,
      regionCode: p.regionCode,
      regionName: p.regionName,
      parentId: p.parentId,
      commissionRate: p.commissionRate,
      status: p.status,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.phone.trim()) {
      addToast('请填写姓名和手机号', 'error');
      return;
    }

    let regionCode = form.regionCode;
    let regionName = form.regionName;

    if (form.type !== 'inviter') {
      regionCode = getRegionCode(form);
      regionName = getRegionName(form);
    }

    const data = { ...form, regionCode, regionName };

    if (editing) {
      updatePartner(editing.id, data);
      addToast('合伙人信息已更新', 'success');
    } else {
      createPartner(data);
      addToast('合伙人新增成功', 'success');
    }
    setRefresh((v) => v + 1);
    closeModal();
  };

  const handleDelete = () => {
    if (!showDelete) return;
    deletePartner(showDelete.id);
    setRefresh((v) => v + 1);
    setShowDelete(null);
    addToast('合伙人已删除', 'success');
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    addToast('邀请码已复制', 'success');
  };

  return (
    <div className="partner-management-page">
      <header className="page-header">
        <h1 className="page-title">合伙人管理</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> 新增合伙人
        </button>
      </header>

      <div className="partner-mgmt-stats">
        <div className="card partner-mgmt-stat"><Users size={18} color="#1B5E4B" /><div><div className="partner-mgmt-stat-value">{stats.total}</div><div className="partner-mgmt-stat-label">总数</div></div></div>
        <div className="card partner-mgmt-stat"><MapPin size={18} color="#2563eb" /><div><div className="partner-mgmt-stat-value">{stats.province}</div><div className="partner-mgmt-stat-label">省级</div></div></div>
        <div className="card partner-mgmt-stat"><MapPin size={18} color="#7c3aed" /><div><div className="partner-mgmt-stat-value">{stats.city}</div><div className="partner-mgmt-stat-label">市级</div></div></div>
        <div className="card partner-mgmt-stat"><MapPin size={18} color="#d97706" /><div><div className="partner-mgmt-stat-value">{stats.district}</div><div className="partner-mgmt-stat-label">区县</div></div></div>
        <div className="card partner-mgmt-stat"><Share2 size={18} color="#0891b2" /><div><div className="partner-mgmt-stat-value">{stats.inviter}</div><div className="partner-mgmt-stat-label">邀请码</div></div></div>
      </div>

      <div className="card">
        <div className="card-header partner-mgmt-header">
          <div className="partner-mgmt-filters">
            <div className="partner-mgmt-search">
              <Search size={14} />
              <input type="text" placeholder="搜索姓名、手机号、邀请码" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as PartnerType | 'all')}>
              <option value="all">全部类型</option>
              <option value="province">省级合伙人</option>
              <option value="city">市级合伙人</option>
              <option value="district">区县合伙人</option>
              <option value="inviter">邀请码合伙人</option>
            </select>
          </div>
        </div>
        <div className="card-body partner-mgmt-body">
          {filtered.length === 0 ? (
            <div className="partner-mgmt-empty">暂无合伙人</div>
          ) : (
            <div className="partner-mgmt-table">
              <div className="partner-mgmt-row partner-mgmt-header-row">
                <div className="partner-mgmt-cell partner-mgmt-cell-name">合伙人</div>
                <div className="partner-mgmt-cell partner-mgmt-cell-type">类型</div>
                <div className="partner-mgmt-cell partner-mgmt-cell-region">区域</div>
                <div className="partner-mgmt-cell partner-mgmt-cell-code">邀请码</div>
                <div className="partner-mgmt-cell partner-mgmt-cell-rate">分佣</div>
                <div className="partner-mgmt-cell partner-mgmt-cell-earnings">累计收益</div>
                <div className="partner-mgmt-cell partner-mgmt-cell-status">状态</div>
                <div className="partner-mgmt-cell partner-mgmt-cell-action">操作</div>
              </div>
              {filtered.map((p) => (
                <div className="partner-mgmt-row" key={p.id}>
                  <div className="partner-mgmt-cell partner-mgmt-cell-name">
                    <Avatar name={p.name} size={36} />
                    <div>
                      <div className="partner-mgmt-name">{p.name}</div>
                      <div className="partner-mgmt-phone">{p.phone}</div>
                    </div>
                  </div>
                  <div className="partner-mgmt-cell partner-mgmt-cell-type">{getPartnerTypeLabel(p.type)}</div>
                  <div className="partner-mgmt-cell partner-mgmt-cell-region">{p.regionName || '-'}</div>
                  <div className="partner-mgmt-cell partner-mgmt-cell-code">
                    <span className="partner-mgmt-code">{p.inviteCode}</span>
                    <button className="icon-btn" onClick={() => copyInviteCode(p.inviteCode)}><Share2 size={12} /></button>
                  </div>
                  <div className="partner-mgmt-cell partner-mgmt-cell-rate">{(p.commissionRate * 100).toFixed(0)}%</div>
                  <div className="partner-mgmt-cell partner-mgmt-cell-earnings">¥{p.totalEarnings.toFixed(2)}</div>
                  <div className="partner-mgmt-cell partner-mgmt-cell-status">
                    <span className={`partner-mgmt-status ${p.status}`}>{getPartnerStatusLabel(p.status)}</span>
                  </div>
                  <div className="partner-mgmt-cell partner-mgmt-cell-action">
                    <button className="icon-btn" onClick={() => openEdit(p)}><Edit2 size={14} /></button>
                    <button className="icon-btn" onClick={() => setShowDelete(p)}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content partner-mgmt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{editing ? '编辑合伙人' : '新增合伙人'}</h4>
              <button className="modal-close" onClick={closeModal}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row"><label><User size={12} /> 姓名</label><input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="请输入姓名" /></div>
              <div className="form-row"><label><Phone size={12} /> 手机号</label><input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="请输入手机号" /></div>
              <div className="form-row"><label><Mail size={12} /> 邮箱</label><input type="text" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="请输入邮箱" /></div>
              <div className="form-row">
                <label>类型</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PartnerType }))}>
                  <option value="province">省级合伙人</option>
                  <option value="city">市级合伙人</option>
                  <option value="district">区县合伙人</option>
                  <option value="inviter">邀请码合伙人</option>
                </select>
              </div>
              {form.type !== 'inviter' && (
                <div className="form-row">
                  <label><MapPin size={12} /> 代理区域</label>
                  <div className="partner-mgmt-region-selects">
                    <select disabled><option>浙江省</option></select>
                    {form.type !== 'province' && (
                      <select value={form.regionCode?.slice(0, 4) + '00' || '330100'} onChange={(e) => setForm((f) => ({ ...f, regionCode: e.target.value }))}>
                        {regionData['330000'].map((c) => <option value={c.code} key={c.code}>{c.name}</option>)}
                      </select>
                    )}
                    {form.type === 'district' && (
                      <select value={form.regionCode || '330106'} onChange={(e) => setForm((f) => ({ ...f, regionCode: e.target.value }))}>
                        {regionData[form.regionCode?.slice(0, 4) + '00' || '330100'].map((d) => <option value={d.code} key={d.code}>{d.name}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              )}
              <div className="form-row"><label><Percent size={12} /> 分佣比例</label><input type="number" min={0} max={1} step={0.01} value={form.commissionRate} onChange={(e) => setForm((f) => ({ ...f, commissionRate: Number(e.target.value) }))} /></div>
              <div className="form-row">
                <label>状态</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PartnerStatus }))}>
                  <option value="active">已启用</option>
                  <option value="inactive">已停用</option>
                  <option value="pending">待审核</option>
                  <option value="rejected">已拒绝</option>
                </select>
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
            <div className="modal-header"><h4>确认删除</h4><button className="modal-close" onClick={() => setShowDelete(null)}><X size={16} /></button></div>
            <div className="modal-body">
              <p style={{ color: '#6b7280', fontSize: 13 }}>删除后，合伙人「{showDelete.name}」的数据将无法恢复，是否继续？</p>
              <div className="partner-mgmt-delete-actions">
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

function getRegionCode(form: PartnerFormData): string | undefined {
  if (form.type === 'province') return '330000';
  if (form.type === 'city') return form.regionCode || '330100';
  return form.regionCode || '330106';
}

function getRegionName(form: PartnerFormData): string | undefined {
  if (form.type === 'province') return '浙江省';
  if (form.type === 'city') {
    return regionData['330000'].find((c) => c.code === (form.regionCode || '330100'))?.name;
  }
  const cityCode = form.regionCode?.slice(0, 4) + '00' || '330100';
  const cityName = regionData['330000'].find((c) => c.code === cityCode)?.name || '';
  const districtName = regionData[cityCode]?.find((d) => d.code === (form.regionCode || '330106'))?.name || '';
  return `${cityName}${districtName}`;
}
