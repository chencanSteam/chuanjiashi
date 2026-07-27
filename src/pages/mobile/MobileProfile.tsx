import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Shield, LogOut, ChevronRight, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/ui/Modal';
import './MobileProfile.css';

export default function MobileProfile() {
  const { user, logout, updateUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [securityOpen, setSecurityOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [nickname, setNickname] = useState(user?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const openProfile = () => {
    setNickname(user?.name || '');
    setProfileOpen(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSaveProfile = () => {
    const name = nickname.trim();
    if (!name) {
      addToast('昵称不能为空', 'error');
      return;
    }
    updateUser({ name });
    setProfileOpen(false);
    addToast('个人资料已保存', 'success');
  };

  const handleChangePassword = () => {
    if (newPassword.length < 6) {
      addToast('新密码长度不能少于 6 位', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('两次输入的新密码不一致', 'error');
      return;
    }
    setSecurityOpen(false);
    setNewPassword('');
    setConfirmPassword('');
    addToast('密码修改成功', 'success');
  };

  return (
    <div className="mobile-profile">
      <section className="mobile-profile-header">
        <div className="profile-avatar large">
          {(user?.name || user?.phone || '用').charAt(0)}
        </div>
        <h2 className="profile-name">{user?.name || `用户${user?.phone?.slice(-4) || ''}`}</h2>
        <div className="profile-phone">
          <Phone size={14} />
          <span>{user?.phone || '未绑定手机号'}</span>
        </div>
      </section>

      <section className="mobile-profile-section">
        <div className="mobile-profile-item" onClick={() => setSecurityOpen(true)}>
          <Shield size={20} />
          <span className="profile-item-label">账号安全</span>
          <ChevronRight size={18} color="#ccc" />
        </div>
        <div className="mobile-profile-item" onClick={() => setPrivacyOpen(true)}>
          <FileText size={20} />
          <span className="profile-item-label">隐私协议</span>
          <ChevronRight size={18} color="#ccc" />
        </div>
      </section>

      <section className="mobile-profile-section">
        <div className="mobile-profile-item" onClick={openProfile}>
          <User size={20} />
          <span className="profile-item-label">个人资料</span>
          <ChevronRight size={18} color="#ccc" />
        </div>
      </section>

      <button className="mobile-logout-btn" onClick={handleLogout}>
        <LogOut size={18} />
        退出登录
      </button>

      <Modal
        open={securityOpen}
        title="账号安全"
        onClose={() => setSecurityOpen(false)}
        footer={
          <>
            <button className="mobile-modal-btn" onClick={() => setSecurityOpen(false)}>取消</button>
            <button className="mobile-modal-btn primary" onClick={handleChangePassword}>确认修改</button>
          </>
        }
      >
        <div className="mobile-modal-row">
          <label>绑定手机号</label>
          <div className="mobile-modal-static">{user?.phone || '未绑定'}</div>
        </div>
        <div className="mobile-modal-row">
          <label>新密码</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="不少于 6 位"
          />
        </div>
        <div className="mobile-modal-row">
          <label>确认新密码</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="再次输入新密码"
          />
        </div>
      </Modal>

      <Modal open={privacyOpen} title="隐私协议" onClose={() => setPrivacyOpen(false)}>
        <div className="mobile-modal-privacy">
          <p>我们非常重视您的隐私保护。本协议说明我们如何收集、使用和保护您的个人信息。</p>
          <p>1. 信息收集：我们仅收集为您提供服务所必需的信息，包括手机号、传记内容、家庭资料等。</p>
          <p>2. 信息使用：您的个人资料与家族内容仅用于平台功能展示与 AI 服务生成，不会用于任何未经授权的商业用途。</p>
          <p>3. 信息保护：我们采用加密存储与访问控制措施，保障您的数据安全。未经您授权，任何第三方无法访问您的私密内容。</p>
          <p>4. 您的权利：您可以随时查看、修改或删除您的个人信息与内容，也可以注销账号。</p>
          <p>5. 协议更新：本协议如有更新，我们将在平台内公示，继续使用即视为您接受更新后的协议。</p>
        </div>
      </Modal>

      <Modal
        open={profileOpen}
        title="个人资料"
        onClose={() => setProfileOpen(false)}
        footer={
          <>
            <button className="mobile-modal-btn" onClick={() => setProfileOpen(false)}>取消</button>
            <button className="mobile-modal-btn primary" onClick={handleSaveProfile}>保存</button>
          </>
        }
      >
        <div className="mobile-modal-avatar-row">
          <div className="profile-avatar large">
            {(user?.name || user?.phone || '用').charAt(0)}
          </div>
          <span className="mobile-modal-avatar-hint">头像上传功能即将上线</span>
        </div>
        <div className="mobile-modal-row">
          <label>昵称</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="请输入昵称"
          />
        </div>
      </Modal>
    </div>
  );
}
