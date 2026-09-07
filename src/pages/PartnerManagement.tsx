import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  MapPin,
  X,
  Phone,
  Mail,
  User,
  Percent,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { partnerApi } from '../api/partner';
import {
  getPartnerTypeLabel,
  getPartnerStatusLabel,
} from '../data/partnerData';
import Avatar from '../components/ui/Avatar';
import Annotate from '../components/annotation/Annotate';
import type { Partner, PartnerFormData, PartnerType, PartnerStatus } from '../types/partner';
import type {
  PartnerFeeRecord,
  PartnerShareConfig,
  PartnerRewardConfig,
  PartnerAssessmentRecord,
} from '../mocks/types';
import './PartnerManagement.css';

const partnerTabs = [
  { key: 'list', label: '合伙人列表' },
  { key: 'fees', label: '费用记录' },
  { key: 'share', label: '分成配置' },
  { key: 'reward', label: '奖励配置' },
  { key: 'assessment', label: '考核管理' },
] as const;

type PartnerTabKey = (typeof partnerTabs)[number]['key'];

const feeTypeLabels: Record<PartnerFeeRecord['feeType'], string> = {
  license: '区域授权费',
  saas: 'SaaS 系统使用费',
  deposit: '履约保证金',
};

const feeStatusLabels: Record<PartnerFeeRecord['status'], string> = {
  paid: '已缴纳',
  pending: '待缴纳',
  refunded: '已退还',
};

const rewardLevelLabels: Record<PartnerRewardConfig['level'], string> = {
  city: '市级扶持金',
  province: '省级年度奖励',
};

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
  '330200': [
    { code: '330203', name: '海曙区' },
    { code: '330205', name: '江北区' },
    { code: '330206', name: '北仑区' },
    { code: '330211', name: '镇海区' },
    { code: '330212', name: '鄞州区' },
    { code: '330213', name: '奉化区' },
    { code: '330281', name: '余姚市' },
    { code: '330282', name: '慈溪市' },
  ],
  '330300': [
    { code: '330302', name: '鹿城区' },
    { code: '330303', name: '龙湾区' },
    { code: '330304', name: '瓯海区' },
    { code: '330305', name: '洞头区' },
    { code: '330381', name: '瑞安市' },
    { code: '330382', name: '乐清市' },
    { code: '330383', name: '龙港市' },
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

  const [activeTab, setActiveTab] = useState<PartnerTabKey>('list');
  const [fees, setFees] = useState<PartnerFeeRecord[]>([]);
  const [shareConfigs, setShareConfigs] = useState<PartnerShareConfig[]>([]);
  const [rewardConfigs, setRewardConfigs] = useState<PartnerRewardConfig[]>([]);
  const [assessments, setAssessments] = useState<PartnerAssessmentRecord[]>([]);
  const [editingShare, setEditingShare] = useState<PartnerShareConfig | null>(null);
  const [shareForm, setShareForm] = useState({ rate: '', effectiveAt: '' });
  const [editingReward, setEditingReward] = useState<PartnerRewardConfig | null>(null);
  const [rewardForm, setRewardForm] = useState({ condition: '', amount: '', status: 'enabled' as PartnerRewardConfig['status'] });

  useEffect(() => {
    partnerApi
      .listPartners()
      .then(setPartners)
      .catch(() => setPartners([]));
  }, [refresh]);

  useEffect(() => {
    if (activeTab === 'fees') {
      partnerApi.adminFees().then(setFees).catch(() => setFees([]));
    }
    if (activeTab === 'share') {
      partnerApi.shareConfigs().then(setShareConfigs).catch(() => setShareConfigs([]));
    }
    if (activeTab === 'reward') {
      partnerApi.rewardConfigs().then(setRewardConfigs).catch(() => setRewardConfigs([]));
    }
    if (activeTab === 'assessment') {
      partnerApi.adminAssessments().then(setAssessments).catch(() => setAssessments([]));
    }
  }, [activeTab]);

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

  const handleSubmit = async () => {
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

    try {
      if (editing) {
        await partnerApi.updatePartner(editing.id, data);
        addToast('合伙人信息已更新', 'success');
      } else {
        await partnerApi.createPartner(data);
        addToast('合伙人新增成功', 'success');
      }
      setRefresh((v) => v + 1);
      closeModal();
    } catch (err: any) {
      addToast(err.message || '操作失败', 'error');
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    try {
      await partnerApi.deletePartner(showDelete.id);
      setRefresh((v) => v + 1);
      setShowDelete(null);
      addToast('合伙人已删除', 'success');
    } catch (err: any) {
      addToast(err.message || '删除失败', 'error');
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    addToast('邀请码已复制', 'success');
  };

  const openShareEdit = (config: PartnerShareConfig) => {
    setEditingShare(config);
    setShareForm({ rate: String(config.rate), effectiveAt: config.effectiveAt.slice(0, 10) });
  };

  const handleShareSubmit = async () => {
    if (!editingShare) return;
    const rate = Number(shareForm.rate);
    if (Number.isNaN(rate) || rate < 0 || rate > 1) {
      addToast('分成比例需在 0-1 之间', 'error');
      return;
    }
    try {
      await partnerApi.updateShareConfig(editingShare.id, {
        rate,
        effectiveAt: new Date(shareForm.effectiveAt).toISOString(),
      });
      const list = await partnerApi.shareConfigs();
      setShareConfigs(list);
      setEditingShare(null);
      addToast('分成配置已更新', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    }
  };

  const openRewardEdit = (config: PartnerRewardConfig) => {
    setEditingReward(config);
    setRewardForm({ condition: config.condition, amount: String(config.amount), status: config.status });
  };

  const handleRewardSubmit = async () => {
    if (!editingReward) return;
    const amount = Number(rewardForm.amount);
    if (!rewardForm.condition.trim()) {
      addToast('请填写档位条件', 'error');
      return;
    }
    if (Number.isNaN(amount) || amount < 0) {
      addToast('奖励金额无效', 'error');
      return;
    }
    try {
      await partnerApi.updateRewardConfig(editingReward.id, {
        condition: rewardForm.condition.trim(),
        amount,
        status: rewardForm.status,
      });
      const list = await partnerApi.rewardConfigs();
      setRewardConfigs(list);
      setEditingReward(null);
      addToast('奖励配置已更新', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    }
  };

  // 区域联动：regionCode 可能是城市码或区县码，统一取前 4 位 + '00' 作为城市码
  const districtCityCode = form.regionCode ? `${form.regionCode.slice(0, 4)}00` : '330100';
  const districtOptions = regionData[districtCityCode] || [];
  const districtValue = districtOptions.some((d) => d.code === form.regionCode)
    ? (form.regionCode as string)
    : districtOptions[0]?.code || '';

  return (
    <div className="partner-management-page">
      <header className="page-header">
        <h1 className="page-title">合伙人管理</h1>
        {activeTab === 'list' && (
          <Annotate id="admin-partners.add-partner" inline>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> 新增合伙人
          </button>
          </Annotate>
        )}
      </header>

      <Annotate id="admin-partners.tabs" inline>
      <div className="tabs">
        {partnerTabs.map((t) => (
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
      <div className="card">
        <div className="card-header partner-mgmt-header">
          <Annotate id="admin-partners.list-filter" inline>
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
          </Annotate>
        </div>
        <Annotate id="admin-partners.list-table">
        <div className="card-body partner-mgmt-body">
          {filtered.length === 0 ? (
            <div className="admin-table-empty">暂无合伙人</div>
          ) : (
            <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>合伙人</th>
                  <th>类型</th>
                  <th>区域</th>
                  <th>邀请码</th>
                  <th>分佣</th>
                  <th>累计收益</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="admin-table-text-left">
                      <div className="partner-mgmt-name-cell">
                        <Avatar name={p.name} size={36} />
                        <div>
                          <div className="partner-mgmt-name">{p.name}</div>
                          <div className="partner-mgmt-phone">{p.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>{getPartnerTypeLabel(p.type)}</td>
                    <td>{p.regionName || '-'}</td>
                    <td>
                      <span className="partner-mgmt-code">{p.inviteCode}</span>
                      <button className="admin-table-link" onClick={() => copyInviteCode(p.inviteCode)}>复制</button>
                    </td>
                    <td>{(p.commissionRate * 100).toFixed(0)}%</td>
                    <td>¥{p.totalEarnings.toFixed(2)}</td>
                    <td>
                      <span className={`partner-mgmt-status ${p.status}`}>{getPartnerStatusLabel(p.status)}</span>
                    </td>
                    <td>
                      <button className="admin-table-link" onClick={() => openEdit(p)}>编辑</button>
                      <button className="admin-table-link danger" onClick={() => setShowDelete(p)}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
        </Annotate>
      </div>
      </>
      )}

      {activeTab === 'fees' && (
        <Annotate id="admin-partners.fee-table">
        <div className="card">
          <div className="card-body partner-mgmt-body">
            {fees.length === 0 ? (
              <div className="admin-table-empty">暂无费用记录</div>
            ) : (
              <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>合伙人</th>
                    <th>费用类型</th>
                    <th>金额</th>
                    <th>缴纳时间</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((f) => (
                    <tr key={f.id}>
                      <td className="admin-table-text-left">
                        <div className="partner-mgmt-name-cell">
                          <Avatar name={f.partnerName} size={32} />
                          <div>
                            <div className="partner-mgmt-name">{f.partnerName}</div>
                          </div>
                        </div>
                      </td>
                      <td>{feeTypeLabels[f.feeType]}</td>
                      <td>¥{f.amount.toLocaleString()}</td>
                      <td>{new Date(f.paidAt).toLocaleString()}</td>
                      <td>
                        <span className={`partner-mgmt-status ${f.status === 'paid' ? 'active' : f.status === 'pending' ? 'pending' : 'inactive'}`}>
                          {feeStatusLabels[f.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
        </Annotate>
      )}

      {activeTab === 'share' && (
        <Annotate id="admin-partners.share-config">
        <div className="card">
          <div className="card-body partner-mgmt-body">
            {shareConfigs.length === 0 ? (
              <div className="admin-table-empty">暂无分成配置</div>
            ) : (
              <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>区域</th>
                    <th>合伙人</th>
                    <th>分成比例</th>
                    <th>生效时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {shareConfigs.map((c) => (
                    <tr key={c.id}>
                      <td>{c.regionName}</td>
                      <td className="admin-table-text-left">
                        <div className="partner-mgmt-name-cell">
                          <Avatar name={c.partnerName} size={32} />
                          <div>
                            <div className="partner-mgmt-name">{c.partnerName}</div>
                          </div>
                        </div>
                      </td>
                      <td>{(c.rate * 100).toFixed(0)}%</td>
                      <td>{new Date(c.effectiveAt).toLocaleDateString()}</td>
                      <td>
                        <button className="admin-table-link" onClick={() => openShareEdit(c)}>编辑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
        </Annotate>
      )}

      {activeTab === 'reward' && (
        <Annotate id="admin-partners.reward-config">
        <div className="card">
          <div className="card-body partner-mgmt-body">
            {rewardConfigs.length === 0 ? (
              <div className="admin-table-empty">暂无奖励配置</div>
            ) : (
              <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>级别</th>
                    <th>档位条件</th>
                    <th>奖励金额</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {rewardConfigs.map((c) => (
                    <tr key={c.id}>
                      <td>{rewardLevelLabels[c.level]}</td>
                      <td className="admin-table-text-left">
                        <div className="partner-mgmt-name">{c.condition}</div>
                      </td>
                      <td>¥{c.amount.toLocaleString()}</td>
                      <td>
                        <span className={`partner-mgmt-status ${c.status === 'enabled' ? 'active' : 'inactive'}`}>
                          {c.status === 'enabled' ? '启用' : '停用'}
                        </span>
                      </td>
                      <td>
                        <button className="admin-table-link" onClick={() => openRewardEdit(c)}>编辑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
        </Annotate>
      )}

      {activeTab === 'assessment' && (
        <div className="card">
          <div className="card-body partner-mgmt-body">
            {assessments.length === 0 ? (
              <div className="admin-table-empty">暂无考核记录</div>
            ) : (
              <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>合伙人</th>
                    <th>年度</th>
                    <th>GMV 档位</th>
                    <th>渠道拓展</th>
                    <th>履约</th>
                    <th>品牌</th>
                    <th>合规</th>
                    <th>综合评级</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a) => (
                    <tr key={a.id}>
                      <td className="admin-table-text-left">
                        <div className="partner-mgmt-name-cell">
                          <Avatar name={a.partnerName} size={32} />
                          <div>
                            <div className="partner-mgmt-name">{a.partnerName}</div>
                          </div>
                        </div>
                      </td>
                      <td>{a.year}</td>
                      <td>{a.gmvTier}</td>
                      <td>{a.channelScore}</td>
                      <td>{a.fulfillmentScore}</td>
                      <td>{a.brandScore}</td>
                      <td>{a.complianceScore}</td>
                      <td>
                        <span className={`partner-mgmt-status ${a.rating === '优秀' ? 'active' : a.rating === '不合格' ? 'rejected' : 'pending'}`}>
                          {a.rating}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      )}

      {editingShare && (
        <div className="modal-overlay" onClick={() => setEditingShare(null)}>
          <div className="modal-content partner-mgmt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>编辑分成配置 - {editingShare.regionName}</h4>
              <button className="modal-close" onClick={() => setEditingShare(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row"><label>合伙人</label><input type="text" value={editingShare.partnerName} disabled /></div>
              <div className="form-row">
                <label><Percent size={12} /> 分成比例（0-1）</label>
                <input type="number" min={0} max={1} step={0.01} value={shareForm.rate} onChange={(e) => setShareForm((f) => ({ ...f, rate: e.target.value }))} />
              </div>
              <div className="form-row">
                <label>生效时间</label>
                <input type="date" value={shareForm.effectiveAt} onChange={(e) => setShareForm((f) => ({ ...f, effectiveAt: e.target.value }))} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={handleShareSubmit}>保存修改</button>
            </div>
          </div>
        </div>
      )}

      {editingReward && (
        <div className="modal-overlay" onClick={() => setEditingReward(null)}>
          <div className="modal-content partner-mgmt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>编辑奖励配置 - {rewardLevelLabels[editingReward.level]}</h4>
              <button className="modal-close" onClick={() => setEditingReward(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>档位条件</label>
                <input type="text" value={rewardForm.condition} onChange={(e) => setRewardForm((f) => ({ ...f, condition: e.target.value }))} placeholder="如：年度 GMV ≥ 100 万" />
              </div>
              <div className="form-row">
                <label>奖励金额（元）</label>
                <input type="number" min={0} value={rewardForm.amount} onChange={(e) => setRewardForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="form-row">
                <label>状态</label>
                <select value={rewardForm.status} onChange={(e) => setRewardForm((f) => ({ ...f, status: e.target.value as PartnerRewardConfig['status'] }))}>
                  <option value="enabled">启用</option>
                  <option value="disabled">停用</option>
                </select>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={handleRewardSubmit}>保存修改</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <Annotate id="admin-partners.partner-form">
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
                      <select
                        value={districtCityCode}
                        onChange={(e) => setForm((f) => {
                          const cityCode = e.target.value;
                          const districts = regionData[cityCode] || [];
                          // 区县类型切换城市时，同步落到该城市第一个区县，避免残留旧城市编码
                          return { ...f, regionCode: f.type === 'district' ? (districts[0]?.code || cityCode) : cityCode };
                        })}
                      >
                        {regionData['330000'].map((c) => <option value={c.code} key={c.code}>{c.name}</option>)}
                      </select>
                    )}
                    {form.type === 'district' && (
                      districtOptions.length > 0 ? (
                        <select value={districtValue} onChange={(e) => setForm((f) => ({ ...f, regionCode: e.target.value }))}>
                          {districtOptions.map((d) => <option value={d.code} key={d.code}>{d.name}</option>)}
                        </select>
                      ) : (
                        <select disabled><option>该城市暂无区县数据</option></select>
                      )
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
        </Annotate>
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
  const cityCode = form.regionCode ? `${form.regionCode.slice(0, 4)}00` : '330100';
  const cityName = regionData['330000'].find((c) => c.code === cityCode)?.name || '';
  const districtName = regionData[cityCode]?.find((d) => d.code === (form.regionCode || '330106'))?.name || '';
  return `${cityName}${districtName}`;
}
