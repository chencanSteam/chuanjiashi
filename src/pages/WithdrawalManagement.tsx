import { useEffect, useMemo, useState } from 'react';
import { Search, CreditCard, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { loadWithdrawals, processWithdrawal, getWithdrawalStatusLabel } from '../data/partnerData';
import type { Withdrawal, WithdrawalStatus } from '../types/partner';
import './WithdrawalManagement.css';

export default function WithdrawalManagement() {
  const { addToast } = useToast();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | 'all'>('all');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    setWithdrawals(loadWithdrawals());
  }, [refresh]);

  const filtered = useMemo(() => {
    return withdrawals.filter((w) => {
      const matchKeyword =
        !keyword ||
        w.partnerName.includes(keyword) ||
        w.partnerId.includes(keyword);
      const matchStatus = statusFilter === 'all' || w.status === statusFilter;
      return matchKeyword && matchStatus;
    });
  }, [withdrawals, keyword, statusFilter]);

  const stats = useMemo(() => {
    return {
      pending: withdrawals.filter((w) => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0),
      paid: withdrawals.filter((w) => w.status === 'paid').reduce((sum, w) => sum + w.amount, 0),
      total: withdrawals.length,
    };
  }, [withdrawals]);

  const handleProcess = (id: string, status: WithdrawalStatus) => {
    processWithdrawal(id, status);
    setRefresh((v) => v + 1);
    addToast(status === 'paid' ? '已标记为打款' : status === 'approved' ? '已通过提现申请' : '已拒绝提现申请', 'success');
  };

  return (
    <div className="withdrawal-management-page">
      <header className="page-header">
        <h1 className="page-title">提现审核</h1>
      </header>

      <div className="withdrawal-stats">
        <div className="card withdrawal-stat">
          <Clock size={20} color="#d97706" />
          <div>
            <div className="withdrawal-stat-value">¥{stats.pending.toFixed(2)}</div>
            <div className="withdrawal-stat-label">待审核金额</div>
          </div>
        </div>
        <div className="card withdrawal-stat">
          <DollarSign size={20} color="#1B5E4B" />
          <div>
            <div className="withdrawal-stat-value">¥{stats.paid.toFixed(2)}</div>
            <div className="withdrawal-stat-label">已打款金额</div>
          </div>
        </div>
        <div className="card withdrawal-stat">
          <CreditCard size={20} color="#2563eb" />
          <div>
            <div className="withdrawal-stat-value">{stats.total}</div>
            <div className="withdrawal-stat-label">提现笔数</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header withdrawal-header">
          <div className="withdrawal-filters">
            <div className="withdrawal-search">
              <Search size={14} />
              <input type="text" placeholder="搜索合伙人姓名" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as WithdrawalStatus | 'all')}>
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="paid">已打款</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
        </div>
        <div className="card-body withdrawal-body">
          {filtered.length === 0 ? (
            <div className="withdrawal-empty">暂无提现记录</div>
          ) : (
            <div className="withdrawal-list">
              {filtered.map((w) => (
                <div className="withdrawal-card" key={w.id}>
                  <div className="withdrawal-main">
                    <div className="withdrawal-title">
                      <span>{w.partnerName}</span>
                      <span className={`withdrawal-status ${w.status}`}>{getWithdrawalStatusLabel(w.status)}</span>
                    </div>
                    <div className="withdrawal-amount">¥{w.amount.toFixed(2)}</div>
                    <div className="withdrawal-time">申请时间：{new Date(w.createdAt).toLocaleString()}</div>
                  </div>
                  {w.status === 'pending' && (
                    <div className="withdrawal-actions">
                      <button className="btn btn-primary" onClick={() => handleProcess(w.id, 'paid')}>
                        <CheckCircle size={14} /> 确认打款
                      </button>
                      <button className="btn btn-outline" onClick={() => handleProcess(w.id, 'rejected')}>
                        <XCircle size={14} /> 拒绝
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
