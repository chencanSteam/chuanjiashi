import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  CreditCard,
  Share2,
  Copy,
  QrCode,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  User,
  FileText,
  MapPin,
  ClipboardCheck,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useSearchParams } from 'react-router-dom';
import { commissionApi } from '../api/commission';
import { partnerApi } from '../api/partner';
import Modal from '../components/ui/Modal';
import PartnerApplyForm from '../components/PartnerApplyForm';
import type {
  CommissionRecord as MockCommissionRecord,
  Partner as MockPartner,
  PartnerCustomer as MockPartnerCustomer,
  GmvLineStat,
  PartnerAssessment,
  PartnerLocalOrder,
} from '../mocks/types';
import {
  getCommissionStatusLabel,
  getWithdrawalStatusLabel,
  partnerTypeConfig,
  getPartnerTypeLabel,
} from '../data/partnerData';
import type { CommissionRecord, Withdrawal, Partner, PartnerCustomer } from '../types/partner';
import Annotate from '../components/annotation/Annotate';
import './PartnerCenter.css';



const tabs = [
  { key: 'dashboard', icon: LayoutDashboard, label: '数据看板' },
  { key: 'customers', icon: Users, label: '我的客户' },
  { key: 'earnings', icon: TrendingUp, label: '我的收益' },
  { key: 'region', icon: MapPin, label: '区域分佣' },
  { key: 'withdraw', icon: CreditCard, label: '提现' },
  { key: 'assessment', icon: ClipboardCheck, label: '考核结算' },
];

const GMV_LINE_COLORS = ['#1B5E4B', '#2563eb', '#d97706', '#7c3aed'];

export default function PartnerCenter() {
  useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab') || 'dashboard';
    if (tabs.some((t) => t.key === tab) && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);

  const loadPartner = () => {
    setLoading(true);
    partnerApi
      .me()
      .then((p) => setPartner(mapMockPartner(p)))
      .catch(() => setPartner(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPartner();
  }, []);

  if (loading) {
    return (
      <div className="partner-center-page">
        <header className="page-header"><h1 className="page-title">合伙人中心</h1></header>
        <div className="card"><div className="card-body">加载中...</div></div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="partner-center-page">
        <header className="page-header"><h1 className="page-title">合伙人中心</h1></header>
        <div className="card empty-state-card">
          <div className="card-body">
            <p>您还不是合伙人，提交申请并通过审核后即可开展业务。</p>
            <Annotate id="partner-center.apply-entry" inline>
            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => setShowApply(true)}
            >
              <FileText size={14} /> 申请成为合伙人
            </button>
            </Annotate>
            <Modal open={showApply} title="申请成为合伙人" onClose={() => setShowApply(false)}>
              <PartnerApplyForm onSuccess={() => { setShowApply(false); loadPartner(); }} />
            </Modal>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="partner-center-page">
      <header className="page-header">
        <h1 className="page-title">合伙人中心</h1>
      </header>

      <div className="partner-center-content">
          {activeTab === 'dashboard' && <DashboardTab partner={partner} />}
          {activeTab === 'customers' && <CustomersTab partner={partner} />}
          {activeTab === 'earnings' && <EarningsTab partner={partner} />}
          {activeTab === 'region' && <RegionTab partner={partner} />}
          {activeTab === 'withdraw' && <WithdrawTab partner={partner} />}
          {activeTab === 'assessment' && <AssessmentTab />}
      </div>
    </div>
  );
}

function DashboardTab({ partner }: { partner: Partner }) {
  const [gmvStats, setGmvStats] = useState<GmvLineStat[]>([]);
  const [localOrders, setLocalOrders] = useState<PartnerLocalOrder[]>([]);

  useEffect(() => {
    partnerApi
      .gmvStats()
      .then(setGmvStats)
      .catch(() => setGmvStats([]));
    partnerApi
      .localOrders()
      .then(setLocalOrders)
      .catch(() => setLocalOrders([]));
  }, [partner.id]);
  const inviteUrl = `${window.location.origin}${window.location.pathname}#/login?invite=${partner.inviteCode}`;
  const { addToast } = useToast();

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast(`${label}已复制`, 'success');
  };

  const typeConfig = partnerTypeConfig[partner.type];

  const gmvChartData = useMemo(() => {
    const rows: Record<string, Record<string, number | string>> = {};
    gmvStats.forEach((line) => {
      line.monthly.forEach((point) => {
        rows[point.month] = { ...rows[point.month], month: point.month, [line.lineName]: point.gmv };
      });
    });
    return Object.values(rows).sort((a, b) => String(a.month).localeCompare(String(b.month)));
  }, [gmvStats]);

  const localGmv = useMemo(
    () =>
      localOrders
        .filter((o) => o.status !== 'pending_pay' && o.status !== 'refunded' && o.status !== 'closed')
        .reduce((sum, o) => sum + o.amount, 0),
    [localOrders]
  );
  const localShare = localGmv * (partner.commissionRate || typeConfig.rate);

  return (
    <div className="partner-center-dashboard">
      <Annotate id="partner-center.level-card">
      <div className="card partner-center-level-card" style={{ borderLeft: `4px solid ${typeConfig.color}` }}>
        <div className="partner-center-level-main">
          <div>
            <div className="partner-center-level-name" style={{ color: typeConfig.color }}>{getPartnerTypeLabel(partner.type)}</div>
            <div className="partner-center-level-rate">当前佣金比例 {((partner.commissionRate || typeConfig.rate) * 100).toFixed(0)}%</div>
          </div>
          <div className="partner-center-level-progress">
            <div className="partner-center-level-progress-bar" style={{ width: `${Math.min(100, (partner.totalEarnings / 20000) * 100)}%`, background: typeConfig.color }} />
          </div>
        </div>
        <div className="partner-center-level-benefits">
          {typeConfig.benefits.map((b) => (
            <span key={b} className="partner-center-level-benefit">{b}</span>
          ))}
        </div>
      </div>
      </Annotate>

      <Annotate id="partner-center.local-share">
      <div className="partner-center-local-share">
        <div className="card partner-center-stat"><MapPin size={20} color="#0891b2" /><div><div className="partner-center-stat-value">{partner.regionName || '未划分区域'}</div><div className="partner-center-stat-label">负责属地</div></div></div>
        <div className="card partner-center-stat"><BarChart3 size={20} color="#1B5E4B" /><div><div className="partner-center-stat-value">¥{localGmv.toFixed(2)}</div><div className="partner-center-stat-label">属地 GMV</div></div></div>
        <div className="card partner-center-stat"><Wallet size={20} color="#d97706" /><div><div className="partner-center-stat-value">¥{localShare.toFixed(2)}</div><div className="partner-center-stat-label">属地分成金额</div></div></div>
      </div>
      </Annotate>

      <div className="card">
        <div className="card-header"><h3 className="card-title"><BarChart3 size={16} /> GMV 分业务线统计</h3></div>
        <div className="card-body partner-center-chart-body">
          {gmvChartData.length === 0 ? (
            <div className="partner-center-empty">暂无 GMV 统计数据</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={gmvChartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `¥${Number(value ?? 0).toLocaleString()}`} />
                <Legend />
                {gmvStats.map((line, idx) => (
                  <Line
                    key={line.line}
                    type="monotone"
                    dataKey={line.lineName}
                    stroke={GMV_LINE_COLORS[idx % GMV_LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <Annotate id="partner-center.invite">
      <div className="card partner-center-invite">
        <div className="card-header"><h3 className="card-title"><Share2 size={16} /> 我的邀请</h3></div>
        <div className="card-body">
          <div className="partner-center-invite-row">
            <span className="partner-center-invite-label">邀请码</span>
            <span className="partner-center-invite-code">{partner.inviteCode}</span>
            <button className="btn btn-outline" onClick={() => copy(partner.inviteCode, '邀请码')}><Copy size={14} /> 复制</button>
          </div>
          <div className="partner-center-invite-row">
            <span className="partner-center-invite-label">邀请链接</span>
            <span className="partner-center-invite-link">{inviteUrl}</span>
            <button className="btn btn-outline" onClick={() => copy(inviteUrl, '邀请链接')}><Copy size={14} /> 复制</button>
          </div>
          <div className="partner-center-qr"><QrCode size={48} /><span>扫码访问邀请链接</span></div>
        </div>
      </div>
      </Annotate>
    </div>
  );
}

function CustomersTab({ partner }: { partner: Partner }) {
  const [keyword, setKeyword] = useState('');
  const [customers, setCustomers] = useState<PartnerCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<PartnerCustomer | null>(null);

  useEffect(() => {
    partnerApi
      .customers()
      .then((list) => setCustomers(list.map(mapMockCustomer)))
      .catch(() => setCustomers([]));
  }, [partner.id]);

  const filtered = customers.filter(
    (c) =>
      !keyword ||
      c.userId.includes(keyword) ||
      c.userName?.includes(keyword) ||
      c.userPhone?.includes(keyword)
  );

  return (
    <>
      <Annotate id="partner-center.customers">
      <div className="card">
        <div className="card-header partner-center-list-header">
          <h3 className="card-title"><Users size={16} /> 我的客户</h3>
          <div className="partner-center-search">
            <User size={14} />
            <input type="text" placeholder="搜索客户" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
        </div>
        <div className="card-body partner-center-list-body">
          {filtered.length === 0 ? (
            <div className="partner-center-empty">暂无客户</div>
          ) : (
            <div className="partner-center-customer-list">
              {filtered.map((c) => (
                <div className="partner-center-customer" key={c.id} onClick={() => setSelectedCustomer(c)} style={{ cursor: 'pointer' }}>
                  <div>
                    <div className="partner-center-customer-name">{c.userName || c.userId}</div>
                    <div className="partner-center-customer-meta"><Phone size={12} /> {c.userPhone || c.userId}</div>
                  </div>
                  <div className="partner-center-customer-status">
                    <span className={c.hasPaid ? 'paid' : 'free'}>{c.hasPaid ? '已付费' : '已注册'}</span>
                    {c.hasPaid && <span className="amount">累计 ¥{c.totalOrderAmount.toFixed(2)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </Annotate>

      <Modal open={!!selectedCustomer} title="客户详情" onClose={() => setSelectedCustomer(null)}>
        {selectedCustomer && (
          <div className="partner-center-detail">
            <div className="partner-center-detail-row"><span>客户姓名</span><span>{selectedCustomer.userName || '未命名'}</span></div>
            <div className="partner-center-detail-row"><span>客户电话</span><span>{selectedCustomer.userPhone || '-'}</span></div>
            <div className="partner-center-detail-row"><span>绑定方式</span><span>{selectedCustomer.bindType === 'invite_code' ? '邀请码' : selectedCustomer.bindType === 'manual' ? '手动绑定' : '其他'}</span></div>
            <div className="partner-center-detail-row"><span>付费状态</span><span>{selectedCustomer.hasPaid ? '已付费' : '已注册'}</span></div>
            <div className="partner-center-detail-row"><span>累计订单</span><span className="highlight">¥{selectedCustomer.totalOrderAmount.toFixed(2)}</span></div>
            <div className="partner-center-detail-row"><span>绑定时间</span><span>{new Date(selectedCustomer.createdAt).toLocaleString()}</span></div>
          </div>
        )}
      </Modal>
    </>
  );
}

function EarningsTab({ partner }: { partner: Partner }) {
  const [filter, setFilter] = useState<'all' | 'settled' | 'pending' | 'frozen'>('all');
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<CommissionRecord | null>(null);

  useEffect(() => {
    commissionApi
      .list()
      .then((list) => {
        setRecords(
          list.map((r) => ({
            id: r.id,
            partnerId: partner.id,
            userId: r.fromUserId || '',
            orderId: r.orderId,
            amount: r.amount,
            commission: r.commission,
            type: mapOrderTypeToCommissionType(r.orderType),
            status: r.status as CommissionRecord['status'],
            createdAt: r.createdAt,
            settledAt: r.settledAt,
          }))
        );
      })
      .catch(() => {});
  }, [partner.id]);

  const filtered = filter === 'all' ? records : records.filter((r) => r.status === filter);
  const total = records.reduce((sum, r) => sum + r.commission, 0);

  return (
    <>
      <Annotate id="partner-center.earnings">
      <div className="card">
        <div className="card-header partner-center-list-header">
          <h3 className="card-title"><TrendingUp size={16} /> 收益明细</h3>
          <div className="partner-center-earnings-summary">累计 ¥{total.toFixed(2)}</div>
        </div>
        <div className="card-body partner-center-list-body">
          <div className="partner-center-filter">
            <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
              <option value="all">全部</option>
              <option value="settled">已结算</option>
              <option value="pending">待结算</option>
              <option value="frozen">冻结中</option>
            </select>
          </div>
          {filtered.length === 0 ? (
            <div className="partner-center-empty">暂无收益记录</div>
          ) : (
            <div className="partner-center-earnings-list">
              {filtered.map((r: CommissionRecord) => (
                <div className="partner-center-earning" key={r.id} onClick={() => setSelectedRecord(r)} style={{ cursor: 'pointer' }}>
                  <div>
                    <div className="partner-center-earning-title">{getCommissionTypeLabel(r.type)}</div>
                    <div className="partner-center-earning-meta">{r.orderId} · {new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="partner-center-earning-amount">
                    <span>+¥{r.commission.toFixed(2)}</span>
                    <span className={`partner-center-earning-status ${r.status}`}>{getCommissionStatusLabel(r.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </Annotate>

      <Modal open={!!selectedRecord} title="收益详情" onClose={() => setSelectedRecord(null)}>
        {selectedRecord && (
          <div className="partner-center-detail">
            <div className="partner-center-detail-row"><span>订单编号</span><span>{selectedRecord.orderId}</span></div>
            <div className="partner-center-detail-row"><span>订单类型</span><span>{getCommissionTypeLabel(selectedRecord.type)}</span></div>
            <div className="partner-center-detail-row"><span>订单金额</span><span>¥{selectedRecord.amount.toFixed(2)}</span></div>
            <div className="partner-center-detail-row"><span>佣金比例</span><span>{((selectedRecord.commission / selectedRecord.amount) * 100).toFixed(0)}%</span></div>
            <div className="partner-center-detail-row"><span>佣金金额</span><span className="highlight">¥{selectedRecord.commission.toFixed(2)}</span></div>
            <div className="partner-center-detail-row"><span>结算状态</span><span>{getCommissionStatusLabel(selectedRecord.status)}</span></div>
            <div className="partner-center-detail-row"><span>创建时间</span><span>{new Date(selectedRecord.createdAt).toLocaleString()}</span></div>
            {selectedRecord.settledAt && <div className="partner-center-detail-row"><span>结算时间</span><span>{new Date(selectedRecord.settledAt).toLocaleString()}</span></div>}
          </div>
        )}
      </Modal>
    </>
  );
}

// 区域分佣：地域合伙人按区域获得分佣——区域内所有用户的消费订单都计入，不需要邀请关系
const regionOrderStatusLabels: Record<string, string> = {
  pending_pay: '待支付',
  paid: '已支付',
  delivering: '服务中',
  completed: '已完成',
  refunded: '已退款',
  closed: '已关闭',
};

function RegionTab({ partner }: { partner: Partner }) {
  const [orders, setOrders] = useState<PartnerLocalOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    partnerApi
      .localOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const typeConfig = partnerTypeConfig[partner.type];
  const rate = typeConfig.rate;
  const totalAmount = orders.reduce((sum, o) => sum + o.amount, 0);
  const totalCommission = Math.round(totalAmount * rate * 100) / 100;

  return (
    <>
      <Annotate id="partner-center.region">
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={22} color={typeConfig.color} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{partner.regionName || '未分配区域'} · {getPartnerTypeLabel(partner.type)}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>区域分佣比例 {(rate * 100).toFixed(0)}%</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.8, flex: 1, minWidth: 280 }}>
            区域分佣与邀请关系无关：只要下单用户属于「{partner.regionName || '我的区域'}」，无论通过谁的邀请码注册，其消费订单都按 {(rate * 100).toFixed(0)}% 计入您的分佣。
          </div>
        </div>
      </div>

      <div className="invite-stats" style={{ marginBottom: 16 }}>
        <div className="card" style={{ padding: '18px 22px' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>¥{totalAmount.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>区域订单总额</div>
        </div>
        <div className="card" style={{ padding: '18px 22px' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1B5E4B' }}>¥{totalCommission.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>我的区域分佣</div>
        </div>
        <div className="card" style={{ padding: '18px 22px' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{orders.length}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>区域订单数</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">区域分佣明细</h3></div>
        <div className="card-body">
          {loading ? (
            <div className="admin-table-empty">加载中…</div>
          ) : orders.length === 0 ? (
            <div className="admin-table-empty">暂无区域订单</div>
          ) : (
            <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>下单用户</th><th>商品</th><th>订单金额</th><th>分佣比例</th><th>我的分佣</th><th>订单状态</th><th>时间</th></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.userNickname}</td>
                    <td className="admin-table-text-left">{o.productName}</td>
                    <td>¥{o.amount.toLocaleString()}</td>
                    <td>{(rate * 100).toFixed(0)}%</td>
                    <td style={{ color: '#1B5E4B', fontWeight: 600 }}>+¥{(Math.round(o.amount * rate * 100) / 100).toLocaleString()}</td>
                    <td>{regionOrderStatusLabels[o.status] || o.status}</td>
                    <td>{new Date(o.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
      </Annotate>
    </>
  );
}

function WithdrawTab({ partner }: { partner: Partner }) {
  const { addToast } = useToast();
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  const load = () => {
    commissionApi.summary().then((s) => setBalance(s.settled)).catch(() => {});
    commissionApi
      .withdrawals()
      .then((list) =>
        setWithdrawals(
          list.map((w) => ({
            id: w.id,
            partnerId: partner.id,
            partnerName: partner.name,
            amount: w.amount,
            status: w.status as Withdrawal['status'],
            createdAt: w.appliedAt,
            processedAt: w.paidAt,
          }))
        )
      )
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const pending = withdrawals.filter((w) => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0);

  const handleSubmit = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      addToast('请输入正确的提现金额', 'error');
      return;
    }
    if (value > balance - pending) {
      addToast('提现金额不能超过可提现余额', 'error');
      return;
    }
    try {
      await commissionApi.withdraw(value);
      addToast('提现申请已提交', 'success');
      setAmount('');
      load();
    } catch (err: any) {
      addToast(err.message || '提现申请失败', 'error');
    }
  };

  return (
    <Annotate id="partner-center.withdraw">
    <div className="partner-center-withdraw">
      <div className="card partner-center-balance-card">
        <div className="card-body">
          <div className="partner-center-balance-row">
            <div>
              <div className="partner-center-balance-label">可提现余额</div>
              <div className="partner-center-balance-value">¥{balance.toFixed(2)}</div>
            </div>
            <div>
              <div className="partner-center-balance-label">审核中</div>
              <div className="partner-center-balance-value sub">¥{pending.toFixed(2)}</div>
            </div>
          </div>
          <div className="partner-center-withdraw-input">
            <input type="number" placeholder="输入提现金额" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button className="btn btn-primary" onClick={handleSubmit}>提交提现</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title"><CreditCard size={16} /> 提现记录</h3></div>
        <div className="card-body partner-center-list-body">
          {withdrawals.length === 0 ? (
            <div className="partner-center-empty">暂无提现记录</div>
          ) : (
            <div className="partner-center-withdrawal-list">
              {withdrawals.map((w: Withdrawal) => (
                <div className="partner-center-withdrawal" key={w.id}>
                  <div>
                    <div className="partner-center-withdrawal-amount">¥{w.amount.toFixed(2)}</div>
                    <div className="partner-center-withdrawal-time">{new Date(w.createdAt).toLocaleString()}</div>
                  </div>
                  <div className={`partner-center-withdrawal-status ${w.status}`}>
                    {w.status === 'pending' && <Clock size={12} />}
                    {w.status === 'paid' && <CheckCircle size={12} />}
                    {w.status === 'rejected' && <XCircle size={12} />}
                    {getWithdrawalStatusLabel(w.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </Annotate>
  );
}


function AssessmentTab() {
  const [data, setData] = useState<PartnerAssessment | null>(null);

  useEffect(() => {
    partnerApi
      .assessment()
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="card">
        <div className="card-body partner-center-empty">暂无考核数据</div>
      </div>
    );
  }

  const percent = data.gmvTarget > 0 ? Math.min(100, (data.gmvCompleted / data.gmvTarget) * 100) : 0;
  const gap = Math.max(0, data.gmvTarget - data.gmvCompleted);

  return (
    <Annotate id="partner-center.assessment">
    <div className="partner-center-dashboard">
      <div className="card partner-center-level-card">
        <div className="partner-center-level-main">
          <div>
            <div className="partner-center-level-name" style={{ color: '#1B5E4B' }}>{data.gmvTier}</div>
            <div className="partner-center-level-rate">
              {data.year} 年度 GMV ¥{data.gmvCompleted.toLocaleString()} / 目标 ¥{data.gmvTarget.toLocaleString()}
            </div>
          </div>
          <div className="partner-center-level-progress">
            <div className="partner-center-level-progress-bar" style={{ width: `${percent}%`, background: '#1B5E4B' }} />
          </div>
          <div className="partner-center-level-percent">{percent.toFixed(1)}%</div>
        </div>
        <div className="partner-center-level-benefits">
          <span className="partner-center-level-benefit">当前档位 {data.gmvTier}</span>
          <span className="partner-center-level-benefit">
            {gap > 0 ? `距下一档位还差 ¥${gap.toLocaleString()}` : '已达成最高档位目标'}
          </span>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title"><ClipboardCheck size={16} /> 考核指标</h3></div>
        <div className="card-body partner-center-list-body">
          {data.metrics.length === 0 ? (
            <div className="partner-center-empty">暂无考核指标</div>
          ) : (
            <div className="pc-table">
              <div className="pc-row pc-header">
                <div className="pc-cell">考核指标</div>
                <div className="pc-cell">目标值</div>
                <div className="pc-cell">完成值</div>
                <div className="pc-cell">完成率</div>
              </div>
              {data.metrics.map((m) => {
                const rate = m.target > 0 ? Math.min(100, (m.completed / m.target) * 100) : 0;
                return (
                  <div className="pc-row" key={m.name}>
                    <div className="pc-cell">{m.name}</div>
                    <div className="pc-cell">{m.target}</div>
                    <div className="pc-cell">{m.completed}</div>
                    <div className="pc-cell">
                      <div className="pc-metric-rate">
                        <div className="partner-center-level-progress pc-metric-bar">
                          <div
                            className="partner-center-level-progress-bar"
                            style={{ width: `${rate}%`, background: rate >= 100 ? '#1B5E4B' : '#d97706' }}
                          />
                        </div>
                        <span>{rate.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title"><Wallet size={16} /> 分成发放记录</h3></div>
        <div className="card-body partner-center-list-body">
          {data.payouts.length === 0 ? (
            <div className="partner-center-empty">暂无分成发放记录</div>
          ) : (
            <div className="pc-table">
              <div className="pc-row pc-header">
                <div className="pc-cell">结算周期</div>
                <div className="pc-cell">发放金额</div>
                <div className="pc-cell">状态</div>
                <div className="pc-cell">发放时间</div>
              </div>
              {data.payouts.map((p) => (
                <div className="pc-row" key={p.id}>
                  <div className="pc-cell">{p.period}</div>
                  <div className="pc-cell">¥{p.amount.toFixed(2)}</div>
                  <div className="pc-cell">
                    <span className={`pc-status ${p.status}`}>{p.status === 'paid' ? '已发放' : '待发放'}</span>
                  </div>
                  <div className="pc-cell">{p.paidAt ? new Date(p.paidAt).toLocaleString() : '-'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </Annotate>
  );
}

function mapMockPartner(p: MockPartner): Partner {
  return {
    id: p.id,
    type: p.type,
    name: p.name,
    phone: p.phone,
    email: p.email,
    regionCode: p.regionCode,
    regionName: p.regionName,
    parentId: p.parentId,
    inviteCode: p.inviteCode,
    commissionRate: p.commissionRate,
    balance: p.balance,
    totalEarnings: p.totalEarnings,
    status: p.status,
    createdAt: p.createdAt,
  };
}

function mapMockCustomer(c: MockPartnerCustomer): PartnerCustomer {
  return {
    id: c.id,
    partnerId: c.partnerId,
    userId: c.userId,
    userName: c.userName,
    userPhone: c.userPhone,
    bindType: c.bindType,
    hasPaid: c.hasPaid,
    totalOrderAmount: c.totalOrderAmount,
    createdAt: c.createdAt,
  };
}

function mapOrderTypeToCommissionType(type: MockCommissionRecord['orderType']): CommissionRecord['type'] {
  const map: Record<string, CommissionRecord['type']> = {
    biography: 'biography',
    digital_person: 'digital_person',
    video: 'other',
    qrcode: 'other',
    book: 'print',
    biographer_service: 'other',
    group_buy: 'biography',
  };
  return map[type] || 'other';
}

function getCommissionTypeLabel(type: CommissionRecord['type']): string {
  const map: Record<CommissionRecord['type'], string> = {
    interview: 'AI 采访服务',
    biography: '传记生成服务',
    digital_person: '数字人服务',
    subscription: '会员订阅',
    print: '实体书印刷',
    other: '其他服务',
  };
  return map[type];
}
