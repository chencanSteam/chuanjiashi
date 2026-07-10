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
import { Search, Users, TrendingUp, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { commissionApi } from '../api/commission';
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

  const invites = useMemo(() => {
    const fromUserIds = new Set(rewards.map((r) => r.fromUserId).filter(Boolean));
    return Array.from(fromUserIds).map((userId, idx) => ({
      id: `invite_${idx}`,
      inviterUserId: '',
      inviteeUserId: userId,
      createdAt: new Date().toISOString(),
    }));
  }, [rewards]);

  const stats = useMemo(() => {
    return {
      totalReward: rewards.reduce((sum, r) => sum + r.reward, 0),
      totalWithdrawn: withdrawals.filter((w) => w.status === 'paid').reduce((sum, w) => sum + w.amount, 0),
      pendingWithdrawal: withdrawals.filter((w) => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0),
      inviteCount: invites.length,
    };
  }, [rewards, withdrawals, invites]);

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

      <div className="user-invite-stats">
        <div className="card user-invite-stat">
          <TrendingUp size={20} color="#1B5E4B" />
          <div>
            <div className="user-invite-stat-value">¥{stats.totalReward.toFixed(2)}</div>
            <div className="user-invite-stat-label">累计奖励</div>
          </div>
        </div>
        <div className="card user-invite-stat">
          <CreditCard size={20} color="#2563eb" />
          <div>
            <div className="user-invite-stat-value">¥{stats.totalWithdrawn.toFixed(2)}</div>
            <div className="user-invite-stat-label">已提现</div>
          </div>
        </div>
        <div className="card user-invite-stat">
          <Clock size={20} color="#d97706" />
          <div>
            <div className="user-invite-stat-value">¥{stats.pendingWithdrawal.toFixed(2)}</div>
            <div className="user-invite-stat-label">待审核提现</div>
          </div>
        </div>
        <div className="card user-invite-stat">
          <Users size={20} color="#7c3aed" />
          <div>
            <div className="user-invite-stat-value">{stats.inviteCount}</div>
            <div className="user-invite-stat-label">邀请关系数</div>
          </div>
        </div>
      </div>

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
            <div className="user-invite-empty">暂无奖励流水</div>
          ) : (
            <div className="user-invite-table">
              <div className="user-invite-row user-invite-header-row">
                <div className="user-invite-cell">邀请人</div>
                <div className="user-invite-cell">被邀请人</div>
                <div className="user-invite-cell">订单号</div>
                <div className="user-invite-cell">订单金额</div>
                <div className="user-invite-cell">奖励</div>
                <div className="user-invite-cell">时间</div>
              </div>
              {filteredRewards.map((r) => (
                <div className="user-invite-row" key={r.id}>
                  <div className="user-invite-cell">{r.userId}</div>
                  <div className="user-invite-cell">{r.fromUserId}</div>
                  <div className="user-invite-cell">{r.orderId}</div>
                  <div className="user-invite-cell">¥{r.amount.toFixed(2)}</div>
                  <div className="user-invite-cell user-invite-reward">¥{r.reward.toFixed(2)}</div>
                  <div className="user-invite-cell">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><h3 className="card-title">用户提现审核</h3></div>
        <div className="card-body user-invite-body">
          {withdrawals.length === 0 ? (
            <div className="user-invite-empty">暂无提现申请</div>
          ) : (
            <div className="user-invite-list">
              {withdrawals.map((w) => (
                <div className="user-invite-withdrawal" key={w.id}>
                  <div className="user-invite-withdrawal-info">
                    <div className="user-invite-withdrawal-name">{w.userName}</div>
                    <div className="user-invite-withdrawal-amount">¥{w.amount.toFixed(2)}</div>
                    <div className="user-invite-withdrawal-time">{new Date(w.createdAt).toLocaleString()}</div>
                  </div>
                  <div className={`user-invite-withdrawal-status ${w.status}`}>
                    {w.status === 'pending' ? '待审核' : w.status === 'paid' ? '已打款' : w.status === 'approved' ? '已通过' : '已拒绝'}
                  </div>
                  {w.status === 'pending' && (
                    <div className="user-invite-withdrawal-actions">
                      <button className="btn btn-primary" onClick={() => handleWithdraw(w.id, 'paid')}><CheckCircle size={14} /> 打款</button>
                      <button className="btn btn-outline" onClick={() => handleWithdraw(w.id, 'rejected')}><XCircle size={14} /> 拒绝</button>
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
