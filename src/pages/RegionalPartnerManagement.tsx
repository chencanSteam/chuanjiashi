import { useEffect, useMemo, useState } from 'react';
import { MapPin, Plus, Search, Users, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { partnerApi } from '../api/partner';
import { adminUserApi } from '../api/adminUser';
import type { Partner, PartnerType } from '../mocks/types';
import type { AdminUser } from '../mocks/types';
import './RegionalPartnerManagement.css';

const regions = {
  province: [{ code: '330000', name: '浙江省' }],
  city: [
    { code: '330100', name: '杭州市' },
    { code: '330200', name: '宁波市' },
    { code: '330300', name: '温州市' },
  ],
  district: [
    { code: '330106', name: '杭州市西湖区' },
    { code: '330104', name: '杭州市江干区' },
    { code: '330105', name: '杭州市拱墅区' },
    { code: '330203', name: '宁波市海曙区' },
    { code: '330205', name: '宁波市江北区' },
    { code: '330302', name: '温州市鹿城区' },
  ],
} satisfies Record<Exclude<PartnerType, 'inviter'>, { code: string; name: string }[]>;

const typeLabels: Record<Exclude<PartnerType, 'inviter'>, string> = {
  province: '省级',
  city: '市级',
  district: '区县级',
};

const defaultRate: Record<Exclude<PartnerType, 'inviter'>, number> = {
  province: 30,
  city: 25,
  district: 20,
};

type RegionalType = Exclude<PartnerType, 'inviter'>;

export default function RegionalPartnerManagement() {
  const { addToast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [type, setType] = useState<RegionalType>('district');
  const [levelFilter, setLevelFilter] = useState<RegionalType | 'all'>('all');
  const [regionCode, setRegionCode] = useState('');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<Partner['status'] | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', regionCode: '330106', commissionRate: '20' });

  const load = () => partnerApi.listPartners().then(setPartners).catch(() => setPartners([]));
  useEffect(() => { load(); }, []);

  useEffect(() => {
    adminUserApi.list({ regionCode: regionCode || undefined }).then(setUsers).catch(() => setUsers([]));
  }, [regionCode]);

  const filtered = useMemo(() => partners.filter((p) => {
    if (p.type === 'inviter') return false;
    return (levelFilter === 'all' || p.type === levelFilter) &&
      (!regionCode || p.regionCode?.startsWith(regionCode)) &&
      (status === 'all' || p.status === status) &&
      (!keyword || `${p.name} ${p.phone} ${p.regionName || ''}`.includes(keyword));
  }), [partners, levelFilter, regionCode, status, keyword]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', phone: '', regionCode: regions[type][0].code, commissionRate: String(defaultRate[type]) });
    setShowModal(true);
  };

  const openEdit = (partner: Partner) => {
    setEditing(partner);
    setType(partner.type as RegionalType);
    setForm({ name: partner.name, phone: partner.phone, regionCode: partner.regionCode || '', commissionRate: String(partner.commissionRate * 100) });
    setShowModal(true);
  };

  const submit = async () => {
    const rate = Number(form.commissionRate);
    const region = regions[type].find((item) => item.code === form.regionCode);
    if (!form.name.trim() || !/^1\d{10}$/.test(form.phone)) return addToast('请填写正确的姓名和手机号', 'error');
    if (!region) return addToast('请选择代理区域', 'error');
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return addToast('分成比例需在 0-100% 之间', 'error');
    try {
      const data = { name: form.name.trim(), phone: form.phone, type, regionCode: region.code, regionName: region.name, commissionRate: rate / 100, status: 'active' as const };
      if (editing) await partnerApi.updatePartner(editing.id, data);
      else await partnerApi.createPartner(data);
      addToast(editing ? '区域合伙人已更新' : '区域合伙人添加成功', 'success');
      setShowModal(false);
      load();
    } catch (error) {
      addToast(error instanceof Error ? error.message : '保存失败', 'error');
    }
  };

  return (
    <div className="regional-partner-page">
      <header className="page-header">
        <div><h1 className="page-title">区域合伙人</h1><p className="regional-subtitle">按行政区域管理合伙人及用户归属</p></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> 添加区域合伙人</button>
      </header>
      <div className="card regional-filter-card">
        <div className="regional-filters">
          <div className="regional-search"><Search size={16} /><input placeholder="搜索合伙人姓名、手机号或区域" value={keyword} onChange={(e) => setKeyword(e.target.value)} /></div>
          <select value={levelFilter} onChange={(e) => { const next = e.target.value as RegionalType | 'all'; setLevelFilter(next); setRegionCode(''); }}><option value="all">全部级别</option><option value="province">省级</option><option value="city">市级</option><option value="district">区县级</option></select>
          <select value={regionCode} onChange={(e) => setRegionCode(e.target.value)}><option value="">全部区域</option>{(levelFilter === 'all' ? [...regions.province, ...regions.city, ...regions.district] : regions[levelFilter]).map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}</select>
          <select value={status} onChange={(e) => setStatus(e.target.value as Partner['status'] | 'all')}><option value="all">全部状态</option><option value="active">正常</option><option value="inactive">已停用</option></select>
        </div>
      </div>
      <div className="regional-layout">
        <div className="card regional-table-card"><div className="card-header"><h3 className="card-title"><MapPin size={16} /> 区域合伙人列表</h3><span className="regional-count">{filtered.length} 位</span></div><div className="card-body regional-table-body"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>代理区域</th><th>级别</th><th>合伙人</th><th>手机号</th><th>分成比例</th><th>状态</th><th>操作</th></tr></thead><tbody>{filtered.map((p) => <tr key={p.id}><td>{p.regionName || '-'}</td><td>{typeLabels[p.type as RegionalType]}</td><td>{p.name}</td><td>{p.phone}</td><td className="regional-rate">{(p.commissionRate * 100).toFixed(0)}%</td><td><span className={`regional-status ${p.status}`}>{p.status === 'active' ? '正常' : '已停用'}</span></td><td><button className="admin-table-link" onClick={() => openEdit(p)}>编辑</button></td></tr>)}{filtered.length === 0 && <tr><td colSpan={7}><div className="regional-empty">暂无符合条件的区域合伙人</div></td></tr>}</tbody></table></div></div></div>
        <div className="card regional-users-card"><div className="card-header"><h3 className="card-title"><Users size={16} /> 区域用户列表</h3><span className="regional-count">{users.length} 位</span></div><div className="card-body regional-users-body">{users.length === 0 ? <div className="regional-empty">请选择区域查看用户</div> : users.map((u) => <div className="regional-user-row" key={u.id}><div><strong>{u.nickname}</strong><span>{u.phone}</span></div><span>{u.regionName || '未设置区域'}</span></div>)}</div></div>
      </div>
      {showModal && <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal regional-modal" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h3>{editing ? '编辑区域合伙人' : '添加区域合伙人'}</h3><button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button></div><div className="modal-body"><label>合伙人级别<select value={type} onChange={(e) => { const next = e.target.value as RegionalType; setType(next); setForm({ ...form, regionCode: regions[next][0].code, commissionRate: String(defaultRate[next]) }); }}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>代理区域<select value={form.regionCode} onChange={(e) => setForm({ ...form, regionCode: e.target.value })}>{regions[type].map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}</select></label><label>合伙人姓名<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>手机号<input value={form.phone} maxLength={11} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><label>分成比例（%）<input type="number" min="0" max="100" step="1" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} /></label></div><div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button><button className="btn btn-primary" onClick={submit}>保存</button></div></div></div>}
    </div>
  );
}
