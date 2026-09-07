import { useEffect, useMemo, useState } from 'react';

function mapCommissionToUserReward(r: MockCommissionRecord): UserReward {
  return {
    id: r.id,
    userId: r.userId,
    fromUserId: r.fromUserId || '',
    orderId: r.orderId,
    amount: r.amount,
    reward: r.commission,
    status: r.status as UserReward['status'],
    type: 'invite_reward',
    createdAt: r.createdAt,
    settledAt: r.settledAt,
  };
}

function mapWithdrawalToUserWithdrawal(w: MockWithdrawalRecord): UserWithdrawal {
  return {
    id: w.id,
    userId: w.userId,
    userName: w.partnerName || w.userId,
    amount: w.amount,
    status: w.status as UserWithdrawal['status'],
    createdAt: w.appliedAt,
    processedAt: w.paidAt,
  };
}
import { Search } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { commissionApi } from '../api/commission';
import Annotate from '../components/annotation/Annotate';
import type { CommissionRecord as MockCommissionRecord, WithdrawalRecord as MockWithdrawalRecord } from '../mocks/types';
import type { UserReward, UserWithdrawal } from '../data/userInviteData';
import './UserInvites.css';

export default function UserInvites() {
  const { addToast } = useToast();
  const [rewards, setRewards] = useState<UserReward[]>([]);
  const [withdrawals, setWithdrawals] = useState<UserWithdrawal[]>([]);
  const [keyword, setKeyword] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    commissionApi
      .adminList()
      .then((list) => setRewards(list.map(mapCommissionToUserReward)))
      .catch(() => setRewards([]));
    commissionApi
      .adminWithdrawals()
      .then((list) => setWithdrawals(list.map(mapWithdrawalToUserWithdrawal)))
      .catch(() => setWithdrawals([]));
  }, [refresh]);

  const filteredRewards = useMemo(() => {
    if (!keyword) return rewards;
    return rewards.filter(
      (r) =>
        r.userId.includes(keyword) ||
        r.fromUserId.includes(keyword) ||
        r.orderId.includes(keyword)
    );
  }, [rewards, keyword]);

  const handleWithdraw = async (id: string, status: UserWithdrawal['status']) => {
    try {
      await commissionApi.processWithdrawal(id, status as MockWithdrawalRecord['status']);
      setRefresh((v) => v + 1);
      addToast(status === 'paid' ? '已确认打款' : status === 'rejected' ? '已拒绝提现' : '已处理', 'success');
    } catch (err: any) {
      addToast(err.message || '操作失败', 'error');
    }
  };

  return (
    <div className="user-invites-page">
      <header className="page-header">
        <h1 className="page-title">用户邀请奖励</h1>
      </header>

      <Annotate id="user-invites.rewards">
      <div className="card">
        <div className="card-header user-invite-header">
          <h3 className="card-title">奖励流水</h3>
          <div className="user-invite-search">
            <Search size={14} />
            <input type="text" placeholder="搜索用户/被邀请人/订单号" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
        </div>
        <div className="card-body user-invite-body">
          {filteredRewards.length === 0 ? (
            <div className="admin-table-empty">暂无奖励流水</div>
          ) : (
            <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>邀请人</th>
                  <th>被邀请人</th>
                  <th>订单号</th>
                  <th>订单金额</th>
                  <th>奖励</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {filteredRewards.map((r) => (
                  <tr key={r.id}>
                    <td>{r.userId}</td>
                    <td>{r.fromUserId}</td>
                    <td>{r.orderId}</td>
                    <td>¥{r.amount.toFixed(2)}</td>
                    <td className="user-invite-reward">¥{r.reward.toFixed(2)}</td>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
      </Annotate>

      <Annotate id="user-invites.withdrawals">
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><h3 className="card-title">用户提现审核</h3></div>
        <div className="card-body user-invite-body">
          {withdrawals.length === 0 ? (
            <div className="admin-table-empty">暂无提现申请</div>
          ) : (
            <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>用户</th>
                  <th>提现金额</th>
                  <th>申请时间</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td>{w.userName}</td>
                    <td className="user-invite-reward">¥{w.amount.toFixed(2)}</td>
                    <td>{new Date(w.createdAt).toLocaleString()}</td>
                    <td>
                      <span className={`user-invite-withdrawal-status ${w.status}`}>
                        {w.status === 'pending' ? '待审核' : w.status === 'paid' ? '已打款' : w.status === 'approved' ? '已通过' : '已拒绝'}
                      </span>
                    </td>
                    <td>
                      {w.status === 'pending' ? (
                        <>
                          <button className="admin-table-link" onClick={() => handleWithdraw(w.id, 'paid')}>打款</button>
                          <button className="admin-table-link danger" onClick={() => handleWithdraw(w.id, 'rejected')}>拒绝</button>
                        </>
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
      </div>
      </Annotate>
    </div>
  );
}
