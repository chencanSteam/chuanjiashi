import { useEffect, useState } from 'react';
import { MapPin, Users, Wallet, TrendingUp, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { partnerApi } from '../api/partner';
import { commissionApi } from '../api/commission';
import { partnerTypeConfig, getPartnerTypeLabel } from '../data/partnerData';
import type { Partner, PartnerCustomer, CommissionRecord, WithdrawalRecord } from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import './UserPartner.css';

const rewardStatusLabels: Record<string, string> = {
  pending: '结算中',
  settled: '已结算',
  frozen: '冻结中',
  deducted: '已扣除',
};

const withdrawalStatusLabels: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  paid: '已打款',
};

export default function UserPartner() {
  const { addToast } = useToast();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [customers, setCustomers] = useState<PartnerCustomer[]>([]);
  const [summary, setSummary] = useState({ total: 0, settled: 0, pending: 0, frozen: 0, inviteCount: 0 });
  const [rewards, setRewards] = useState<CommissionRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [amount, setAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [customerKeyword, setCustomerKeyword] = useState('');
  const [customerLevel, setCustomerLevel] = useState('all');
  const [customerRegion, setCustomerRegion] = useState('all');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    partnerApi.me().then(setPartner).catch(() => setPartner(null));
    partnerApi.customers().then(setCustomers).catch(() => setCustomers([]));
    commissionApi.summary().then(setSummary).catch(() => {});
    commissionApi.list().then(setRewards).catch(() => setRewards([]));
    commissionApi.withdrawals().then(setWithdrawals).catch(() => setWithdrawals([]));
  }, [refresh]);

  const typeConfig = partner ? partnerTypeConfig[partner.type] : null;
  const rate = partner?.commissionRate || typeConfig?.rate || 0;
  const availableBalance = 0;
  const customerLevels = partner?.regionCode ? [{ value: partner.type, label: partner.type === 'province' ? '省级' : partner.type === 'city' ? '市级' : partner.type === 'district' ? '区县级' : '区域' }] : [];
  const customerRegions = partner?.regionName ? [{ value: partner.regionCode || partner.regionName, label: partner.regionName }] : [];
  const filteredCustomers = customers.filter((customer) => {
    const query = customerKeyword.trim().toLowerCase();
    const matchesKeyword = !query || `${customer.userName || ''} ${customer.userPhone || ''}`.toLowerCase().includes(query);
    const matchesLevel = customerLevel === 'all' || customerLevel === partner?.type;
    const matchesRegion = customerRegion === 'all' || customerRegion === (partner?.regionCode || partner?.regionName);
    return matchesKeyword && matchesLevel && matchesRegion;
  });

  const handleWithdraw = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      addToast('请输入正确的提现金额', 'error');
      return;
    }
    if (value > availableBalance) {
      addToast('提现金额不能超过可提余额', 'error');
      return;
    }
    setWithdrawing(true);
    try {
      await commissionApi.withdraw(value);
      addToast('提现申请已提交，等待平台审核', 'success');
      setAmount('');
      setRefresh((v) => v + 1);
    } catch (err: unknown) {
      addToast(err instanceof Error && err.message ? err.message : '提现申请失败', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="user-partner-page">
      <header className="page-header">
        <h1 className="page-title">合伙人</h1>
      </header>

      <Annotate id="user-partner.profile-card">
      <div className="card user-partner-profile" style={typeConfig ? { borderLeft: `4px solid ${typeConfig.color}` } : undefined}>
        <div className="card-body user-partner-profile-body">
          <div className="user-partner-profile-main">
            <div className="user-partner-type" style={typeConfig ? { color: typeConfig.color } : undefined}>
              {partner ? (partner.regionCode ? '区域合伙人' : getPartnerTypeLabel(partner.type)) : '加载中…'}
            </div>
            <div className="user-partner-rate">分成占比 {(rate * 100).toFixed(0)}%</div>
          </div>
          <div className="user-partner-region">
            <MapPin size={16} />
            <div>
              <div className="user-partner-region-name">{partner?.regionName || '杭州市西湖区'}</div>
              <div className="user-partner-region-label">代理区域</div>
            </div>
          </div>
        </div>
      </div>
      </Annotate>

      <Annotate id="user-partner.region-users">
      <div className="card">
        <div className="card-header user-partner-customers-header">
          <h3 className="card-title"><Users size={16} /> 区域内用户</h3>
          <div className="user-partner-customer-filters">
            <input placeholder="姓名或手机号" value={customerKeyword} onChange={(e) => setCustomerKeyword(e.target.value)} />
            <select value={customerLevel} onChange={(e) => setCustomerLevel(e.target.value)}><option value="all">全部级别</option>{customerLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}</select>
            <select value={customerRegion} onChange={(e) => setCustomerRegion(e.target.value)}><option value="all">全部区域</option>{customerRegions.map((region) => <option key={region.value} value={region.value}>{region.label}</option>)}</select>
          </div>
        </div>
        <div className="card-body">
          {filteredCustomers.length === 0 ? (
            <div className="admin-table-empty">暂无区域内用户</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>用户</th><th>手机号</th><th>绑定方式</th><th>累计消费</th><th>我的分成</th><th>绑定时间</th></tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c) => (
                    <tr key={c.id}>
                      <td>{c.userName || c.userId}</td>
                      <td>{c.userPhone || '-'}</td>
                      <td>{c.bindType === 'invite_code' ? '邀请码' : c.bindType === 'region_auto' ? '区域自动' : '手动绑定'}</td>
                      <td>{c.hasPaid ? `¥${c.totalOrderAmount.toFixed(2)}` : '暂无消费'}</td>
                      <td className="user-partner-commission">
                        {c.hasPaid ? `+¥${(Math.round(c.totalOrderAmount * rate * 100) / 100).toFixed(2)}` : '-'}
                      </td>
                      <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      </Annotate>

      <Annotate id="user-partner.stats">
      <div className="user-partner-stats">
        <div className="card user-partner-stat">
          <TrendingUp size={20} color="#1B5E4B" />
          <div>
            <div className="user-partner-stat-value">¥{summary.total.toFixed(2)}</div>
            <div className="user-partner-stat-label">累计奖励</div>
          </div>
        </div>
        <div className="card user-partner-stat">
          <Wallet size={20} color="#d97706" />
          <div>
            <div className="user-partner-stat-value">¥0.00</div>
            <div className="user-partner-stat-label">可提余额</div>
          </div>
        </div>
      </div>
      </Annotate>

      <Annotate id="user-partner.rewards">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><TrendingUp size={16} /> 奖励明细</h3>
        </div>
        <div className="card-body">
          {rewards.length === 0 ? (
            <div className="admin-table-empty">暂无奖励记录</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>用户名</th><th>订单号</th><th>订单金额</th><th>奖励金额</th><th>状态</th><th>时间</th></tr>
                </thead>
                <tbody>
                  {rewards.map((r) => (
                    <tr key={r.id}>
                      <td>{r.fromUserPhone || r.fromUserId || '-'}</td>
                      <td>{r.orderId}</td>
                      <td>¥{r.amount.toFixed(2)}</td>
                      <td className="user-partner-commission">+¥{r.commission.toFixed(2)}</td>
                      <td>{rewardStatusLabels[r.status] || r.status}</td>
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

      <Annotate id="user-partner.withdraw">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><CreditCard size={16} /> 奖励提现</h3>
        </div>
        <div className="card-body">
          <div className="user-partner-withdraw-input">
            <input
              type="number"
              placeholder="输入提现金额"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleWithdraw} disabled={withdrawing}>
              {withdrawing ? '提交中…' : '提交提现'}
            </button>
          </div>
          {withdrawals.length > 0 && (
            <div className="user-partner-withdrawal-list">
              {withdrawals.map((w) => (
                <div className="user-partner-withdrawal" key={w.id}>
                  <div>
                    <div className="user-partner-withdrawal-amount">¥{w.amount.toFixed(2)}</div>
                    <div className="user-partner-withdrawal-time">{new Date(w.appliedAt).toLocaleString()}</div>
                  </div>
                  <div className={`user-partner-withdrawal-status ${w.status}`}>
                    {w.status === 'pending' && <Clock size={12} />}
                    {(w.status === 'paid' || w.status === 'approved') && <CheckCircle size={12} />}
                    {w.status === 'rejected' && <XCircle size={12} />}
                    {withdrawalStatusLabels[w.status] || w.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </Annotate>
    </div>
  );
}
