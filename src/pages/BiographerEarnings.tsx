import { useEffect, useState } from 'react';
import {
  DollarSign,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import Modal from '../components/ui/Modal';
import { biographerEarningsApi } from '../api/biographerEarnings';
import type { BiographerSettlement, BiographerWithdrawal } from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import './BiographerEarnings.css';

type EarningsTab = 'incomes' | 'withdrawals';

const tabLabels: Record<EarningsTab, string> = {
  incomes: '订单收入明细',
  withdrawals: '提现记录',
};

const withdrawalStatusLabels: Record<BiographerWithdrawal['status'], string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  paid: '已打款',
};

export default function BiographerEarnings() {
  const { addToast } = useToast();
  const [settlement, setSettlement] = useState<BiographerSettlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<EarningsTab>('incomes');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    biographerEarningsApi
      .overview()
      .then(setSettlement)
      .catch(() => setSettlement(null))
      .finally(() => setLoading(false));
  }, []);

  const handleWithdraw = async () => {
    if (!settlement) return;
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      addToast('请输入正确的提现金额', 'error');
      return;
    }
    if (amount < 100) {
      addToast('单笔提现金额不能低于 ¥100', 'error');
      return;
    }
    if (amount > settlement.availableAmount) {
      addToast('提现金额不能超过可结算金额', 'error');
      return;
    }
    setWithdrawing(true);
    try {
      const updated = await biographerEarningsApi.withdraw(amount);
      setSettlement(updated);
      setShowWithdraw(false);
      setWithdrawAmount('');
      setActiveTab('withdrawals');
      addToast('提现申请已提交，等待平台审核', 'success');
    } catch (err: unknown) {
      addToast(err instanceof Error && err.message ? err.message : '提现申请失败', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="biographer-earnings-page">
        <div className="earnings-loading">加载中…</div>
      </div>
    );
  }

  if (!settlement) {
    return (
      <div className="biographer-earnings-page">
        <div className="earnings-loading">暂无结算数据</div>
      </div>
    );
  }

  const totalIncome = settlement.incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalWithdrawn = settlement.withdrawals
    .filter((w) => w.status === 'paid')
    .reduce((sum, w) => sum + w.amount, 0);
  const fmtMoney = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="biographer-earnings-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">结算提现</h1>
          <p className="page-subtitle">订单收入由平台托管，服务完成后转入可提现金额</p>
        </div>
      </header>

      <Annotate id="biographer-earnings.overview">
      <div className="card earnings-overview-card">
        <div className="earnings-overview-item earnings-overview-main">
          <div className="earnings-overview-label">可提现金额（元）</div>
          <div className="earnings-overview-value primary">¥{fmtMoney(settlement.availableAmount)}</div>
          <Annotate id="biographer-earnings.withdraw-entry" inline>
          <button className="btn btn-primary btn-sm" onClick={() => setShowWithdraw(true)}>
            <DollarSign size={14} /> 申请提现
          </button>
          </Annotate>
        </div>
        <div className="earnings-overview-item">
          <div className="earnings-overview-label">托管中金额</div>
          <div className="earnings-overview-value">¥{fmtMoney(settlement.escrowAmount)}</div>
          <div className="earnings-overview-sub">服务完成确认后转入可提现</div>
        </div>
        <div className="earnings-overview-item">
          <div className="earnings-overview-label">累计收入</div>
          <div className="earnings-overview-value">¥{fmtMoney(totalIncome)}</div>
          <div className="earnings-overview-sub">共 {settlement.incomes.length} 单</div>
        </div>
        <div className="earnings-overview-item">
          <div className="earnings-overview-label">累计已提现</div>
          <div className="earnings-overview-value">¥{fmtMoney(totalWithdrawn)}</div>
          <div className="earnings-overview-sub">平台服务费率 {(settlement.commissionRate * 100).toFixed(0)}%，入账时已扣除</div>
        </div>
      </div>
      </Annotate>

      <div className="card earnings-card">
        <Annotate id="biographer-earnings.tabs" inline>
        <div className="earnings-tabs">
          {(Object.keys(tabLabels) as EarningsTab[]).map((t) => (
            <button
              key={t}
              className={`earnings-tab ${activeTab === t ? 'active' : ''}`}
              onClick={() => setActiveTab(t)}
              type="button"
            >
              {tabLabels[t]}
            </button>
          ))}
        </div>
        </Annotate>

        <div className="earnings-list">
          {activeTab === 'incomes' &&
            (settlement.incomes.length === 0 ? (
              <div className="admin-table-empty">暂无收入明细</div>
            ) : (
              <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>订单号</th><th>入账金额</th><th>平台抽佣</th><th>入账时间</th></tr>
                </thead>
                <tbody>
                  {settlement.incomes.map((item) => (
                    <tr key={item.orderNo}>
                      <td>{item.orderNo}</td>
                      <td><span className="earnings-amount income">+¥{item.amount.toFixed(2)}</span></td>
                      <td><span className="earnings-commission">¥{item.commission.toFixed(2)}</span></td>
                      <td>{new Date(item.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            ))}

          {activeTab === 'withdrawals' &&
            (settlement.withdrawals.length === 0 ? (
              <div className="admin-table-empty">暂无提现记录</div>
            ) : (
              <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>提现金额</th><th>状态</th><th>申请时间</th><th>打款时间</th></tr>
                </thead>
                <tbody>
                  {settlement.withdrawals.map((w) => (
                    <tr key={w.id}>
                      <td><span className="earnings-amount">-¥{w.amount.toFixed(2)}</span></td>
                      <td><span className={`earnings-status ${w.status}`}>{withdrawalStatusLabels[w.status]}</span></td>
                      <td>{new Date(w.appliedAt).toLocaleString()}</td>
                      <td>{w.paidAt ? new Date(w.paidAt).toLocaleString() : <span className="admin-table-muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            ))}

        </div>
      </div>

      <Annotate id="biographer-earnings.withdraw-modal">
      <Modal
        open={showWithdraw}
        title="申请提现"
        onClose={() => setShowWithdraw(false)}
        footer={
          <div className="earnings-modal-footer">
            <button className="btn btn-outline" onClick={() => setShowWithdraw(false)}>取消</button>
            <button className="btn btn-primary" onClick={handleWithdraw} disabled={withdrawing}>
              {withdrawing ? '提交中…' : '确认提现'}
            </button>
          </div>
        }
      >
        <div className="earnings-withdraw-form">
          <div className="earnings-withdraw-account">
            <span>收款账户</span>
            <strong>微信零钱（当前登录账号）</strong>
          </div>
          <p className="earnings-withdraw-tip">
            当前可提现 <strong>¥{settlement.availableAmount.toFixed(2)}</strong>。单笔最低 ¥100，申请提交后平台 1-3 个工作日内审核打款；平台服务费（{(settlement.commissionRate * 100).toFixed(0)}%）已在入账时扣除，提现不再重复收费。
          </p>
          <div className="earnings-withdraw-row">
            <label>提现金额（元）</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder={`不超过 ¥${settlement.availableAmount.toFixed(2)}`}
            />
          </div>
          <button
            type="button"
            className="earnings-withdraw-all"
            onClick={() => setWithdrawAmount(settlement.availableAmount.toFixed(2))}
          >
            全部提现
          </button>
        </div>
      </Modal>
      </Annotate>
    </div>
  );
}
