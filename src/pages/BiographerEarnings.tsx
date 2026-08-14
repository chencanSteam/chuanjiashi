import { useEffect, useState } from 'react';
import {
  Wallet,
  Clock,
  Percent,
  CircleAlert,
  DollarSign,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import Modal from '../components/ui/Modal';
import { biographerEarningsApi } from '../api/biographerEarnings';
import type { BiographerSettlement, BiographerWithdrawal } from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import './BiographerEarnings.css';

type EarningsTab = 'incomes' | 'withdrawals' | 'penalties';

const tabLabels: Record<EarningsTab, string> = {
  incomes: '订单收入明细',
  withdrawals: '提现记录',
  penalties: '违规扣款记录',
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

  return (
    <div className="biographer-earnings-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">结算提现</h1>
          <p className="page-subtitle">订单收入由平台托管，服务完成后转入可结算金额</p>
        </div>
        <Annotate id="biographer-earnings.withdraw-entry" inline>
        <button className="btn btn-primary" onClick={() => setShowWithdraw(true)}>
          <DollarSign size={14} /> 申请提现
        </button>
        </Annotate>
      </header>

      <Annotate id="biographer-earnings.stats">
      <div className="earnings-stats">
        <div className="card earnings-stat">
          <Clock size={20} color="#d97706" />
          <div>
            <div className="earnings-stat-value">¥{settlement.escrowAmount.toFixed(2)}</div>
            <div className="earnings-stat-label">托管中金额</div>
          </div>
        </div>
        <div className="card earnings-stat">
          <Wallet size={20} color="#1B5E4B" />
          <div>
            <div className="earnings-stat-value">¥{settlement.availableAmount.toFixed(2)}</div>
            <div className="earnings-stat-label">可结算金额</div>
          </div>
        </div>
        <div className="card earnings-stat">
          <Percent size={20} color="#2563eb" />
          <div>
            <div className="earnings-stat-value">{(settlement.commissionRate * 100).toFixed(0)}%</div>
            <div className="earnings-stat-label">平台抽佣比例</div>
          </div>
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
              <div className="earnings-empty">暂无收入明细</div>
            ) : (
              settlement.incomes.map((item) => (
                <div className="earnings-row" key={item.orderNo}>
                  <div className="earnings-row-main">
                    <div className="earnings-row-title">订单 {item.orderNo}</div>
                    <div className="earnings-row-meta">
                      入账时间：{new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="earnings-row-amounts">
                    <span className="earnings-amount income">+¥{item.amount.toFixed(2)}</span>
                    <span className="earnings-commission">平台抽佣 ¥{item.commission.toFixed(2)}</span>
                  </div>
                </div>
              ))
            ))}

          {activeTab === 'withdrawals' &&
            (settlement.withdrawals.length === 0 ? (
              <div className="earnings-empty">暂无提现记录</div>
            ) : (
              settlement.withdrawals.map((w) => (
                <div className="earnings-row" key={w.id}>
                  <div className="earnings-row-main">
                    <div className="earnings-row-title">
                      提现 ¥{w.amount.toFixed(2)}
                      <span className={`earnings-status ${w.status}`}>{withdrawalStatusLabels[w.status]}</span>
                    </div>
                    <div className="earnings-row-meta">
                      申请时间：{new Date(w.appliedAt).toLocaleString()}
                      {w.paidAt && ` · 打款时间：${new Date(w.paidAt).toLocaleString()}`}
                    </div>
                  </div>
                  <div className="earnings-row-amounts">
                    <span className="earnings-amount">-¥{w.amount.toFixed(2)}</span>
                  </div>
                </div>
              ))
            ))}

          {activeTab === 'penalties' &&
            (settlement.penalties.length === 0 ? (
              <div className="earnings-empty earnings-empty-safe">
                <CircleAlert size={16} /> 暂无违规扣款记录，请继续保持良好服务
              </div>
            ) : (
              settlement.penalties.map((p) => (
                <div className="earnings-row" key={p.id}>
                  <div className="earnings-row-main">
                    <div className="earnings-row-title">{p.reason}</div>
                    <div className="earnings-row-meta">
                      扣款时间：{new Date(p.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="earnings-row-amounts">
                    <span className="earnings-amount penalty">-¥{p.amount.toFixed(2)}</span>
                  </div>
                </div>
              ))
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
          <p className="earnings-withdraw-tip">
            当前可结算金额 <strong>¥{settlement.availableAmount.toFixed(2)}</strong>，提现申请将在 1-3 个工作日内审核打款。
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
