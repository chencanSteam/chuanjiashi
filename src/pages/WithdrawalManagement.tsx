import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { commissionApi } from '../api/commission';
import { getWithdrawalStatusLabel } from '../data/partnerData';
import Annotate from '../components/annotation/Annotate';
import type { WithdrawalRecord as MockWithdrawalRecord } from '../mocks/types';
import type { Withdrawal, WithdrawalStatus } from '../types/partner';
import './WithdrawalManagement.css';

export default function WithdrawalManagement() {
  const { addToast } = useToast();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | 'all'>('all');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    commissionApi
      .adminWithdrawals()
      .then((list) => setWithdrawals(list.map(mapMockWithdrawalRecord)))
      .catch(() => setWithdrawals([]));
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

  const handleProcess = async (id: string, status: WithdrawalStatus) => {
    try {
      await commissionApi.processWithdrawal(id, status as MockWithdrawalRecord['status']);
      setRefresh((v) => v + 1);
      addToast(status === 'paid' ? '已标记为打款' : status === 'approved' ? '已通过提现申请' : '已拒绝提现申请', 'success');
    } catch (err: any) {
      addToast(err.message || '操作失败', 'error');
    }
  };

  return (
    <div className="withdrawal-management-page">
      <header className="page-header">
        <h1 className="page-title">提现审核</h1>
      </header>

      <div className="card">
        <div className="card-header withdrawal-header">
          <Annotate id="withdrawal-management.filter" inline>
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
          </Annotate>
        </div>
        <Annotate id="withdrawal-management.list">
        <div className="card-body withdrawal-body">
          {filtered.length === 0 ? (
            <div className="admin-table-empty">暂无提现记录</div>
          ) : (
            <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>合伙人</th>
                  <th>提现金额</th>
                  <th>申请时间</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
              {filtered.map((w) => (
                <tr key={w.id}>
                  <td className="admin-table-text-left">{w.partnerName}</td>
                  <td>¥{w.amount.toFixed(2)}</td>
                  <td>{new Date(w.createdAt).toLocaleString()}</td>
                  <td>
                    <span className={`withdrawal-status ${w.status}`}>{getWithdrawalStatusLabel(w.status)}</span>
                  </td>
                  <td>
                    {w.status === 'pending' ? (
                      <Annotate id="withdrawal-management.review" inline>
                      <>
                        <button className="admin-table-link" onClick={() => handleProcess(w.id, 'paid')}>确认打款</button>
                        <button className="admin-table-link danger" onClick={() => handleProcess(w.id, 'rejected')}>拒绝</button>
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

function mapMockWithdrawalRecord(w: MockWithdrawalRecord): Withdrawal {
  return {
    id: w.id,
    partnerId: w.userId,
    partnerName: w.partnerName || w.userId,
    amount: w.amount,
    status: w.status as Withdrawal['status'],
    createdAt: w.appliedAt,
    processedAt: w.paidAt,
  };
}
