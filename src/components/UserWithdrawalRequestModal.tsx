import Modal from './ui/Modal';
import UserWithdrawalAccountFields from './UserWithdrawalAccountFields';
import './UserWithdrawalRequestModal.css';

interface Props {
  open: boolean;
  balance: number;
  amount: string;
  phone: string;
  submitting: boolean;
  onAmountChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function UserWithdrawalRequestModal({
  open, balance, amount, phone, submitting,
  onAmountChange, onClose, onSubmit,
}: Props) {
  return (
    <Modal
      open={open}
      title="申请提现"
      onClose={submitting ? () => {} : onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline" disabled={submitting} onClick={onClose}>取消</button>
          <button type="button" className="btn btn-primary" disabled={submitting} onClick={onSubmit}>
            {submitting ? '提交中…' : '确认申请'}
          </button>
        </>
      }
    >
      <div className="user-withdrawal-request-balance">可提现余额 <strong>¥{balance.toFixed(2)}</strong></div>
      <label className="user-withdrawal-request-amount">
        提现金额
        <input type="number" min="0.01" step="0.01" placeholder="请输入提现金额" value={amount} onChange={(event) => onAmountChange(event.target.value)} />
      </label>
      <UserWithdrawalAccountFields phone={phone} />
    </Modal>
  );
}
