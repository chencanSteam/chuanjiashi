import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Phone, Lock, ArrowRight, User, Briefcase, Shield, PenLine, Smartphone, MessageCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Modal from '../components/ui/Modal';
import './Login.css';

const DEMO_PHONE = '13800138000';
const USER_PHONE = '13800138003';

type AgreementType = 'user' | 'privacy';

const AGREEMENTS: Record<AgreementType, { title: string; paragraphs: string[] }> = {
  user: {
    title: '用户协议',
    paragraphs: [
      '欢迎使用「传家世」AI 数字人生与家风传承平台（以下简称「本平台」）。在您注册、登录或使用本平台服务前，请认真阅读并充分理解本协议的全部内容。您勾选同意或实际使用本平台服务，即视为您已阅读并同意接受本协议的全部约定。',
      '本平台为您提供 AI 智能采访、传记生成、人生档案、数字博物馆、数字陪伴等服务。您承诺上传的文字、图片、音视频等素材为您本人所有或已获得合法授权，不得含有侵犯他人权益或违反法律法规的内容。',
      '您应妥善保管账号信息，因您主动泄露账号或遭受他人攻击导致的损失，本平台不承担直接责任。本平台有权对违规内容采取删除、屏蔽、限制功能等措施。',
      '本协议的订立、执行与解释均适用中华人民共和国法律。如本协议任何条款被认定为无效，不影响其他条款的效力。本平台可能根据业务调整更新本协议，更新后将通过页面公告等方式通知您。',
    ],
  },
  privacy: {
    title: '隐私协议',
    paragraphs: [
      '「传家世」高度重视您的个人信息与隐私保护。本隐私协议说明我们如何收集、使用、存储和保护您的个人信息，以及您享有的相关权利。',
      '我们仅收集实现产品功能所必需的信息，包括：您注册时提供的手机号，以及您主动上传的生平资料、照片、音视频与采访记录等。上述信息仅用于生成传记、数字档案与数字人等您指定的服务。',
      '我们采用加密存储、访问控制等技术手段保护您的信息安全，不会向任何第三方出售您的个人信息。涉及家人共享、公开书架等您主动选择公开的内容除外。',
      '您有权随时查阅、更正、删除您的个人信息，也可注销账号。账号注销后，我们将按照法律法规要求删除或匿名化处理您的个人信息。如对本隐私协议有任何疑问，可通过平台内客服渠道与我们联系。',
    ],
  },
};

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
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const { login, addRole, isAuthenticated } = useAuth();

  const [phone, setPhone] = useState(DEMO_PHONE);
  const [code, setCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [agreement, setAgreement] = useState<AgreementType | null>(null);
  const hasRedirected = useRef(false);

  // 邀请链接（#/login?invite=xxx）携带的邀请码，登录成功后写入 localStorage 供佣金体系使用
  const inviteCode = searchParams.get('invite');
  const saveInviteCode = () => {
    if (!inviteCode) return;
    try {
      localStorage.setItem('cj_invite_code', inviteCode);
    } catch {
      // 忽略存储失败
    }
  };

  useEffect(() => {
    if (isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      saveInviteCode();
      navigate(hasArchives() ? '/home' : '/onboarding', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // 获取验证码倒计时
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

  const enterPortal = async (targetPhone: string, targetPath: string, options?: { addPartnerRole?: boolean; addBiographerRole?: boolean; name?: string }) => {
    const { success, error } = await login(targetPhone, '123456', { name: options?.name });
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
    saveInviteCode();
    addToast('登录成功', 'success');
    navigate(targetPath, { replace: true });
  };

  const checkAgreement = (): boolean => {
    if (agreed) return true;
    addToast('请先阅读并勾选同意《用户协议》和《隐私协议》', 'error');
    return false;
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkAgreement()) return;
    if (!sentCode) {
      addToast('请先获取验证码', 'error');
      return;
    }
    if (code.trim() !== sentCode) {
      addToast('验证码错误，请重新输入', 'error');
      return;
    }
    const { success, error } = await login(phone, '123456');
    if (!success) {
      addToast(error || '手机号或验证码不正确', 'error');
      return;
    }
    hasRedirected.current = true;
    saveInviteCode();
    addToast('登录成功', 'success');
    navigate(hasArchives() ? '/home' : '/onboarding', { replace: true });
  };

  const handleWechatLogin = async () => {
    if (!checkAgreement()) return;
    const { success, error } = await login(USER_PHONE, '123456', { name: '张明远' });
    if (!success) {
      addToast(error || '微信授权失败', 'error');
      return;
    }
    ensureDemoArchive();
    hasRedirected.current = true;
    saveInviteCode();
    addToast('微信授权成功', 'success');
    navigate(hasArchives() ? '/home' : '/onboarding', { replace: true });
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
          <button type="button" className="portal-card" onClick={() => enterPortal(USER_PHONE, '/home', { name: '张明远' })}>
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
          <button type="button" className="portal-card mobile" onClick={() => enterPortal(USER_PHONE, '/m')}>
            <Smartphone size={24} />
            <span className="portal-name">移动端</span>
            <span className="portal-desc">手机 AI 智能采访</span>
          </button>
        </div>

        <div className="login-divider">或</div>

        <label className="login-agreement">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span>
            我已阅读并同意
            <button type="button" className="login-agreement-link" onClick={() => setAgreement('user')}>《用户协议》</button>
            和
            <button type="button" className="login-agreement-link" onClick={() => setAgreement('privacy')}>《隐私协议》</button>
          </span>
        </label>

        {!showManual ? (
          <button type="button" className="btn btn-outline login-demo" onClick={() => setShowManual(true)}>
            手机号登录
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
              <button type="button" className="btn btn-outline code-btn" disabled={countdown > 0} onClick={handleSendCode}>
                {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
              </button>
            </div>
            <button type="submit" className="btn btn-primary login-submit" disabled={!agreed}>
              登录 <ArrowRight size={16} />
            </button>
          </form>
        )}

        <button type="button" className="btn login-wechat" onClick={handleWechatLogin}>
          <MessageCircle size={16} /> 微信授权登录
        </button>

        <p className="login-hint">点击上方入口即可直接进入对应系统</p>
      </div>

      <Modal
        open={agreement !== null}
        title={agreement ? AGREEMENTS[agreement].title : ''}
        onClose={() => setAgreement(null)}
        footer={
          <button
            className="btn btn-primary"
            onClick={() => {
              setAgreed(true);
              setAgreement(null);
            }}
          >
            我已阅读并同意
          </button>
        }
      >
        <div className="agreement-modal-body">
          {agreement && AGREEMENTS[agreement].paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </Modal>
    </div>
  );
}
