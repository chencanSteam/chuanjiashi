import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Shield, LogOut, ChevronRight, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/ui/Modal';
import Annotate from '../../components/annotation/Annotate';
import './MobileProfile.css';

export default function MobileProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [securityOpen, setSecurityOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="mobile-profile">
      <Annotate id="mobile-profile.user-card">
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
      </Annotate>

      <section className="mobile-profile-section">
        <Annotate id="mobile-profile.security">
        <div className="mobile-profile-item" onClick={() => setSecurityOpen(true)}>
          <Shield size={20} />
          <span className="profile-item-label">账号安全</span>
          <ChevronRight size={18} color="#ccc" />
        </div>
        </Annotate>
        <Annotate id="mobile-profile.privacy">
        <div className="mobile-profile-item" onClick={() => setPrivacyOpen(true)}>
          <FileText size={20} />
          <span className="profile-item-label">隐私协议</span>
          <ChevronRight size={18} color="#ccc" />
        </div>
        </Annotate>
      </section>

      <Annotate id="mobile-profile.logout">
      <button className="mobile-logout-btn" onClick={handleLogout}>
        <LogOut size={18} />
        退出登录
      </button>
      </Annotate>

      <Modal
        open={securityOpen}
        title="账号安全"
        onClose={() => setSecurityOpen(false)}
      >
        <div className="mobile-modal-row">
          <label>绑定手机号</label>
          <div className="mobile-modal-static">{user?.phone || '未绑定'}</div>
        </div>
        <div className="mobile-modal-row">
          <label>登录方式</label>
          <div className="mobile-modal-static">短信验证码登录</div>
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
    </div>
  );
}
