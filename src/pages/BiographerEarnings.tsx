import BiographerServiceOrders from '../components/BiographerServiceOrders';
import { useEffect, useState } from 'react';
import {
  DollarSign,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import Modal from '../components/ui/Modal';
import { biographerEarningsApi } from '../api/biographerEarnings';
import { getPlatformFeeRate } from '../data/adminDictionary';
import type { BiographerSettlement } from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import './BiographerEarnings.css';

export default function BiographerEarnings() {
  const { addToast } = useToast();
  const [settlement, setSettlement] = useState<BiographerSettlement | null>(null);
  const [loading, setLoading] = useState(true);
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
  const platformFeePercent = (getPlatformFeeRate() * 100).toFixed(2).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');

  return (
    <div className="biographer-earnings-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">结算提现</h1>
          <p className="page-subtitle">查看服务订单阶段结算与可提现金额</p>
        </div>
      </header>

      <BiographerServiceOrders role="biographer" earningsOnly />

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
          <div className="earnings-overview-sub">当前平台服务费率 {platformFeePercent}%，仅用于新订单</div>
        </div>
      </div>
      </Annotate>

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
            当前可提现 <strong>¥{settlement.availableAmount.toFixed(2)}</strong>。单笔最低 ¥100，申请提交后平台 1-3 个工作日内审核打款；提现不再重复收取平台服务费。
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
