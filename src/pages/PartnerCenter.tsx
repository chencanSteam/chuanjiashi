import { useState, useMemo } from 'react';
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
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  getPartnerByPhone,
  getCustomersByPartner,
  getCommissionRecordsByPartner,
  getWithdrawalsByPartner,
  applyWithdrawal,
  getCommissionStatusLabel,
  getWithdrawalStatusLabel,
} from '../data/partnerData';
import type { CommissionRecord, Withdrawal } from '../types/partner';
import './PartnerCenter.css';

const tabs = [
  { key: 'dashboard', icon: LayoutDashboard, label: '数据看板' },
  { key: 'customers', icon: Users, label: '我的客户' },
  { key: 'earnings', icon: TrendingUp, label: '我的收益' },
  { key: 'withdraw', icon: CreditCard, label: '提现' },
];

export default function PartnerCenter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const partner = user?.phone ? getPartnerByPhone(user.phone) : undefined;

  if (!partner) {
    return (
      <div className="partner-center-page">
        <header className="page-header"><h1 className="page-title">合伙人中心</h1></header>
        <div className="card"><div className="card-body">您还不是合伙人，请先提交合伙人申请。</div></div>
      </div>
    );
  }

  return (
    <div className="partner-center-page">
      <header className="page-header">
        <h1 className="page-title">合伙人中心</h1>
      </header>

      <div className="partner-center-layout">
        <div className="card partner-center-sidebar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`partner-center-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
              {activeTab === tab.key && <ArrowRight size={14} className="partner-center-tab-arrow" />}
            </button>
          ))}
        </div>

        <div className="partner-center-content">
          {activeTab === 'dashboard' && <DashboardTab partner={partner} />}
          {activeTab === 'customers' && <CustomersTab partner={partner} />}
          {activeTab === 'earnings' && <EarningsTab partner={partner} />}
          {activeTab === 'withdraw' && <WithdrawTab partner={partner} />}
        </div>
      </div>
    </div>
  );
}

function DashboardTab({ partner }: { partner: NonNullable<ReturnType<typeof getPartnerByPhone>> }) {
  const customers = useMemo(() => getCustomersByPartner(partner.id), [partner.id]);
  const records = useMemo(() => getCommissionRecordsByPartner(partner.id), [partner.id]);
  const paidCustomers = customers.filter((c) => c.hasPaid);
  const totalEarnings = records.reduce((sum, r) => sum + r.commission, 0);
  const inviteUrl = `${window.location.origin}/login?invite=${partner.inviteCode}`;
  const { addToast } = useToast();

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast(`${label}已复制`, 'success');
  };

  return (
    <div className="partner-center-dashboard">
      <div className="partner-center-stats">
        <div className="card partner-center-stat"><Wallet size={20} color="#1B5E4B" /><div><div className="partner-center-stat-value">¥{partner.balance.toFixed(2)}</div><div className="partner-center-stat-label">可提现余额</div></div></div>
        <div className="card partner-center-stat"><TrendingUp size={20} color="#2563eb" /><div><div className="partner-center-stat-value">¥{totalEarnings.toFixed(2)}</div><div className="partner-center-stat-label">累计收益</div></div></div>
        <div className="card partner-center-stat"><Users size={20} color="#7c3aed" /><div><div className="partner-center-stat-value">{customers.length}</div><div className="partner-center-stat-label">绑定客户</div></div></div>
        <div className="card partner-center-stat"><Share2 size={20} color="#d97706" /><div><div className="partner-center-stat-value">{paidCustomers.length}</div><div className="partner-center-stat-label">已付费客户</div></div></div>
      </div>

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
    </div>
  );
}

function CustomersTab({ partner }: { partner: NonNullable<ReturnType<typeof getPartnerByPhone>> }) {
  const [keyword, setKeyword] = useState('');
  const customers = useMemo(() => getCustomersByPartner(partner.id), [partner.id]);
  const filtered = customers.filter(
    (c) =>
      !keyword ||
      c.userId.includes(keyword) ||
      c.userName?.includes(keyword) ||
      c.userPhone?.includes(keyword)
  );

  return (
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
              <div className="partner-center-customer" key={c.id}>
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
  );
}

function EarningsTab({ partner }: { partner: NonNullable<ReturnType<typeof getPartnerByPhone>> }) {
  const [filter, setFilter] = useState<'all' | 'settled' | 'withdrawn'>('all');
  const records = useMemo(() => getCommissionRecordsByPartner(partner.id), [partner.id]);
  const filtered = filter === 'all' ? records : records.filter((r) => r.status === filter);
  const total = records.reduce((sum, r) => sum + r.commission, 0);

  return (
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
            <option value="withdrawn">已提现</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <div className="partner-center-empty">暂无收益记录</div>
        ) : (
          <div className="partner-center-earnings-list">
            {filtered.map((r: CommissionRecord) => (
              <div className="partner-center-earning" key={r.id}>
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
  );
}

function WithdrawTab({ partner }: { partner: NonNullable<ReturnType<typeof getPartnerByPhone>> }) {
  const { addToast } = useToast();
  const [amount, setAmount] = useState('');
  const [refresh, setRefresh] = useState(0);
  const withdrawals = useMemo(() => getWithdrawalsByPartner(partner.id), [partner.id, refresh]);
  const pending = withdrawals.filter((w) => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0);

  const handleSubmit = () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      addToast('请输入正确的提现金额', 'error');
      return;
    }
    if (value > partner.balance + pending) {
      addToast('提现金额不能超过可提现余额', 'error');
      return;
    }
    const result = applyWithdrawal(partner.id, value);
    if (!result) {
      addToast('提现申请失败', 'error');
      return;
    }
    addToast('提现申请已提交', 'success');
    setAmount('');
    setRefresh((v) => v + 1);
  };

  return (
    <div className="partner-center-withdraw">
      <div className="card partner-center-balance-card">
        <div className="card-body">
          <div className="partner-center-balance-row">
            <div>
              <div className="partner-center-balance-label">可提现余额</div>
              <div className="partner-center-balance-value">¥{partner.balance.toFixed(2)}</div>
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
  );
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
