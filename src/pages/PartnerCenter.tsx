import { useState, useEffect } from 'react';
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
} from 'lucide-react';
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
} from '../mocks/types';
import {
  getCommissionStatusLabel,
  getWithdrawalStatusLabel,
  partnerTypeConfig,
  getPartnerTypeLabel,
} from '../data/partnerData';
import type { CommissionRecord, Withdrawal, Partner, PartnerCustomer } from '../types/partner';
import './PartnerCenter.css';



const tabs = [
  { key: 'dashboard', icon: LayoutDashboard, label: '数据看板' },
  { key: 'customers', icon: Users, label: '我的客户' },
  { key: 'earnings', icon: TrendingUp, label: '我的收益' },
  { key: 'withdraw', icon: CreditCard, label: '提现' },
];

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
            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => setShowApply(true)}
            >
              <FileText size={14} /> 申请成为合伙人
            </button>
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
          {activeTab === 'withdraw' && <WithdrawTab partner={partner} />}
      </div>
    </div>
  );
}

function DashboardTab({ partner }: { partner: Partner }) {
  const [customers, setCustomers] = useState<PartnerCustomer[]>([]);

  useEffect(() => {
    partnerApi
      .customers()
      .then((list) => setCustomers(list.map(mapMockCustomer)))
      .catch(() => setCustomers([]));
  }, [partner.id]);
  const paidCustomers = customers.filter((c) => c.hasPaid);
  const [summary, setSummary] = useState({ total: 0, settled: 0, pending: 0, frozen: 0 });
  const inviteUrl = `${window.location.origin}/login?invite=${partner.inviteCode}`;
  const { addToast } = useToast();

  useEffect(() => {
    commissionApi.summary().then(setSummary).catch(() => {});
  }, []);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast(`${label}已复制`, 'success');
  };

  const typeConfig = partnerTypeConfig[partner.type];

  return (
    <div className="partner-center-dashboard">
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

      <div className="partner-center-stats">
        <div className="card partner-center-stat"><Wallet size={20} color="#1B5E4B" /><div><div className="partner-center-stat-value">¥{summary.settled.toFixed(2)}</div><div className="partner-center-stat-label">可提现余额</div></div></div>
        <div className="card partner-center-stat"><TrendingUp size={20} color="#2563eb" /><div><div className="partner-center-stat-value">¥{summary.total.toFixed(2)}</div><div className="partner-center-stat-label">累计收益</div></div></div>
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
