import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import Annotate from '../components/annotation/Annotate';
import Modal from '../components/ui/Modal';
import { readUserWithdrawalDemos, updateUserWithdrawalDemo, USER_WITHDRAWAL_EVENT } from '../data/userWithdrawalDemo';
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
  rejectionReason?: string;
}

const roleTabs: Array<{ key: WithdrawalRole; label: string }> = [
  { key: 'user', label: '普通用户' },
  { key: 'biographer', label: '传记师' },
  { key: 'regional_partner', label: '区域合伙人' },
];

const statusLabels: Record<WithdrawalStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  paid: '已打款',
};

const initialWithdrawals: WithdrawalReviewItem[] = [
  { id: 'wd_user_001', role: 'user', applicant: '张女士', account: '微信零钱 · 13800136201', amount: 680, appliedAt: '2026-09-10 09:20', status: 'pending', channel: '传记分享奖励' },
  { id: 'wd_user_002', role: 'user', applicant: '王先生', account: '微信零钱 · 13900138002', amount: 320, appliedAt: '2026-09-08 15:42', status: 'paid', channel: '家庭空间收益' },
  { id: 'wd_bio_001', role: 'biographer', applicant: '李传记', account: '微信零钱 · 13900139001', amount: 5999, appliedAt: '2026-09-10 10:05', status: 'pending', channel: '传记服务结算' },
  { id: 'wd_bio_002', role: 'biographer', applicant: '周老师', account: '微信零钱 · 13900138821', amount: 2800, appliedAt: '2026-09-06 11:30', status: 'approved', channel: '传记服务结算' },
  { id: 'wd_partner_001', role: 'regional_partner', applicant: '杭州西湖区服务商', account: '对公账户 · 尾号 3028', amount: 12800, appliedAt: '2026-09-09 16:18', status: 'pending', channel: '区域分润结算' },
  { id: 'wd_partner_002', role: 'regional_partner', applicant: '苏州区域合伙人', account: '银行卡 · 尾号 7616', amount: 8600, appliedAt: '2026-09-04 09:12', status: 'rejected', channel: '区域分润结算', rejectionReason: '收款账户信息与申请主体不一致，请核对后重新提交。' },
];

const readWithdrawalItems = (): WithdrawalReviewItem[] => [
  ...readUserWithdrawalDemos().map((item) => ({ ...item, role: 'user' as const, channel: '邀请奖励提现', appliedAt: new Date(item.appliedAt).toLocaleString('zh-CN', { hour12: false }) })),
  ...initialWithdrawals,
];

export default function WithdrawalManagement() {
  const { addToast } = useToast();
  const [withdrawals, setWithdrawals] = useState(readWithdrawalItems);
  const [activeRole, setActiveRole] = useState<WithdrawalRole>('user');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | 'all'>('all');
  const [appliedFilters, setAppliedFilters] = useState<{ keyword: string; status: WithdrawalStatus | 'all' }>({ keyword: '', status: 'all' });
  const [rejectingItem, setRejectingItem] = useState<WithdrawalReviewItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const sync = () => setWithdrawals((current) => {
      const existingSamples = initialWithdrawals.map((sample) => current.find((item) => item.id === sample.id) || sample);
      return [...readWithdrawalItems().filter((item) => !initialWithdrawals.some((sample) => sample.id === item.id)), ...existingSamples];
    });
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    window.addEventListener(USER_WITHDRAWAL_EVENT, sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('focus', sync); window.removeEventListener(USER_WITHDRAWAL_EVENT, sync); };
  }, []);

  const filtered = useMemo(() => withdrawals.filter((item) => {
    const query = appliedFilters.keyword.trim().toLowerCase();
    const matchesRole = item.role === activeRole;
    const matchesStatus = appliedFilters.status === 'all' || item.status === appliedFilters.status;
    const matchesKeyword = !query || `${item.applicant} ${item.account} ${item.id}`.toLowerCase().includes(query);
    return matchesRole && matchesStatus && matchesKeyword;
  }), [activeRole, appliedFilters, withdrawals]);

  const queryWithdrawals = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters({ keyword, status: statusFilter });
  };

  const resetFilters = () => {
    setKeyword('');
    setStatusFilter('all');
    setAppliedFilters({ keyword: '', status: 'all' });
  };

  const pendingCounts = useMemo(() => roleTabs.reduce<Record<WithdrawalRole, number>>((result, tab) => {
    result[tab.key] = withdrawals.filter((item) => item.role === tab.key && item.status === 'pending').length;
    return result;
  }, { user: 0, biographer: 0, regional_partner: 0 }), [withdrawals]);

  const handleProcess = (id: string, status: Extract<WithdrawalStatus, 'paid' | 'rejected'>, reason = '') => {
    setWithdrawals((prev) => prev.map((item) => item.id === id ? { ...item, status, rejectionReason: status === 'rejected' ? reason : undefined } : item));
    updateUserWithdrawalDemo(id, status, status === 'rejected' ? reason : undefined);
    addToast(status === 'paid' ? '提现申请已通过并完成打款' : '提现申请已拒绝', 'success');
  };

  const confirmReject = () => {
    if (!rejectingItem) return;
    const reason = rejectionReason.trim();
    if (!reason) { addToast('请填写拒绝理由', 'error'); return; }
    handleProcess(rejectingItem.id, 'rejected', reason);
    setRejectingItem(null);
    setRejectionReason('');
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
          return (
            <button
              key={tab.key}
              className={`withdrawal-role-tab ${activeRole === tab.key ? 'active' : ''}`}
              onClick={() => setActiveRole(tab.key)}
              role="tab"
              aria-selected={activeRole === tab.key}
              type="button"
            >
              <span className="withdrawal-role-tab-label">{tab.label}</span>
              <span className="withdrawal-role-tab-count">{pendingCounts[tab.key]} 条待审核</span>
            </button>
          );
        })}
      </div>
      </Annotate>

      <div className="card">
        <div className="card-header withdrawal-header">
          <Annotate id="withdrawal-management.filter" inline>
          <form className="withdrawal-filters" onSubmit={queryWithdrawals}>
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
            <div className="withdrawal-filter-actions"><button className="btn btn-primary" type="submit">查询</button><button className="btn btn-outline" type="button" onClick={resetFilters}>重置</button></div>
          </form>
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
                  <td><span className={`withdrawal-status ${item.status}`}>{statusLabels[item.status]}</span>{item.rejectionReason && <div className="withdrawal-rejection-reason">拒绝理由：{item.rejectionReason}</div>}</td>
                  <td>
                    {item.status === 'pending' ? (
                      <Annotate id="withdrawal-management.review" inline>
                      <>
                        <button className="admin-table-link" onClick={() => handleProcess(item.id, 'paid')}>通过并打款</button>
                        <button className="admin-table-link danger" onClick={() => { setRejectingItem(item); setRejectionReason(''); }}>拒绝</button>
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
      <Modal open={!!rejectingItem} title="拒绝提现申请" onClose={() => setRejectingItem(null)} className="withdrawal-reject-modal" footer={<><button className="btn btn-outline" onClick={() => setRejectingItem(null)}>取消</button><button className="btn btn-primary" onClick={confirmReject}>确认拒绝</button></>}>
        {rejectingItem && <><p className="withdrawal-reject-summary">{rejectingItem.applicant} · {rejectingItem.id} · ¥{rejectingItem.amount.toLocaleString()}</p><label className="withdrawal-reject-label">拒绝理由（必填）<textarea autoFocus rows={4} maxLength={500} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="请输入本次拒绝原因" /></label></>}
      </Modal>
    </div>
  );
}
