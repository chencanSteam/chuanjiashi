import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  Shield,
  LogOut,
  ChevronRight,
  ClipboardList,
  MapPin,
  Headphones,
  PlusCircle,
  Bell,
  MessageCircle,
  MessageSquareText,
  Info,
} from 'lucide-react';
import type { OrderAddress } from '../../mocks/types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/ui/Modal';
import Annotate from '../../components/annotation/Annotate';
import { loadLegacyArchives, setCurrentArchiveId } from '../../utils/mobileArchives';
import './MobileProfile.css';

const EMPTY_ADDRESS: OrderAddress = { name: '', phone: '', province: '', city: '', district: '', detail: '' };

function loadAddress(phone?: string): OrderAddress {
  try {
    const raw = localStorage.getItem('cj_last_address');
    const saved = raw ? JSON.parse(raw) as OrderAddress : EMPTY_ADDRESS;
    return { ...EMPTY_ADDRESS, ...saved, phone: saved.phone || phone || '' };
  } catch {
    return { ...EMPTY_ADDRESS, phone: phone || '' };
  }
}

export default function MobileProfile() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [contactOpen, setContactOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [address, setAddress] = useState<OrderAddress>(() => loadAddress(user?.phone));

  const archives = useMemo(() => loadLegacyArchives(), []);

  useEffect(() => {
    setAddress(loadAddress(user?.phone));
  }, [user?.phone]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
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
            <button type="button" onClick={() => navigate('/m/onboarding')}><PlusCircle size={14} /> 新建</button>
          </div>
          {archives.length === 0 ? (
            <button className="mobile-profile-empty-row" type="button" onClick={() => navigate('/m/onboarding')}>
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
          <button className="mobile-profile-item" type="button" onClick={() => navigate('/m/orders')}>
            <span className="mobile-profile-item-icon order"><ClipboardList size={19} /></span>
            <span className="profile-item-content"><strong>我的订单</strong><small>商品、服务与传记师订单</small></span><ChevronRight size={18} />
          </button>
          <button className="mobile-profile-item" type="button" onClick={() => navigate('/m/address')}>
            <span className="mobile-profile-item-icon address"><MapPin size={19} /></span>
            <span className="profile-item-content"><strong>收货地址</strong><small>{address.detail ? `${address.province}${address.city}${address.detail}` : '管理实体商品收货地址'}</small></span><ChevronRight size={18} />
          </button>
          <button className="mobile-profile-item" type="button" onClick={() => navigate('/m/after-sale')}>
            <span className="mobile-profile-item-icon aftersale"><Headphones size={19} /></span>
            <span className="profile-item-content"><strong>售后服务</strong><small>退款进度与售后记录</small></span><ChevronRight size={18} />
          </button>
        </section>
      </Annotate>

      <Annotate id="mobile-profile.more">
        <section className="mobile-profile-section">
          <div className="mobile-profile-section-heading"><span>更多</span></div>
          <button className="mobile-profile-item" type="button" onClick={() => navigate('/m/account')}>
            <span className="mobile-profile-item-icon"><Shield size={19} /></span>
            <span className="profile-item-content"><strong>账号与隐私</strong><small>个人资料、账号安全与隐私协议</small></span><ChevronRight size={18} />
          </button>
          <button className="mobile-profile-item" type="button" onClick={() => navigate('/m/notifications')}>
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

      <Modal open={contactOpen} title="联系客服" onClose={() => setContactOpen(false)}><div className="mobile-simple-content"><MessageCircle size={32} /><h4>传家世服务顾问</h4><p>工作日 9:00–18:00 为您提供档案创建、实体书制作、订单与售后服务支持。</p><strong>客服热线：400-888-2026</strong><span>原型演示环境，请以正式上线信息为准。</span></div></Modal>

      <Modal open={feedbackOpen} title="意见反馈" onClose={() => setFeedbackOpen(false)} footer={<button className="mobile-modal-btn primary" onClick={submitFeedback}>提交反馈</button>}><div className="mobile-feedback-form"><label>您想告诉我们什么？<textarea rows={5} value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="请输入您遇到的问题或建议" /></label></div></Modal>

      <Modal open={aboutOpen} title="关于传家世" onClose={() => setAboutOpen(false)}><div className="mobile-simple-content about"><div className="mobile-about-logo">传</div><h4>传家世</h4><p>用 AI 记录人生故事，让珍贵记忆、家风精神和家族传承跨越时间。</p><span>当前为产品原型演示版本</span></div></Modal>
    </div>
  );
}
