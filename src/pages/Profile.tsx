import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  ShieldCheck,
  ChevronRight,
  MessageCircle,
  Phone,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Annotate from '../components/annotation/Annotate';
import './Profile.css';

interface SecurityInfo {
  realName?: string;
  idCard?: string;
  wechatBound?: boolean;
}

function loadSecurity(phone?: string): SecurityInfo {
  if (!phone) return {};
  try {
    const raw = localStorage.getItem(`cj_security_${phone}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSecurity(phone: string, info: SecurityInfo) {
  try {
    localStorage.setItem(`cj_security_${phone}`, JSON.stringify(info));
  } catch {
    // ignore
  }
}

function maskIdCard(id: string): string {
  if (id.length < 8) return id;
  return `${id.slice(0, 4)}**********${id.slice(-4)}`;
}

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const displayName = user?.name || user?.phone || '用户';

  const [security, setSecurity] = useState<SecurityInfo>(() => loadSecurity(user?.phone));

  useEffect(() => {
    setSecurity(loadSecurity(user?.phone));
  }, [user?.phone]);

  const persist = (next: SecurityInfo) => {
    if (!user?.phone) return;
    setSecurity(next);
    saveSecurity(user.phone, next);
  };

  // 实名认证
  const [showRealname, setShowRealname] = useState(false);
  const [realnameForm, setRealnameForm] = useState({ name: '', idCard: '' });

  const submitRealname = () => {
    const name = realnameForm.name.trim();
    const idCard = realnameForm.idCard.trim();
    if (!name) {
      addToast('请输入真实姓名', 'error');
      return;
    }
    if (!/^\d{17}[\dXx]$/.test(idCard)) {
      addToast('请输入 18 位身份证号', 'error');
      return;
    }
    persist({ ...security, realName: name, idCard });
    // 账号姓名优先级：实名姓名 > 昵称
    updateUser({ name });
    setShowRealname(false);
    setRealnameForm({ name: '', idCard: '' });
    addToast('实名认证成功', 'success');
  };

  // 绑定微信
  const toggleWechat = () => {
    if (security.wechatBound) {
      persist({ ...security, wechatBound: false });
      addToast('已解绑微信', 'info');
    } else {
      persist({ ...security, wechatBound: true });
      addToast('微信绑定成功', 'success');
    }
  };

  // 绑定/更换手机号
  const [showPhone, setShowPhone] = useState(false);
  const [phoneForm, setPhoneForm] = useState({ phone: '', code: '' });
  const [phoneSentCode, setPhoneSentCode] = useState('');
  const [phoneCountdown, setPhoneCountdown] = useState(0);

  useEffect(() => {
    if (phoneCountdown <= 0) return;
    const timer = setInterval(() => setPhoneCountdown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [phoneCountdown]);

  const sendPhoneCode = () => {
    if (!/^1\d{10}$/.test(phoneForm.phone.trim())) {
      addToast('请输入正确的手机号', 'error');
      return;
    }
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setPhoneSentCode(newCode);
    setPhoneCountdown(60);
    addToast(`验证码已发送（演示环境：${newCode}）`, 'success');
  };

  const submitPhone = () => {
    const newPhone = phoneForm.phone.trim();
    if (!phoneSentCode) {
      addToast('请先获取验证码', 'error');
      return;
    }
    if (phoneForm.code.trim() !== phoneSentCode) {
      addToast('验证码错误', 'error');
      return;
    }
    if (user?.phone) {
      // 安全信息迁移到新手机号
      saveSecurity(newPhone, security);
      localStorage.removeItem(`cj_security_${user.phone}`);
    }
    updateUser({ phone: newPhone });
    setShowPhone(false);
    setPhoneForm({ phone: '', code: '' });
    setPhoneSentCode('');
    addToast('手机号绑定成功', 'success');
  };

  // 注销账户：二次确认后删除账号记录并退出登录（演示环境清除本地数据）
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const handleDeleteAccount = async () => {
    if (user?.phone) {
      try {
        const raw = localStorage.getItem('cj_mock_users');
        const users = raw ? JSON.parse(raw) as Array<{ phone?: string }> : [];
        localStorage.setItem('cj_mock_users', JSON.stringify(users.filter((u) => u.phone !== user.phone)));
        const registered = localStorage.getItem('cj_registered_users');
        const registeredList = registered ? JSON.parse(registered) as Array<{ phone?: string }> : [];
        localStorage.setItem('cj_registered_users', JSON.stringify(registeredList.filter((u) => u.phone !== user.phone)));
        localStorage.removeItem(`cj_security_${user.phone}`);
      } catch {
        // ignore
      }
    }
    await logout();
    setShowDeleteAccount(false);
    addToast('账户已注销', 'info');
    navigate('/login', { replace: true });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="profile-page">
      <Annotate id="profile.hero">
      <div className="profile-hero card">
        <div className="profile-hero-main">
          <Avatar name={displayName} size={72} />
          <div className="profile-hero-info">
            <div className="profile-name">
              {displayName}
              <span className={`profile-realname-badge ${security.realName ? 'verified' : ''}`}>
                <ShieldCheck size={12} /> {security.realName ? '已实名' : '未实名'}
              </span>
            </div>
            <div className="profile-phone">{user?.phone}</div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/settings/account')}>
              完善资料
            </button>
          </div>
        </div>
      </div>
      </Annotate>

      <div className="card profile-menu-card">
        <div className="profile-section-title">账号与安全</div>
        <Annotate id="profile.realname">
        <div className="profile-menu-item" onClick={() => !security.realName && setShowRealname(true)}>
          <div className="profile-menu-icon"><ShieldCheck size={18} /></div>
          <div className="profile-menu-info">
            <div className="profile-menu-label">实名认证</div>
            <div className="profile-menu-desc">
              {security.realName ? `${security.realName} · ${maskIdCard(security.idCard || '')}` : '认证后可作为账号姓名展示'}
            </div>
          </div>
          {security.realName ? (
            <span className="profile-bind-status done">已认证</span>
          ) : (
            <span className="profile-bind-status">去实名 <ChevronRight size={14} /></span>
          )}
        </div>
        </Annotate>
        <Annotate id="profile.wechat">
        <div className="profile-menu-item" onClick={toggleWechat}>
          <div className="profile-menu-icon"><MessageCircle size={18} /></div>
          <div className="profile-menu-info">
            <div className="profile-menu-label">绑定微信</div>
            <div className="profile-menu-desc">{security.wechatBound ? '已绑定，可使用微信快捷登录' : '绑定后可使用微信快捷登录'}</div>
          </div>
          <span className={`profile-bind-status ${security.wechatBound ? 'done' : ''}`}>
            {security.wechatBound ? '已绑定' : '去绑定'} <ChevronRight size={14} />
          </span>
        </div>
        </Annotate>
        <Annotate id="profile.phone-change">
        <div className="profile-menu-item" onClick={() => setShowPhone(true)}>
          <div className="profile-menu-icon"><Phone size={18} /></div>
          <div className="profile-menu-info">
            <div className="profile-menu-label">绑定手机号</div>
            <div className="profile-menu-desc">{user?.phone ? `当前手机号 ${user.phone}` : '绑定后可用于登录'}</div>
          </div>
          <span className="profile-bind-status">更换 <ChevronRight size={14} /></span>
        </div>
        </Annotate>
      </div>

      <Annotate id="profile.logout">
      <button className="btn btn-outline profile-logout" onClick={handleLogout}>
        <LogOut size={14} /> 退出登录
      </button>
      </Annotate>

      <Annotate id="profile.delete-account">
      <button className="btn profile-delete-account" onClick={() => setShowDeleteAccount(true)}>
        注销账户
      </button>
      </Annotate>

      <Modal
        open={showRealname}
        title="实名认证"
        onClose={() => setShowRealname(false)}
        footer={
          <div className="import-modal-footer">
            <button className="btn btn-outline" onClick={() => setShowRealname(false)}>取消</button>
            <button className="btn btn-primary" onClick={submitRealname}>提交认证</button>
          </div>
        }
      >
        <div className="profile-form">
          <label>真实姓名</label>
          <input
            type="text"
            placeholder="请输入与身份证一致的姓名"
            value={realnameForm.name}
            onChange={(e) => setRealnameForm((f) => ({ ...f, name: e.target.value }))}
          />
          <label>身份证号</label>
          <input
            type="text"
            placeholder="请输入 18 位身份证号"
            value={realnameForm.idCard}
            onChange={(e) => setRealnameForm((f) => ({ ...f, idCard: e.target.value }))}
          />
        </div>
      </Modal>

      <Modal
        open={showPhone}
        title="更换手机号"
        onClose={() => setShowPhone(false)}
        footer={
          <div className="import-modal-footer">
            <button className="btn btn-outline" onClick={() => setShowPhone(false)}>取消</button>
            <button className="btn btn-primary" onClick={submitPhone}>确认绑定</button>
          </div>
        }
      >
        <div className="profile-form">
          <label>新手机号</label>
          <input
            type="text"
            placeholder="请输入新手机号"
            value={phoneForm.phone}
            onChange={(e) => setPhoneForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <label>验证码</label>
          <div className="profile-code-row">
            <input
              type="text"
              placeholder="请输入验证码"
              value={phoneForm.code}
              onChange={(e) => setPhoneForm((f) => ({ ...f, code: e.target.value }))}
            />
            <button type="button" className="btn btn-outline" disabled={phoneCountdown > 0} onClick={sendPhoneCode}>
              {phoneCountdown > 0 ? `${phoneCountdown}s` : '获取验证码'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showDeleteAccount}
        title="注销账户"
        onClose={() => setShowDeleteAccount(false)}
        footer={
          <div className="import-modal-footer">
            <button className="btn btn-outline" onClick={() => setShowDeleteAccount(false)}>取消</button>
            <button className="btn btn-danger" onClick={handleDeleteAccount}>确认注销</button>
          </div>
        }
      >
        <div className="profile-form">
          <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.8, margin: 0 }}>
            注销后，当前账号及本地的档案、传记、订单等数据将被清除，且无法恢复。确认注销账户「{displayName}」（{user?.phone}）吗？
          </p>
        </div>
      </Modal>
    </div>
  );
}
