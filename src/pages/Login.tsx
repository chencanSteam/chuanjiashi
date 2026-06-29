import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useVersion } from '../hooks/useVersion';
import './Login.css';

const DEMO_PHONE = '13800138000';

function hasArchives(): boolean {
  try {
    const raw = localStorage.getItem('cj_archives');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

function ensureDemoArchive() {
  if (hasArchives()) return;
  const defaultArchive = {
    id: 'default',
    name: '张明远',
    gender: '男' as const,
    birthYear: '1958',
    origin: '江苏省苏州市',
    occupation: '企业家 / 高级工程师',
  };
  localStorage.setItem('cj_archives', JSON.stringify([defaultArchive]));
  localStorage.setItem('cj_current_archive_id', 'default');
}

function redirectAfterAuth(navigate: ReturnType<typeof useNavigate>, isRegister: boolean) {
  if (isRegister || !hasArchives()) {
    navigate('/onboarding', { replace: true });
  } else {
    navigate('/', { replace: true });
  }
}

export default function Login() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { login, isAuthenticated } = useAuth();
  const { appVersion, setAppVersion } = useVersion();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [countdown, setCountdown] = useState(0);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      redirectAfterAuth(navigate, false);
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendCode = () => {
    if (!phone.trim()) {
      addToast('请输入手机号', 'error');
      return;
    }
    setCountdown(60);
    addToast(`验证码已发送至 ${phone}`, 'success');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && !name.trim()) {
      addToast('请输入称呼', 'error');
      return;
    }
    const ok = login(phone, code, { isRegister: mode === 'register', name: name.trim() || undefined });
    if (!ok) {
      addToast('手机号或验证码不正确', 'error');
      return;
    }
    hasRedirected.current = true;
    addToast(mode === 'register' ? '注册成功' : '登录成功', 'success');
    redirectAfterAuth(navigate, mode === 'register');
  };

  const demoLogin = () => {
    login(DEMO_PHONE, '123456', { name: '体验用户' });
    ensureDemoArchive();
    addToast('已进入体验模式', 'success');
    navigate('/onboarding?demo=1', { replace: true });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">传</div>
          <div>
            <h1 className="login-title">传家世</h1>
            <p className="login-subtitle">AI 数字人生与家风传承平台</p>
          </div>
        </div>

        <div className="version-selector">
          <p className="version-selector-title">选择体验版本</p>
          <div className="version-options">
            <button
              type="button"
              className={`version-option ${appVersion === 'mvp' ? 'active' : ''}`}
              onClick={() => setAppVersion('mvp')}
            >
              <span className="version-option-name">MVP 版本</span>
              <span className="version-option-desc">核心闭环：AI 采访 → 传记生成 → 人生档案</span>
            </button>
            <button
              type="button"
              className={`version-option ${appVersion === 'full' ? 'active' : ''}`}
              onClick={() => setAppVersion('full')}
            >
              <span className="version-option-name">完整版本</span>
              <span className="version-option-desc">全量体验：家庭、家族、家风、数字生命</span>
            </button>
          </div>
        </div>

        <div className="login-tabs">
          <button className={`login-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
            登录
          </button>
          <button className={`login-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>
            注册
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="login-field">
              <User size={16} />
              <input
                type="text"
                placeholder="您的称呼"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
              />
            </div>
          )}
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
            <button type="button" className="btn btn-outline btn-sm code-btn" onClick={sendCode} disabled={countdown > 0}>
              {countdown > 0 ? `${countdown}s` : '获取验证码'}
            </button>
          </div>

          <button type="submit" className="btn btn-primary login-submit">
            {mode === 'register' ? '注册并登录' : '登录'} <ArrowRight size={16} />
          </button>
        </form>

        <div className="login-divider">或</div>

        <button className="btn btn-outline login-demo" onClick={demoLogin}>
          一键体验（已有演示数据）
        </button>

        <p className="login-hint">原型演示：任意 6 位验证码均可通过</p>
      </div>
    </div>
  );
}
