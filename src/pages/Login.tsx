import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, ArrowRight, User, Briefcase, Shield, PenLine } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import './Login.css';

const DEMO_PHONE = '13800138000';
const USER_PHONE = '13800138003';

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

export default function Login() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { login, addRole, isAuthenticated } = useAuth();

  const [phone, setPhone] = useState(DEMO_PHONE);
  const [code, setCode] = useState('123456');
  const [showManual, setShowManual] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate(hasArchives() ? '/' : '/onboarding', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const enterPortal = async (targetPhone: string, targetPath: string, options?: { addPartnerRole?: boolean; addBiographerRole?: boolean }) => {
    const { success, error } = await login(targetPhone, '123456');
    if (!success) {
      addToast(error || '登录失败', 'error');
      return;
    }
    if (options?.addPartnerRole) {
      addRole('partner');
    }
    if (options?.addBiographerRole) {
      addRole('biographer');
    }
    ensureDemoArchive();
    hasRedirected.current = true;
    addToast('登录成功', 'success');
    navigate(targetPath, { replace: true });
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { success, error } = await login(phone, code);
    if (!success) {
      addToast(error || '手机号或验证码不正确', 'error');
      return;
    }
    hasRedirected.current = true;
    addToast('登录成功', 'success');
    navigate(hasArchives() ? '/' : '/onboarding', { replace: true });
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

        <div className="portal-grid">
          <button type="button" className="portal-card" onClick={() => enterPortal(USER_PHONE, '/')}>
            <User size={24} />
            <span className="portal-name">用户端</span>
            <span className="portal-desc">体验 AI 采访、传记、人生档案</span>
          </button>
          <button type="button" className="portal-card partner" onClick={() => enterPortal(USER_PHONE, '/partner', { addPartnerRole: true })}>
            <Briefcase size={24} />
            <span className="portal-name">合伙人中心</span>
            <span className="portal-desc">客户、收益、提现管理</span>
          </button>
          <button type="button" className="portal-card admin" onClick={() => enterPortal(DEMO_PHONE, '/admin')}>
            <Shield size={24} />
            <span className="portal-name">管理后台</span>
            <span className="portal-desc">合伙人、传记师、分润审核</span>
          </button>
          <button type="button" className="portal-card biographer" onClick={() => enterPortal(DEMO_PHONE, '/biographer', { addBiographerRole: true })}>
            <PenLine size={24} />
            <span className="portal-name">传记师端</span>
            <span className="portal-desc">订单管理、传记服务</span>
          </button>
        </div>

        <div className="login-divider">或</div>

        {!showManual ? (
          <button type="button" className="btn btn-outline login-demo" onClick={() => setShowManual(true)}>
            手动登录
          </button>
        ) : (
          <form className="login-form" onSubmit={handleManualSubmit}>
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
            </div>
            <button type="submit" className="btn btn-primary login-submit">
              登录 <ArrowRight size={16} />
            </button>
          </form>
        )}

        <p className="login-hint">点击上方入口即可直接进入对应系统</p>
      </div>
    </div>
  );
}
