import './UserWithdrawalAccountFields.css';

export default function UserWithdrawalAccountFields({ phone }: { phone: string }) {
  return (
    <div className="user-withdrawal-account-fields">
      <span>收款账户</span>
      <strong>微信零钱（当前登录账号）</strong>
      <small>{phone}</small>
    </div>
  );
}
