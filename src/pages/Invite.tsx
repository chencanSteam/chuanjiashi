import { useEffect, useMemo, useState } from 'react';
import { Share2, Copy, Users, Wallet, TrendingUp, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { commissionApi } from '../api/commission';
import { loadRegisteredUsers, loadUserInvites } from '../data/userInviteData';
import type { CommissionRecord, WithdrawalRecord } from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import './Invite.css';

const rewardStatusLabels: Record<string, string> = {
  pending: '结算中',
  settled: '已结算',
  frozen: '冻结中',
  withdrawn: '已提现',
};

const withdrawalStatusLabels: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  paid: '已打款',
};

const rewardUserNames: Record<string, string> = {
  u_cus_001: '张先生',
  u_cus_002: '李女士',
  u_cus_004: '陈女士',
};

const inviteRules = [
  '每邀请 1 位用户注册并消费，您可获得其订单金额 20% 的邀请奖励。',
  '仅一级邀请关系有效：您直接邀请的用户产生的消费计入奖励，用户再邀请的人不计入您的收益。',
  '奖励结算以订单完成为准：订单完成且无退款后，奖励由「结算中」转为「已结算」，可提现。',
  '违规推广将冻结奖励：包括但不限于刷单、虚假交易、诱导退款等行为，一经发现冻结全部奖励并取消推广资格。',
  '被邀请人需通过您的邀请链接或邀请码完成注册，方可建立有效邀请关系。',
];

function maskPhone(phone: string): string {
  return phone.length === 11 ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : phone;
}

export default function Invite() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [summary, setSummary] = useState({ total: 0, settled: 0, pending: 0, frozen: 0, inviteCount: 0 });
  const [rewards, setRewards] = useState<CommissionRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [amount, setAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [refresh, setRefresh] = useState(0);

  // 我邀请的用户（localStorage 邀请关系，与移动端「我的邀请」一致）
  const invited = useMemo(() => {
    if (!user?.phone) return [];
    const people = loadRegisteredUsers();
    return loadUserInvites()
      .filter((invite) => invite.inviterUserId === user.phone)
      .map((invite) => ({ ...invite, user: people.find((p) => p.phone === invite.inviteeUserId) }));
  }, [user]);

  useEffect(() => {
    commissionApi.summary().then(setSummary).catch(() => {});
    commissionApi.list().then(setRewards).catch(() => setRewards([]));
    commissionApi.withdrawals().then(setWithdrawals).catch(() => setWithdrawals([]));
  }, [refresh]);

  const inviteCode = user?.inviteCode || '—';
  const inviteUrl = `${window.location.origin}${window.location.pathname}#/login?invite=${inviteCode}`;
  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      addToast(`${label}已复制`, 'success');
    } catch {
      addToast('复制失败，请稍后重试', 'error');
    }
  };

  const rewardByInvitee = useMemo(() => {
    const map = new Map<string, number>();
    rewards.forEach((r) => {
      const key = r.fromUserId || '';
      map.set(key, (map.get(key) || 0) + r.commission);
    });
    return map;
  }, [rewards]);

  const handleWithdraw = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      addToast('请输入正确的提现金额', 'error');
      return;
    }
    if (value > summary.settled) {
      addToast('提现金额不能超过可提现余额', 'error');
      return;
    }
    setWithdrawing(true);
    try {
      await commissionApi.withdraw(value);
      addToast('提现申请已提交，等待平台审核', 'success');
      setAmount('');
      setRefresh((v) => v + 1);
    } catch (err) {
      addToast(err instanceof Error ? err.message : '提现申请失败', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="invite-page">
      <header className="page-header">
        <h1 className="page-title">邀请有礼</h1>
        <p className="page-subtitle">邀请家人朋友，一起记录人生故事</p>
      </header>

      <Annotate id="invite.hero">
      <div className="invite-hero">
        <div className="invite-hero-copy">
          <h2>邀请用户注册，TA 消费你得奖励</h2>
          <p>用户通过您的邀请码注册并消费，您可获得订单金额 20% 的邀请奖励</p>
          <div className="invite-hero-code">
            <span>我的邀请码</span>
            <strong>{inviteCode}</strong>
          </div>
          <div className="invite-hero-actions">
            <button className="btn btn-primary" onClick={() => copy(inviteCode, '邀请码')}><Copy size={14} /> 复制邀请码</button>
            <button className="btn invite-hero-outline" onClick={() => copy(inviteUrl, '邀请链接')}><Share2 size={14} /> 复制邀请链接</button>
          </div>
        </div>
      </div>
      </Annotate>

      <Annotate id="invite.stats">
      <div className="invite-stats-row">
        <div className="card invite-stat-card">
          <TrendingUp size={20} color="#2563eb" />
          <div><div className="invite-stat-value">¥{summary.total.toFixed(2)}</div><div className="invite-stat-label">累计奖励</div></div>
        </div>
        <div className="card invite-stat-card">
          <Wallet size={20} color="#1B5E4B" />
          <div><div className="invite-stat-value">¥{summary.settled.toFixed(2)}</div><div className="invite-stat-label">可提现余额</div></div>
        </div>
        <div className="card invite-stat-card">
          <Users size={20} color="#7c3aed" />
          <div><div className="invite-stat-value">{summary.inviteCount}</div><div className="invite-stat-label">已邀请用户</div></div>
        </div>
      </div>
      </Annotate>

      <div className="card">
        <div className="card-header"><h3 className="card-title"><Users size={16} /> 我邀请的用户</h3></div>
        <div className="card-body">
          {invited.length === 0 ? (
            <div className="admin-table-empty">暂未邀请用户，复制邀请码分享给家人朋友吧</div>
          ) : (
            <Annotate id="invite.invited-table">
            <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>用户</th><th>手机号</th><th>注册时间</th><th>贡献奖励</th></tr>
              </thead>
              <tbody>
                {invited.map((item) => (
                  <tr key={item.id}>
                    <td>{item.user?.name || `用户${item.inviteeUserId.slice(-4)}`}</td>
                    <td>{maskPhone(item.inviteeUserId)}</td>
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                    <td>{rewardByInvitee.get(item.inviteeUserId) ? `¥${rewardByInvitee.get(item.inviteeUserId)!.toFixed(2)}` : <span className="admin-table-muted">暂无消费</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            </Annotate>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title"><TrendingUp size={16} /> 奖励明细</h3></div>
        <div className="card-body">
          {rewards.length === 0 ? (
            <div className="admin-table-empty">暂无奖励记录</div>
          ) : (
            <Annotate id="invite.rewards-table">
            <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>用户</th><th>订单号</th><th>订单金额</th><th>奖励金额</th><th>状态</th><th>时间</th></tr>
              </thead>
              <tbody>
                {rewards.map((r) => (
                  <tr key={r.id}>
                    <td>{r.fromUserId ? rewardUserNames[r.fromUserId] || '未知用户' : '未知用户'}</td>
                    <td>{r.orderId}</td>
                    <td>¥{r.amount.toFixed(2)}</td>
                    <td className="invite-reward-amount">+¥{r.commission.toFixed(2)}</td>
                    <td>{rewardStatusLabels[r.status] || r.status}</td>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            </Annotate>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title"><Wallet size={16} /> 奖励提现</h3></div>
        <div className="card-body">
          <Annotate id="invite.withdraw">
          <div className="invite-withdraw-row">
            <span className="invite-withdraw-balance">可提现余额 <strong>¥{summary.settled.toFixed(2)}</strong></span>
            <input type="number" min="0" placeholder="输入提现金额" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button className="btn btn-primary" disabled={withdrawing} onClick={handleWithdraw}>{withdrawing ? '提交中…' : '申请提现'}</button>
          </div>
          </Annotate>
          {withdrawals.length > 0 && (
            <div className="admin-table-wrap" style={{ marginTop: 14 }}>
            <table className="admin-table">
              <thead>
                <tr><th>提现金额</th><th>状态</th><th>申请时间</th><th>处理时间</th></tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td>¥{w.amount.toFixed(2)}</td>
                    <td>{withdrawalStatusLabels[w.status] || w.status}</td>
                    <td>{new Date(w.appliedAt).toLocaleString()}</td>
                    <td>{w.paidAt ? new Date(w.paidAt).toLocaleString() : <span className="admin-table-muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <button className="invite-rules-toggle" onClick={() => setShowRules((v) => !v)}>
            <Info size={14} /> 邀请奖励规则说明
            {showRules ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showRules && (
            <ul className="invite-rules-list">
              {inviteRules.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
