import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  Shield,
  LogOut,
  ChevronRight,
  FileText,
  User,
  ShoppingBag,
  ClipboardList,
  MapPin,
  Headphones,
  Share2,
  Users,
  PlusCircle,
  Bell,
  MessageCircle,
  MessageSquareText,
  Info,
  Copy,
} from 'lucide-react';
import type { OrderAddress } from '../../mocks/types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/ui/Modal';
import Annotate from '../../components/annotation/Annotate';
import { loadLegacyArchives, setCurrentArchiveId } from '../../utils/mobileArchives';
import { loadRegisteredUsers, loadUserInvites } from '../../data/userInviteData';
import './MobileProfile.css';

interface SecurityInfo {
  realName?: string;
  idCard?: string;
  wechatBound?: boolean;
}

const EMPTY_ADDRESS: OrderAddress = { name: '', phone: '', province: '', city: '', district: '', detail: '' };

function loadSecurity(phone?: string): SecurityInfo {
  if (!phone) return {};
  try {
    const raw = localStorage.getItem(`cj_security_${phone}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadAddress(phone?: string): OrderAddress {
  try {
    const raw = localStorage.getItem('cj_last_address');
    const saved = raw ? JSON.parse(raw) as OrderAddress : EMPTY_ADDRESS;
    return { ...EMPTY_ADDRESS, ...saved, phone: saved.phone || phone || '' };
  } catch {
    return { ...EMPTY_ADDRESS, phone: phone || '' };
  }
}

function maskIdCard(id: string): string {
  if (id.length < 8) return id;
  return `${id.slice(0, 4)}**********${id.slice(-4)}`;
}

export default function MobileProfile() {
  const { user, logout, updateUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [securityOpen, setSecurityOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [nickname, setNickname] = useState('');
  const [feedback, setFeedback] = useState('');
  const [address, setAddress] = useState<OrderAddress>(() => loadAddress(user?.phone));
  const [security, setSecurity] = useState<SecurityInfo>(() => loadSecurity(user?.phone));

  const archives = useMemo(() => loadLegacyArchives(), []);
  const invitedUsers = useMemo(() => {
    if (!user?.phone) return [];
    const people = loadRegisteredUsers();
    return loadUserInvites()
      .filter((invite) => invite.inviterUserId === user.phone)
      .map((invite) => ({ ...invite, user: people.find((person) => person.phone === invite.inviteeUserId) }));
  }, [user?.phone]);

  useEffect(() => {
    setSecurity(loadSecurity(user?.phone));
    setAddress(loadAddress(user?.phone));
  }, [user?.phone]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const openProfileEdit = () => {
    setNickname(user?.name || '');
    setProfileOpen(true);
  };

  const saveProfile = () => {
    const name = nickname.trim();
    if (!name) {
      addToast('请输入昵称', 'error');
      return;
    }
    updateUser({ name });
    setProfileOpen(false);
    addToast('个人资料已保存', 'success');
  };

  const saveAddress = () => {
    if (!address.name.trim() || !/^1\d{10}$/.test(address.phone.trim()) || !address.province.trim() || !address.city.trim() || !address.detail.trim()) {
      addToast('请填写完整收货地址', 'error');
      return;
    }
    localStorage.setItem('cj_last_address', JSON.stringify({ ...address, name: address.name.trim(), phone: address.phone.trim() }));
    setAddressOpen(false);
    addToast('收货地址已保存', 'success');
  };

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      addToast(`${label}已复制`, 'success');
    } catch {
      addToast('复制失败，请稍后重试', 'error');
    }
  };

  const submitFeedback = () => {
    if (!feedback.trim()) {
      addToast('请输入您的意见或建议', 'error');
      return;
    }
    setFeedback('');
    setFeedbackOpen(false);
    addToast('感谢反馈，我们会认真阅读', 'success');
  };

  const openArchive = (id: string) => {
    setCurrentArchiveId(id);
    navigate('/m/archive');
  };

  const inviteUrl = `${window.location.origin}${window.location.pathname}#/login?invite=${user?.inviteCode || ''}`;

  return (
    <div className="mobile-profile">
      <Annotate id="mobile-profile.user-card">
        <section className="mobile-profile-header">
          <div className="profile-avatar large">{(user?.name || user?.phone || '用').charAt(0)}</div>
          <h2 className="profile-name">{user?.name || `用户${user?.phone?.slice(-4) || ''}`}</h2>
          <div className="profile-phone"><Phone size={14} /><span>{user?.phone || '未绑定手机号'}</span></div>
        </section>
      </Annotate>

      <Annotate id="mobile-profile.archives">
        <section className="mobile-profile-section mobile-archives-section">
          <div className="mobile-profile-section-heading">
            <span>我的档案</span>
            <button type="button" onClick={() => navigate('/onboarding', { state: { from: '/m/profile' } })}><PlusCircle size={14} /> 新建</button>
          </div>
          {archives.length === 0 ? (
            <button className="mobile-profile-empty-row" type="button" onClick={() => navigate('/onboarding', { state: { from: '/m/profile' } })}>
              <PlusCircle size={18} /> 创建第一份人生档案
            </button>
          ) : (
            <div className="mobile-profile-archive-list">
              {archives.map((archive) => (
                <button className="mobile-profile-archive-item" key={archive.id} type="button" onClick={() => openArchive(archive.id)}>
                  <span className="mobile-profile-archive-avatar">{archive.name.charAt(0)}</span>
                  <span className="mobile-profile-archive-info"><strong>{archive.name}的人生档案</strong><small>{archive.birthYear || '出生年份未填写'} · {archive.origin || '籍贯未填写'}</small></span>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
          )}
        </section>
      </Annotate>

      <Annotate id="mobile-profile.orders-services">
        <section className="mobile-profile-section">
          <div className="mobile-profile-section-heading"><span>订单与服务</span></div>
          <button className="mobile-profile-item" type="button" onClick={() => navigate('/store')}>
            <span className="mobile-profile-item-icon shop"><ShoppingBag size={19} /></span>
            <span className="profile-item-content"><strong>商城服务</strong><small>传记实体书与传承好物</small></span><ChevronRight size={18} />
          </button>
          <button className="mobile-profile-item" type="button" onClick={() => navigate('/my-orders')}>
            <span className="mobile-profile-item-icon order"><ClipboardList size={19} /></span>
            <span className="profile-item-content"><strong>我的订单</strong><small>商品、服务与传记师订单</small></span><ChevronRight size={18} />
          </button>
          <button className="mobile-profile-item" type="button" onClick={() => setAddressOpen(true)}>
            <span className="mobile-profile-item-icon address"><MapPin size={19} /></span>
            <span className="profile-item-content"><strong>收货地址</strong><small>{address.detail ? `${address.province}${address.city}${address.detail}` : '管理实体商品收货地址'}</small></span><ChevronRight size={18} />
          </button>
          <button className="mobile-profile-item" type="button" onClick={() => navigate('/my-orders?status=refunded')}>
            <span className="mobile-profile-item-icon aftersale"><Headphones size={19} /></span>
            <span className="profile-item-content"><strong>售后服务</strong><small>退款进度与售后记录</small></span><ChevronRight size={18} />
          </button>
        </section>
      </Annotate>

      <Annotate id="mobile-profile.invite">
        <section className="mobile-profile-section">
          <div className="mobile-profile-section-heading"><span>我的邀请</span></div>
          <button className="mobile-profile-item" type="button" onClick={() => setInviteOpen(true)}>
            <span className="mobile-profile-item-icon invite"><Share2 size={19} /></span>
            <span className="profile-item-content"><strong>我的邀请码</strong><small>{user?.inviteCode || '邀请码生成中'}</small></span><Copy size={16} />
          </button>
          <button className="mobile-profile-item" type="button" onClick={() => setInviteOpen(true)}>
            <span className="mobile-profile-item-icon invite"><Users size={19} /></span>
            <span className="profile-item-content"><strong>我邀请的人</strong><small>{invitedUsers.length ? `已邀请 ${invitedUsers.length} 位好友` : '暂未邀请好友'}</small></span><ChevronRight size={18} />
          </button>
        </section>
      </Annotate>

      <Annotate id="mobile-profile.more">
        <section className="mobile-profile-section">
          <div className="mobile-profile-section-heading"><span>更多</span></div>
          <button className="mobile-profile-item" type="button" onClick={() => setAccountOpen(true)}>
            <span className="mobile-profile-item-icon"><Shield size={19} /></span>
            <span className="profile-item-content"><strong>账号与隐私</strong><small>个人资料、账号安全与隐私协议</small></span><ChevronRight size={18} />
          </button>
          <button className="mobile-profile-item" type="button" onClick={() => navigate('/settings/notification')}>
            <span className="mobile-profile-item-icon notification"><Bell size={19} /></span>
            <span className="profile-item-content"><strong>消息通知</strong><small>管理订单与服务提醒</small></span><ChevronRight size={18} />
          </button>
          <button className="mobile-profile-item" type="button" onClick={() => setContactOpen(true)}>
            <span className="mobile-profile-item-icon contact"><MessageCircle size={19} /></span>
            <span className="profile-item-content"><strong>联系客服</strong><small>获取平台使用与服务帮助</small></span><ChevronRight size={18} />
          </button>
          <button className="mobile-profile-item" type="button" onClick={() => setFeedbackOpen(true)}>
            <span className="mobile-profile-item-icon feedback"><MessageSquareText size={19} /></span>
            <span className="profile-item-content"><strong>意见反馈</strong><small>告诉我们如何做得更好</small></span><ChevronRight size={18} />
          </button>
          <button className="mobile-profile-item" type="button" onClick={() => setAboutOpen(true)}>
            <span className="mobile-profile-item-icon about"><Info size={19} /></span>
            <span className="profile-item-content"><strong>关于传家世</strong><small>了解数字人生与家风传承平台</small></span><ChevronRight size={18} />
          </button>
        </section>
      </Annotate>

      <Annotate id="mobile-profile.logout"><button className="mobile-logout-btn" onClick={handleLogout}><LogOut size={18} />退出登录</button></Annotate>

      <Modal open={profileOpen} title="个人资料" onClose={() => setProfileOpen(false)} footer={<button className="mobile-modal-btn primary" onClick={saveProfile}>保存</button>}>
        <div className="mobile-modal-row"><label>昵称</label><input type="text" value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="请输入昵称" /></div>
        <div className="mobile-modal-row"><label>手机号</label><div className="mobile-modal-static">{user?.phone || '未绑定'}</div></div>
      </Modal>

      <Modal open={securityOpen} title="账号安全" onClose={() => setSecurityOpen(false)}>
        <div className="mobile-modal-row"><label>实名认证</label><div className="mobile-modal-static">{security.realName ? `${security.realName}（${maskIdCard(security.idCard || '')}）` : '未实名'}</div></div>
        <div className="mobile-modal-row"><label>微信绑定</label><div className="mobile-modal-static">{security.wechatBound ? '已绑定' : '未绑定'}</div></div>
        <div className="mobile-modal-row"><label>绑定手机号</label><div className="mobile-modal-static">{user?.phone || '未绑定'}</div></div>
        <div className="mobile-modal-row"><label>登录方式</label><div className="mobile-modal-static">短信验证码登录</div></div>
      </Modal>

      <Modal open={privacyOpen} title="隐私协议" onClose={() => setPrivacyOpen(false)}>
        <div className="mobile-modal-privacy"><p>我们非常重视您的隐私保护。本协议说明我们如何收集、使用和保护您的个人信息。</p><p>1. 信息收集：我们仅收集为您提供服务所必需的信息，包括手机号、传记内容、家庭资料等。</p><p>2. 信息使用：您的个人资料与家族内容仅用于平台功能展示与 AI 服务生成，不会用于任何未经授权的商业用途。</p><p>3. 信息保护：我们采用加密存储与访问控制措施，保障您的数据安全。未经您授权，任何第三方无法访问您的私密内容。</p></div>
      </Modal>

      <Modal open={addressOpen} title="收货地址" onClose={() => setAddressOpen(false)} footer={<button className="mobile-modal-btn primary" onClick={saveAddress}>保存地址</button>}>
        <div className="mobile-address-form">
          <label>收件人<input value={address.name} onChange={(event) => setAddress({ ...address, name: event.target.value })} placeholder="请输入收件人姓名" /></label>
          <label>联系电话<input value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value.replace(/\D/g, '').slice(0, 11) })} placeholder="请输入手机号" /></label>
          <label>所在省<input value={address.province} onChange={(event) => setAddress({ ...address, province: event.target.value })} placeholder="如：浙江省" /></label>
          <label>所在市<input value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} placeholder="如：杭州市" /></label>
          <label>区/县（选填）<input value={address.district} onChange={(event) => setAddress({ ...address, district: event.target.value })} placeholder="如：西湖区" /></label>
          <label>详细地址<input value={address.detail} onChange={(event) => setAddress({ ...address, detail: event.target.value })} placeholder="街道、门牌号等" /></label>
        </div>
      </Modal>

      <Modal open={inviteOpen} title="我的邀请" onClose={() => setInviteOpen(false)}>
        <div className="mobile-invite-content">
          <div className="mobile-invite-code"><span>我的邀请码</span><strong>{user?.inviteCode || '—'}</strong><button type="button" onClick={() => copyText(user?.inviteCode || '', '邀请码')}><Copy size={14} />复制邀请码</button></div>
          <button className="mobile-invite-link" type="button" onClick={() => copyText(inviteUrl, '邀请链接')}><Share2 size={14} />复制邀请链接</button>
          <div className="mobile-invite-list"><h4>我邀请的人</h4>{invitedUsers.length ? invitedUsers.map((item) => <div key={item.id}><span>{item.user?.name || `用户${item.inviteeUserId.slice(-4)}`}</span><small>{item.inviteeUserId} · {new Date(item.createdAt).toLocaleDateString()}</small></div>) : <p>暂未邀请好友，快分享邀请码邀请家人一起记录人生故事吧。</p>}</div>
        </div>
      </Modal>

      <Modal open={accountOpen} title="账号与隐私" onClose={() => setAccountOpen(false)}>
        <div className="mobile-account-options"><button type="button" onClick={() => { setAccountOpen(false); openProfileEdit(); }}><User size={18} /><span>个人资料</span><ChevronRight size={16} /></button><button type="button" onClick={() => { setAccountOpen(false); setSecurityOpen(true); }}><Shield size={18} /><span>账号安全</span><ChevronRight size={16} /></button><button type="button" onClick={() => { setAccountOpen(false); setPrivacyOpen(true); }}><FileText size={18} /><span>隐私协议</span><ChevronRight size={16} /></button></div>
      </Modal>

      <Modal open={contactOpen} title="联系客服" onClose={() => setContactOpen(false)}><div className="mobile-simple-content"><MessageCircle size={32} /><h4>传家世服务顾问</h4><p>工作日 9:00–18:00 为您提供档案创建、实体书制作、订单与售后服务支持。</p><strong>客服热线：400-888-2026</strong><span>原型演示环境，请以正式上线信息为准。</span></div></Modal>

      <Modal open={feedbackOpen} title="意见反馈" onClose={() => setFeedbackOpen(false)} footer={<button className="mobile-modal-btn primary" onClick={submitFeedback}>提交反馈</button>}><div className="mobile-feedback-form"><label>您想告诉我们什么？<textarea rows={5} value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="请输入您遇到的问题或建议" /></label></div></Modal>

      <Modal open={aboutOpen} title="关于传家世" onClose={() => setAboutOpen(false)}><div className="mobile-simple-content about"><div className="mobile-about-logo">传</div><h4>传家世</h4><p>用 AI 记录人生故事，让珍贵记忆、家风精神和家族传承跨越时间。</p><span>当前为产品原型演示版本</span></div></Modal>
    </div>
  );
}
