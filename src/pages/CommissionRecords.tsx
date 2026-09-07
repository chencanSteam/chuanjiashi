import { useEffect, useMemo, useState } from 'react';
import { Search, TrendingUp, Save, Snowflake, Settings2, Landmark, Receipt } from 'lucide-react';
import { commissionApi } from '../api/commission';
import { partnerApi } from '../api/partner';
import { getCommissionStatusLabel } from '../data/partnerData';
import { useToast } from '../hooks/useToast';
import Annotate from '../components/annotation/Annotate';
import type { CommissionRecord as MockCommissionRecord, CommissionRules } from '../mocks/types';
import type { CommissionRecord, Partner } from '../types/partner';
import './CommissionRecords.css';

const tabs = [
  { key: 'flow', label: '分润流水' },
  { key: 'rules', label: '规则配置' },
  { key: 'partner', label: '服务商分成' },
  { key: 'reconcile', label: '财务对账' },
  { key: 'risk', label: '风控' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const defaultRules: CommissionRules = {
  directRate: 10,
  platformPoolRate: 15,
  bookshelfRate: 30,
  biographerRate: 85,
};

interface PartnerShareItem {
  id: string;
  level: '县区服务商分成' | '市级扶持金' | '省级年度奖励';
  name: string;
  region: string;
  period: string;
  amount: number;
  status: '待核算' | '已发放';
}

const mockPartnerShares: PartnerShareItem[] = [
  { id: 'share_001', level: '县区服务商分成', name: '杭州西湖区服务商', region: '浙江·杭州', period: '2026-06', amount: 12680, status: '已发放' },
  { id: 'share_002', level: '县区服务商分成', name: '苏州姑苏区服务商', region: '江苏·苏州', period: '2026-06', amount: 8450, status: '待核算' },
  { id: 'share_003', level: '市级扶持金', name: '杭州市级服务商', region: '浙江·杭州', period: '2026-Q2', amount: 30000, status: '已发放' },
  { id: 'share_004', level: '市级扶持金', name: '苏州市级服务商', region: '江苏·苏州', period: '2026-Q2', amount: 22000, status: '待核算' },
  { id: 'share_005', level: '省级年度奖励', name: '浙江省服务商', region: '浙江省', period: '2025 年度', amount: 80000, status: '已发放' },
];

interface ReconcileItem {
  month: string;
  orderTotal: number;
  commissionTotal: number;
  platformGross: number;
  status: '已对账' | '对账中' | '待对账';
}

const mockReconciles: ReconcileItem[] = [
  { month: '2026-06', orderTotal: 486200, commissionTotal: 72930, platformGross: 121550, status: '对账中' },
  { month: '2026-05', orderTotal: 452800, commissionTotal: 67920, platformGross: 113200, status: '已对账' },
  { month: '2026-04', orderTotal: 398500, commissionTotal: 59775, platformGross: 99625, status: '已对账' },
  { month: '2026-03', orderTotal: 356100, commissionTotal: 53415, platformGross: 89025, status: '已对账' },
];

interface DeductItem {
  id: string;
  partnerName: string;
  orderId: string;
  reason: string;
  amount: number;
  createdAt: string;
}

const mockDeducts: DeductItem[] = [
  { id: 'deduct_001', partnerName: '陈墨涵（传记师）', orderId: 'ord_20260618_003', reason: '引导用户线下私单，违规佣金全额扣回', amount: 1200, createdAt: '2026-07-10 14:22' },
  { id: 'deduct_002', partnerName: '杭州西湖区服务商', orderId: 'ord_20260530_017', reason: '订单退款，对应佣金扣回', amount: 356, createdAt: '2026-07-02 09:41' },
];

function loadRules(): CommissionRules {
  return defaultRules;
}

export default function CommissionRecords() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('flow');
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('');
  const [rules, setRules] = useState<CommissionRules>(loadRules);

  useEffect(() => {
    commissionApi
      .adminList()
      .then((list) => setRecords(list.map(mapMockCommissionRecord)))
      .catch(() => setRecords([]));
    partnerApi
      .listPartners()
      .then(setPartners)
      .catch(() => setPartners([]));
    commissionApi
      .rules()
      .then(setRules)
      .catch(() => setRules(defaultRules));
  }, []);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchKeyword =
        !keyword ||
        r.orderId.includes(keyword) ||
        r.userId.includes(keyword);
      const matchPartner = !selectedPartner || r.partnerId === selectedPartner;
      return matchKeyword && matchPartner;
    });
  }, [records, keyword, selectedPartner]);

  const getPartner = (id: string) => partners.find((p) => p.id === id);

  const handleSaveRules = async () => {
    const values = [rules.directRate, rules.platformPoolRate, rules.bookshelfRate, rules.biographerRate];
    if (values.some((v) => Number.isNaN(v) || v < 0 || v > 100)) {
      addToast('比例需在 0-100 之间', 'error');
      return;
    }
    try {
      await commissionApi.saveRules(rules);
      addToast('分润规则已保存', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '保存失败', 'error');
    }
  };

  return (
    <div className="commission-records-page">
      <header className="page-header">
        <h1 className="page-title">分润管理</h1>
      </header>

      <Annotate id="commission-records.tabs" inline>
      <div className="tabs">
        {tabs.map((t) => (
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

      {activeTab === 'flow' && (
        <>
          <div className="card">
            <div className="card-header commission-header">
              <Annotate id="commission-records.flow-filter" inline>
              <div className="commission-filters">
                <div className="commission-search">
                  <Search size={14} />
                  <input type="text" placeholder="搜索订单号、客户ID" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                </div>
                <select value={selectedPartner} onChange={(e) => setSelectedPartner(e.target.value)}>
                  <option value="">全部合伙人</option>
                  {partners.map((p) => (
                    <option value={p.id} key={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              </Annotate>
            </div>
            <Annotate id="commission-records.flow-table">
            <div className="card-body commission-body">
              {filtered.length === 0 ? (
                <div className="commission-empty">暂无分润流水</div>
              ) : (
                <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>订单号</th>
                      <th>合伙人</th>
                      <th>客户</th>
                      <th>服务类型</th>
                      <th>订单金额</th>
                      <th>佣金</th>
                      <th>状态</th>
                      <th>时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const p = getPartner(r.partnerId);
                      return (
                        <tr key={r.id}>
                          <td>{r.orderId}</td>
                          <td>{p?.name || '未知'}</td>
                          <td>{r.userId}</td>
                          <td>{getTypeLabel(r.type)}</td>
                          <td>¥{r.amount.toFixed(2)}</td>
                          <td><span className="commission-money">¥{r.commission.toFixed(2)}</span></td>
                          <td>
                            <span className={`commission-status ${r.status}`}>{getCommissionStatusLabel(r.status)}</span>
                          </td>
                          <td>{new Date(r.createdAt).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              )}
            </div>
            </Annotate>
          </div>
        </>
      )}

      {activeTab === 'rules' && (
        <Annotate id="commission-records.rules-form">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Settings2 size={16} /> 分润规则配置</h3>
          </div>
          <div className="card-body commission-rules-body">
            <div className="form-row">
              <label>直推佣金比例（%）</label>
              <input
                type="number"
                min={0}
                max={100}
                value={rules.directRate}
                onChange={(e) => setRules((prev) => ({ ...prev, directRate: Number(e.target.value) }))}
              />
              <p className="commission-rule-tip">用户通过邀请码直推成交后，直推人获得的佣金比例</p>
            </div>
            <div className="form-row">
              <label>平台毛利池比例（%）</label>
              <input
                type="number"
                min={0}
                max={100}
                value={rules.platformPoolRate}
                onChange={(e) => setRules((prev) => ({ ...prev, platformPoolRate: Number(e.target.value) }))}
              />
              <p className="commission-rule-tip">订单金额划入平台毛利池的比例，用于运营与奖励支出</p>
            </div>
            <div className="form-row">
              <label>书架收益分配比例（%）</label>
              <input
                type="number"
                min={0}
                max={100}
                value={rules.bookshelfRate}
                onChange={(e) => setRules((prev) => ({ ...prev, bookshelfRate: Number(e.target.value) }))}
              />
              <p className="commission-rule-tip">公开传记付费收益中分配给传记作者的比例</p>
            </div>
            <div className="form-row">
              <label>传记师订单分润比例（%）</label>
              <input
                type="number"
                min={0}
                max={100}
                value={rules.biographerRate}
                onChange={(e) => setRules((prev) => ({ ...prev, biographerRate: Number(e.target.value) }))}
              />
              <p className="commission-rule-tip">传记师服务订单中传记师所得比例，其余为平台抽佣</p>
            </div>
            <button className="btn btn-primary" onClick={handleSaveRules}>
              <Save size={14} /> 保存规则
            </button>
          </div>
        </div>
        </Annotate>
      )}

      {activeTab === 'partner' && (
        <Annotate id="commission-records.partner-shares">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Landmark size={16} /> 服务商分成核算</h3>
          </div>
          <div className="card-body commission-body">
            <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>分成类型</th>
                  <th>服务商</th>
                  <th>区域</th>
                  <th>结算周期</th>
                  <th>金额</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {mockPartnerShares.map((s) => (
                  <tr key={s.id}>
                    <td>{s.level}</td>
                    <td>{s.name}</td>
                    <td>{s.region}</td>
                    <td>{s.period}</td>
                    <td><span className="commission-money">¥{s.amount.toLocaleString()}</span></td>
                    <td>
                      <span className={`commission-status ${s.status === '已发放' ? 'settled' : 'pending'}`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
        </Annotate>
      )}

      {activeTab === 'reconcile' && (
        <Annotate id="commission-records.reconcile">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Receipt size={16} /> 月度对账</h3>
          </div>
          <div className="card-body commission-body">
            <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>月份</th>
                  <th>订单总额</th>
                  <th>分润总额</th>
                  <th>平台毛利</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {mockReconciles.map((r) => (
                  <tr key={r.month}>
                    <td>{r.month}</td>
                    <td>¥{r.orderTotal.toLocaleString()}</td>
                    <td>¥{r.commissionTotal.toLocaleString()}</td>
                    <td><span className="commission-money">¥{r.platformGross.toLocaleString()}</span></td>
                    <td>
                      <span className={`commission-status ${r.status === '已对账' ? 'settled' : r.status === '对账中' ? 'pending' : 'withdrawn'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
        </Annotate>
      )}

      {activeTab === 'risk' && (
        <Annotate id="commission-records.risk">
        <>
          <div className="card commission-risk-tip">
            <div className="card-body commission-risk-tip-body">
              <Snowflake size={20} color="#2563eb" />
              <div>
                <div className="commission-risk-tip-title">佣金冻结期说明</div>
                <div className="commission-risk-tip-text">
                  佣金自订单完成起冻结 15 天，冻结期内如发生退款或违规，对应佣金将被扣回；
                  冻结期满且无售后纠纷的佣金自动转入可提现余额。
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><TrendingUp size={16} /> 违规佣金扣回记录</h3>
            </div>
            <div className="card-body commission-body">
              {mockDeducts.length === 0 ? (
                <div className="commission-empty">暂无扣回记录</div>
              ) : (
                <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>对象</th>
                      <th>关联订单</th>
                      <th>扣回原因</th>
                      <th>扣回金额</th>
                      <th>时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockDeducts.map((d) => (
                      <tr key={d.id}>
                        <td>{d.partnerName}</td>
                        <td>{d.orderId}</td>
                        <td className="admin-table-text-left">{d.reason}</td>
                        <td><span className="commission-deduct">-¥{d.amount.toLocaleString()}</span></td>
                        <td>{d.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </div>
        </>
        </Annotate>
      )}
    </div>
  );
}

function getTypeLabel(type: CommissionRecord['type']): string {
  const map: Record<CommissionRecord['type'], string> = {
    interview: 'AI 采访',
    biography: '传记生成',
    digital_person: '数字人',
    subscription: '会员订阅',
    print: '实体书印刷',
    other: '其他',
  };
  return map[type];
}

function mapMockCommissionRecord(r: MockCommissionRecord): CommissionRecord {
  const typeMap: Record<string, CommissionRecord['type']> = {
    biography: 'biography',
    digital_person: 'digital_person',
    video: 'other',
    qrcode: 'other',
    book: 'print',
    biographer_service: 'other',
    group_buy: 'biography',
  };
  return {
    id: r.id,
    partnerId: r.userId,
    userId: r.fromUserId || '',
    orderId: r.orderId,
    amount: r.amount,
    commission: r.commission,
    type: typeMap[r.orderType] || 'other',
    status: r.status as CommissionRecord['status'],
    createdAt: r.createdAt,
    settledAt: r.settledAt,
  };
}
