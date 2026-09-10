import { useMemo, useState } from 'react';
import { MapPin, PenLine, Search, User } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import Annotate from '../components/annotation/Annotate';
import './WithdrawalManagement.css';

type WithdrawalRole = 'user' | 'biographer' | 'regional_partner';
type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'paid';

interface WithdrawalReviewItem {
  id: string;
  role: WithdrawalRole;
  applicant: string;
  account: string;
  amount: number;
  appliedAt: string;
  status: WithdrawalStatus;
  channel: string;
}

const roleTabs: Array<{ key: WithdrawalRole; label: string; icon: typeof User }> = [
  { key: 'user', label: '普通用户', icon: User },
  { key: 'biographer', label: '传记师', icon: PenLine },
  { key: 'regional_partner', label: '区域合伙人', icon: MapPin },
];

const statusLabels: Record<WithdrawalStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  paid: '已打款',
};

const initialWithdrawals: WithdrawalReviewItem[] = [
  { id: 'wd_user_001', role: 'user', applicant: '张女士', account: '微信零钱 · 138****6201', amount: 680, appliedAt: '2026-09-10 09:20', status: 'pending', channel: '传记分享奖励' },
  { id: 'wd_user_002', role: 'user', applicant: '王先生', account: '支付宝 · wang**@demo.com', amount: 320, appliedAt: '2026-09-08 15:42', status: 'paid', channel: '家庭空间收益' },
  { id: 'wd_bio_001', role: 'biographer', applicant: '李传记', account: '微信零钱 · 13900139001', amount: 5999, appliedAt: '2026-09-10 10:05', status: 'pending', channel: '传记服务结算' },
  { id: 'wd_bio_002', role: 'biographer', applicant: '周老师', account: '银行卡 · 尾号 8821', amount: 2800, appliedAt: '2026-09-06 11:30', status: 'approved', channel: '传记服务结算' },
  { id: 'wd_partner_001', role: 'regional_partner', applicant: '杭州西湖区服务商', account: '对公账户 · 尾号 3028', amount: 12800, appliedAt: '2026-09-09 16:18', status: 'pending', channel: '区域分润结算' },
  { id: 'wd_partner_002', role: 'regional_partner', applicant: '苏州区域合伙人', account: '银行卡 · 尾号 7616', amount: 8600, appliedAt: '2026-09-04 09:12', status: 'rejected', channel: '区域分润结算' },
];

export default function WithdrawalManagement() {
  const { addToast } = useToast();
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [activeRole, setActiveRole] = useState<WithdrawalRole>('user');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | 'all'>('all');

  const filtered = useMemo(() => withdrawals.filter((item) => {
    const query = keyword.trim().toLowerCase();
    const matchesRole = item.role === activeRole;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesKeyword = !query || `${item.applicant} ${item.account} ${item.id}`.toLowerCase().includes(query);
    return matchesRole && matchesStatus && matchesKeyword;
  }), [activeRole, keyword, statusFilter, withdrawals]);

  const pendingCounts = useMemo(() => roleTabs.reduce<Record<WithdrawalRole, number>>((result, tab) => {
    result[tab.key] = withdrawals.filter((item) => item.role === tab.key && item.status === 'pending').length;
    return result;
  }, { user: 0, biographer: 0, regional_partner: 0 }), [withdrawals]);

  const handleProcess = (id: string, status: Extract<WithdrawalStatus, 'paid' | 'rejected'>) => {
    setWithdrawals((prev) => prev.map((item) => item.id === id ? { ...item, status } : item));
    addToast(status === 'paid' ? '提现申请已通过并完成打款' : '提现申请已拒绝', 'success');
  };

  return (
    <div className="withdrawal-management-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">提现审核</h1>
          <p className="page-subtitle">按申请主体审核普通用户、传记师和区域合伙人的提现申请</p>
        </div>
      </header>

      <Annotate id="withdrawal-management.role-tabs">
      <div className="withdrawal-role-tabs" role="tablist" aria-label="提现主体">
        {roleTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={`withdrawal-role-tab ${activeRole === tab.key ? 'active' : ''}`}
              onClick={() => setActiveRole(tab.key)}
              role="tab"
              aria-selected={activeRole === tab.key}
              type="button"
            >
              <span className="withdrawal-role-tab-label"><Icon size={16} />{tab.label}</span>
              <span className="withdrawal-role-tab-count">{pendingCounts[tab.key]} 条待审核</span>
            </button>
          );
        })}
      </div>
      </Annotate>

      <div className="card">
        <div className="card-header withdrawal-header">
          <Annotate id="withdrawal-management.filter" inline>
          <div className="withdrawal-filters">
            <div className="withdrawal-search">
              <Search size={14} />
              <input type="text" placeholder="搜索申请人、提现单号" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as WithdrawalStatus | 'all')}>
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="paid">已打款</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
          </Annotate>
        </div>

        <Annotate id="withdrawal-management.list">
        <div className="card-body withdrawal-body">
          {filtered.length === 0 ? (
            <div className="admin-table-empty">暂无符合条件的提现记录</div>
          ) : (
            <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>申请人</th>
                  <th>提现单号</th>
                  <th>收款账户</th>
                  <th>提现金额</th>
                  <th>提现来源</th>
                  <th>申请时间</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className="admin-table-text-left">{item.applicant}</td>
                  <td>{item.id}</td>
                  <td className="admin-table-text-left">{item.account}</td>
                  <td><strong>¥{item.amount.toLocaleString()}</strong></td>
                  <td>{item.channel}</td>
                  <td>{item.appliedAt}</td>
                  <td><span className={`withdrawal-status ${item.status}`}>{statusLabels[item.status]}</span></td>
                  <td>
                    {item.status === 'pending' ? (
                      <Annotate id="withdrawal-management.review" inline>
                      <>
                        <button className="admin-table-link" onClick={() => handleProcess(item.id, 'paid')}>通过并打款</button>
                        <button className="admin-table-link danger" onClick={() => handleProcess(item.id, 'rejected')}>拒绝</button>
                      </>
                      </Annotate>
                    ) : (
                      <span className="admin-table-muted">已处理</span>
                    )}
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
    </div>
  );
}
