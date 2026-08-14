import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Annotate from '../components/annotation/Annotate';
import './Login.css';

// 注册页：仅支持手机号 + 短信验证码注册
export default function Register() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // 发送验证码（演示环境：直接通过提示展示验证码）
  const handleSendCode = () => {
    if (!/^1\d{10}$/.test(phone.trim())) {
      addToast('请输入正确的手机号', 'error');
      return;
    }
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(newCode);
    setCountdown(60);
    addToast(`验证码已发送（演示环境：${newCode}）`, 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      addToast('请先阅读并勾选同意《用户协议》和《隐私协议》', 'error');
      return;
    }
    if (!/^1\d{10}$/.test(phone.trim())) {
      addToast('请输入正确的手机号', 'error');
      return;
    }
    if (!sentCode) {
      addToast('请先获取验证码', 'error');
      return;
    }
    if (code.trim() !== sentCode) {
      addToast('验证码错误，请重新输入', 'error');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    const { success, error } = await login(phone.trim(), '123456', { isRegister: true });
    setSubmitting(false);
    if (!success) {
      addToast(error || '注册失败', 'error');
      return;
    }
    addToast('注册成功，欢迎使用传家世', 'success');
    navigate('/onboarding', { replace: true });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">传</div>
          <div>
            <h1 className="login-title">注册账号</h1>
            <p className="login-subtitle">手机号 + 短信验证码即可注册</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <Phone size={16} />
            <input
              type="text"
              placeholder="手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="login-field login-code">
            <Lock size={16} />
            <input
              type="text"
              placeholder="验证码"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Annotate id="register.send-code" inline>
            <button type="button" className="btn btn-outline code-btn" disabled={countdown > 0} onClick={handleSendCode}>
              {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
            </button>
            </Annotate>
          </div>

          <Annotate id="register.agreement">
          <label className="login-agreement">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>我已阅读并同意《用户协议》和《隐私协议》</span>
          </label>
          </Annotate>

          <Annotate id="register.submit">
          <button type="submit" className="btn btn-primary login-submit" disabled={submitting}>
            {submitting ? '注册中…' : '注册'} <ArrowRight size={16} />
          </button>
          </Annotate>
        </form>

        <Annotate id="register.back">
        <button type="button" className="btn btn-ghost login-back" onClick={() => navigate('/login')}>
          <ArrowLeft size={14} /> 返回登录
        </button>
        </Annotate>
      </div>
    </div>
  );
}
