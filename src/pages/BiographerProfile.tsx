import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Award, Phone, Mail, BookOpen, Image, CheckCircle, MessageCircle, Calendar, Briefcase, Edit2, ArrowLeft, X, ThumbsUp, Users, User, Clock, FileText, Home } from 'lucide-react';
import { biographerApi } from '../api/biographer';
import { paymentApi } from '../api/payment';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import type { Biographer as MockBiographer, BiographerReview, BiographerService, BiographerBookingForm } from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import './BiographerProfile.css';

interface BiographerProfileProps {
  biographerId?: string;
  embedded?: boolean;
  onClose?: () => void;
  onBookService?: (service: BiographerService, formData: BiographerBookingForm) => Promise<void>;
}

const emptyBookingForm: BiographerBookingForm = {
  interviewee: '',
  relation: '',
  preferredTime: '',
  location: '',
  contactPhone: '',
  remark: '',
};

/** 证书条目是图片地址时按图渲染，否则按证书名称渲染占位卡片 */
function isImageUrl(cert: string): boolean {
  return /^(https?:|data:|blob:|\/)/.test(cert);
}

/** 未下单时隐藏中间四位，如 139****9001 */
function maskPhone(phone?: string): string {
  if (!phone) return '暂未公开';
  return phone.length > 7 ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : phone;
}

export default function BiographerProfile({ biographerId, embedded, onClose, onBookService }: BiographerProfileProps) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { id: paramId } = useParams<{ id?: string }>();
  const id = biographerId ?? paramId;
  const { user } = useAuth();
  const [biographer, setBiographer] = useState<MockBiographer | null>(null);
  const [reviews, setReviews] = useState<BiographerReview[]>([]);
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const [bookingService, setBookingService] = useState<BiographerService | null>(null);
  const [bookingForm, setBookingForm] = useState<BiographerBookingForm>(emptyBookingForm);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // 留言咨询弹窗
  const [showMessage, setShowMessage] = useState(false);
  const [messageForm, setMessageForm] = useState({ name: '', phone: '', content: '' });

  const openMessage = () => {
    setMessageForm((prev) => ({ ...prev, phone: prev.phone || user?.phone || '' }));
    setShowMessage(true);
  };

  const handleMessageSubmit = () => {
    if (!messageForm.name.trim() || !messageForm.phone.trim() || !messageForm.content.trim()) {
      addToast('请填写称呼、联系电话和留言内容', 'error');
      return;
    }
    addToast('留言已提交，传记师会尽快与您联系', 'success');
    setMessageForm({ name: '', phone: '', content: '' });
    setShowMessage(false);
  };

  const isOwnProfile = !id || (biographer && user?.phone === biographer.phone);

  const recommendedIndex = useMemo(() => {
    const services = biographer?.services;
    if (!services || services.length === 0) return -1;
    const sorted = [...services].sort((a, b) => a.price - b.price);
    return services.findIndex((s) => s.id === sorted[Math.floor(sorted.length / 2)]?.id);
  }, [biographer?.services]);

  useEffect(() => {
    const fetchBio = id ? biographerApi.get(id) : biographerApi.me();
    const fetchReviews = id ? biographerApi.getReviews(id) : Promise.resolve([]);
    const fetchContactAccess = id ? biographerApi.getContactAccess(id) : Promise.resolve({ unlocked: true });
    Promise.all([fetchBio, fetchReviews, fetchContactAccess])
      .then(([bio, revs, contactAccess]) => {
        setBiographer(bio);
        setReviews(revs as BiographerReview[]);
        setContactUnlocked(contactAccess.unlocked);
        if (user?.phone && !bookingForm.contactPhone) {
          setBookingForm((prev) => ({ ...prev, contactPhone: user.phone || '' }));
        }
      })
      .catch(() => {
        setBiographer(null);
        setReviews([]);
        setContactUnlocked(false);
      })
      .finally(() => setLoading(false));
  }, [id, user?.phone]);

  if (loading) {
    return <div className="partner-center-page"><div className="card"><div className="card-body">加载中...</div></div></div>;
  }

  if (!biographer) {
    return <div className="partner-center-page"><div className="card"><div className="card-body">暂无传记师资料</div></div></div>;
  }

  const avatarContent = biographer.avatar ? (
    <img src={biographer.avatar} alt={biographer.name} />
  ) : (
    biographer.name.charAt(0)
  );

  const statCards = [
    { value: `${biographer.experience || 0}`, label: '从业年限' },
    { value: `${biographer.completedOrders ?? 0}`, label: '完成订单' },
    { value: `${biographer.reviewCount || 0}`, label: '累计评价' },
    { value: `${(biographer.rating || 5).toFixed(1)}`, label: '用户评分' },
    { value: `${Math.round((biographer.rating || 5) / 5 * 100)}%`, label: '好评率' },
  ];

  const handleBookClick = (service: BiographerService) => {
    setBookingService(service);
    setBookingForm((prev) => ({
      ...emptyBookingForm,
      contactPhone: prev.contactPhone || user?.phone || '',
    }));
  };

  const handleBookingSubmit = async () => {
    if (!bookingService || !biographer) return;
    if (!bookingForm.interviewee || !bookingForm.relation || !bookingForm.preferredTime || !bookingForm.location || !bookingForm.contactPhone) {
      addToast('请填写完整的预约信息', 'error');
      return;
    }
    try {
      setBookingSubmitting(true);
      if (onBookService) {
        await onBookService(bookingService, bookingForm);
      } else {
        const { order } = await biographerApi.createOrder(biographer.id, bookingService.id, bookingForm);
        await paymentApi.pay((order as any).id, 'wechat');
        addToast(`预约成功，请支付定金 ¥${biographer.deposit || Math.round(bookingService.price * 0.3)}`, 'success');
      }
      setBookingService(null);
      if (embedded && onClose) onClose();
    } catch (err: any) {
      addToast(err.message || '预约失败', 'error');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const comparisonRights = ['采访次数', '传记字数', '交付周期', '实体书', '影像资料', '修改次数'];

  return (
    <div className="biographer-profile-page">
      <div className="biographer-profile-cover" />
      <Annotate id="biographer-profile.header">
      <div className="biographer-profile-header-card">
        {!embedded && (
          <button
            className="btn btn-outline"
            style={{ position: 'absolute', top: -71, left: 16, padding: '6px 12px', fontSize: 13 }}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={14} /> 返回
          </button>
        )}
        {embedded && onClose && (
          <button
            className="btn btn-outline"
            style={{ position: 'absolute', top: -71, right: 16, padding: '6px', width: 32, height: 32 }}
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        )}
        {isOwnProfile && !embedded && (
          <button
            className="btn btn-outline"
            style={{ position: 'absolute', top: 16, right: 16 }}
            onClick={() => navigate('/biographer/profile/edit')}
          >
            <Edit2 size={14} /> 编辑资料
          </button>
        )}
        <div className="biographer-profile-header-main">
          <div className="biographer-profile-avatar-wrap">
            <div className="biographer-profile-avatar">{avatarContent}</div>
          </div>
          <div className="biographer-profile-header-info">
            <div>
              <div className="biographer-profile-name-row">
                <div className="biographer-profile-name">{biographer.name}</div>
                <div className="biographer-profile-rating">
                  <Star size={14} fill="currentColor" /> {(biographer.rating || 5).toFixed(1)} 分
                </div>
              </div>
              <div className="biographer-profile-title">{biographer.city || '全国'}服务</div>
            </div>
            <Annotate id="biographer-profile.actions" inline>
            <div className="biographer-profile-actions">
              <button className="btn btn-primary" onClick={openMessage}>
                <MessageCircle size={16} /> 留言咨询
              </button>
            </div>
            </Annotate>
          </div>
        </div>
      </div>
      </Annotate>

      <div className="biographer-profile-stats">
        {statCards.map((s) => (
          <div key={s.label} className="biographer-profile-stat-card">
            <div className="biographer-profile-stat-value">{s.value}</div>
            <div className="biographer-profile-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="biographer-profile-section">
        <h3 className="biographer-profile-section-title"><MessageCircle size={18} /> 个人简介</h3>
        <p className="biographer-profile-intro">{biographer.intro}</p>
      </div>

      <div className="biographer-profile-section">
        <h3 className="biographer-profile-section-title"><MapPin size={18} /> 服务区域</h3>
        <div className="biographer-profile-areas">
          {biographer.serviceAreas?.length ? (
            biographer.serviceAreas.map((area) => (
              <span key={area} className="biographer-profile-area"><MapPin size={14} /> {area}</span>
            ))
          ) : (
            <span className="biographer-profile-area"><MapPin size={14} /> {biographer.city || '全国'}</span>
          )}
        </div>
      </div>

      {biographer.services && biographer.services.length > 0 && (
        <Annotate id="biographer-profile.services">
        <div className="biographer-profile-section">
          <h3 className="biographer-profile-section-title"><BookOpen size={18} /> 服务套餐</h3>
          <div className="biographer-profile-services">
            {biographer.services.map((s, idx) => (
              <div key={s.id} className={`biographer-profile-service ${idx === recommendedIndex ? 'recommended' : ''}`}>
                {idx === recommendedIndex && <span className="biographer-profile-service-badge">推荐</span>}
                <div className="biographer-profile-service-name">{s.name}</div>
                <div className="biographer-profile-service-desc">{s.description}</div>
                <div className="biographer-profile-service-footer">
                  <div className="biographer-profile-service-price">¥{s.price.toLocaleString()}<span> 起</span></div>
                  <button className="biographer-profile-service-btn" onClick={() => handleBookClick(s)}>
                    预约此套餐
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="biographer-profile-comparison">
            <h4 className="biographer-profile-comparison-title">套餐对比</h4>
            <div className="biographer-profile-comparison-table">
              <div
                className="biographer-profile-comparison-row header"
                style={{ gridTemplateColumns: `120px repeat(${biographer.services.length}, 1fr)` }}
              >
                <div className="biographer-profile-comparison-cell">对比项</div>
                {biographer.services.map((s) => (
                  <div key={s.id} className={`biographer-profile-comparison-cell ${s.id === biographer.services[recommendedIndex]?.id ? 'recommended' : ''}`}>
                    {s.name}
                  </div>
                ))}
              </div>
              {comparisonRights.map((right) => (
                <div key={right} className="biographer-profile-comparison-row" style={{ gridTemplateColumns: `120px repeat(${biographer.services.length}, 1fr)` }}>
                  <div className="biographer-profile-comparison-cell label">{right}</div>
                  {biographer.services.map((s) => (
                    <div key={s.id} className={`biographer-profile-comparison-cell ${s.id === biographer.services[recommendedIndex]?.id ? 'recommended' : ''}`}>
                      {s.description.includes(right.replace('采访', '').replace('次数', '')) ? (
                        <CheckCircle size={14} className="biographer-profile-comparison-check" />
                      ) : (
                        <span className="biographer-profile-comparison-dash">—</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              <div className="biographer-profile-comparison-row" style={{ gridTemplateColumns: `120px repeat(${biographer.services.length}, 1fr)` }}>
                <div className="biographer-profile-comparison-cell label">价格</div>
                {biographer.services.map((s) => (
                  <div key={s.id} className={`biographer-profile-comparison-cell ${s.id === biographer.services[recommendedIndex]?.id ? 'recommended' : ''}`}>
                    ¥{s.price.toLocaleString()}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </Annotate>
      )}

      {biographer.cases && biographer.cases.length > 0 && (
        <div className="biographer-profile-section">
          <h3 className="biographer-profile-section-title"><Image size={18} /> 成功案例</h3>
          <div className="biographer-profile-cases">
            {biographer.cases.map((c) => (
              <div key={c.id} className="biographer-profile-case">
                <div className="biographer-profile-case-cover">
                  {c.cover ? <img src={c.cover} alt={c.title} /> : <Image size={36} />}
                </div>
                <div className="biographer-profile-case-body">
                  <div className="biographer-profile-case-title">{c.title}</div>
                  <div className="biographer-profile-case-summary">{c.summary}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Annotate id="biographer-profile.reviews">
      <div className="biographer-profile-section">
        <h3 className="biographer-profile-section-title"><Star size={18} /> 客户评价</h3>
        <div className="biographer-profile-rating-summary">
          <div className="biographer-profile-rating-score">
            <div className="biographer-profile-rating-big">{(biographer.rating || 5).toFixed(1)}</div>
            <div className="biographer-profile-rating-stars">{'★'.repeat(Math.round(biographer.rating || 5))}</div>
            <div className="biographer-profile-rating-count">{biographer.reviewCount || 0} 条评价</div>
          </div>
          <div className="biographer-profile-rating-bars">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length;
              const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
              return (
                <div key={star} className="biographer-profile-rating-bar">
                  <span>{star} 星</span>
                  <div className="biographer-profile-rating-track">
                    <div className="biographer-profile-rating-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="biographer-profile-reviews">
          {reviews.slice(0, 6).map((r) => (
            <div key={r.id} className="biographer-profile-review">
              <div className="biographer-profile-review-header">
                <div className="biographer-profile-review-avatar">{r.userName.charAt(0)}</div>
                <div>
                  <div className="biographer-profile-review-name">{r.userName}</div>
                  <div className="biographer-profile-review-stars">{'★'.repeat(r.rating)}</div>
                </div>
              </div>
              <div className="biographer-profile-review-text">{r.content}</div>
              {r.tags && r.tags.length > 0 && (
                <div className="biographer-profile-review-tags">
                  {r.tags.map((tag) => (
                    <span key={tag} className="biographer-profile-review-tag"><ThumbsUp size={10} /> {tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="biographer-profile-review-empty">暂无评价</div>
          )}
        </div>
      </div>
      </Annotate>

      {biographer.certificates && biographer.certificates.length > 0 && (
        <Annotate id="biographer-profile.certificates">
        <div className="biographer-profile-section">
          <h3 className="biographer-profile-section-title"><Award size={18} /> 荣誉证书</h3>
          <div className="biographer-profile-certificates">
            {biographer.certificates.map((cert, idx) => (
              <div key={idx} className={`biographer-profile-certificate ${isImageUrl(cert) ? '' : 'named'}`}>
                {isImageUrl(cert) ? (
                  <img src={cert} alt={cert} />
                ) : (
                  <>
                    <Award size={26} />
                    <span className="biographer-profile-certificate-name">{cert}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        </Annotate>
      )}

      <div className="biographer-profile-section">
        <h3 className="biographer-profile-section-title"><Briefcase size={18} /> 更多信息</h3>
        <div className="biographer-profile-meta">
          {biographer.education && (
            <div className="biographer-profile-meta-item"><Award size={16} /> {biographer.education}</div>
          )}
          <div className="biographer-profile-meta-item"><Calendar size={16} /> 从业 {biographer.experience || 0} 年</div>
          <div className="biographer-profile-meta-item">
            <Phone size={16} /> {isOwnProfile || contactUnlocked ? biographer.phone : maskPhone(biographer.phone)}
            {!isOwnProfile && !contactUnlocked && (
              <span className="biographer-profile-phone-tip">下单套餐后可见完整号码</span>
            )}
          </div>
          {biographer.email && <div className="biographer-profile-meta-item"><Mail size={16} /> {biographer.email}</div>}
        </div>
      </div>

      <div className="biographer-profile-cta">
        <h3>为家人留下一份珍贵的记忆</h3>
        <p>立即预约 {biographer.name}，开启专属传记服务</p>
        {onBookService && biographer.services && biographer.services.length > 0 ? (
          <button
            className="biographer-profile-cta-btn"
            onClick={() => handleBookClick(biographer.services![recommendedIndex >= 0 ? recommendedIndex : 0])}
          >
            立即预约
          </button>
        ) : (
          <button className="biographer-profile-cta-btn" onClick={() => navigate('/biographers')}>免费咨询</button>
        )}
      </div>

      {bookingService && (
        <Annotate id="biographer-profile.booking-modal">
        <div className="modal-overlay" onClick={() => setBookingService(null)}>
          <div className="modal-content biographer-booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>预约 {biographer.name} 的「{bookingService.name}」</h4>
              <button className="modal-close" onClick={() => setBookingService(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="biographer-booking-summary">
                <div className="biographer-booking-price">
                  <span>服务价格</span>
                  <strong>¥{bookingService.price.toLocaleString()}</strong>
                </div>
                <div className="biographer-booking-deposit">
                  <span>需先支付定金</span>
                  <strong>¥{biographer.deposit || Math.round(bookingService.price * 0.3)}</strong>
                </div>
              </div>

              <div className="form-row">
                <label><Users size={12} /> 采访对象姓名</label>
                <input
                  type="text"
                  value={bookingForm.interviewee}
                  onChange={(e) => setBookingForm((prev) => ({ ...prev, interviewee: e.target.value }))}
                  placeholder="例如：张建国"
                />
              </div>
              <div className="form-row">
                <label><User size={12} /> 与采访对象关系</label>
                <select
                  value={bookingForm.relation}
                  onChange={(e) => setBookingForm((prev) => ({ ...prev, relation: e.target.value }))}
                >
                  <option value="">请选择关系</option>
                  <option value="本人">本人</option>
                  <option value="父亲">父亲</option>
                  <option value="母亲">母亲</option>
                  <option value="祖父">祖父</option>
                  <option value="祖母">祖母</option>
                  <option value="配偶">配偶</option>
                  <option value="其他长辈">其他长辈</option>
                </select>
              </div>
              <div className="form-row">
                <label><Clock size={12} /> 期望采访时间</label>
                <input
                  type="text"
                  value={bookingForm.preferredTime}
                  onChange={(e) => setBookingForm((prev) => ({ ...prev, preferredTime: e.target.value }))}
                  placeholder="例如：2024-07-20 14:00"
                />
              </div>
              <div className="form-row">
                <label><Home size={12} /> 采访地点 / 线上方式</label>
                <input
                  type="text"
                  value={bookingForm.location}
                  onChange={(e) => setBookingForm((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="例如：杭州市西湖区某某小区 / 腾讯会议"
                />
              </div>
              <div className="form-row">
                <label><Phone size={12} /> 联系电话</label>
                <input
                  type="text"
                  value={bookingForm.contactPhone}
                  onChange={(e) => setBookingForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="用于传记师与您联系"
                />
              </div>
              <div className="form-row">
                <label><FileText size={12} /> 特殊需求</label>
                <textarea
                  rows={3}
                  value={bookingForm.remark}
                  onChange={(e) => setBookingForm((prev) => ({ ...prev, remark: e.target.value }))}
                  placeholder="例如：老人听力不好，请放慢语速；希望重点记录抗战经历等"
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 8 }}
                disabled={bookingSubmitting}
                onClick={handleBookingSubmit}
              >
                {bookingSubmitting ? '提交中…' : `确认预约并支付定金 ¥${biographer.deposit || Math.round(bookingService.price * 0.3)}`}
              </button>
            </div>
          </div>
        </div>
        </Annotate>
      )}
      {showMessage && (
        <Annotate id="biographer-profile.message">
        <div className="modal-overlay" onClick={() => setShowMessage(false)}>
          <div className="modal-content biographer-message-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>留言咨询 · {biographer.name}</h4>
              <button className="modal-close" onClick={() => setShowMessage(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 12px' }}>
                留下您的需求和联系方式，传记师会尽快与您联系。
              </p>
              <div className="form-row">
                <label><User size={12} /> 您的称呼</label>
                <input
                  type="text"
                  value={messageForm.name}
                  onChange={(e) => setMessageForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：张女士"
                />
              </div>
              <div className="form-row">
                <label><Phone size={12} /> 联系电话</label>
                <input
                  type="text"
                  value={messageForm.phone}
                  onChange={(e) => setMessageForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="用于传记师与您联系"
                />
              </div>
              <div className="form-row">
                <label><FileText size={12} /> 留言内容</label>
                <textarea
                  rows={4}
                  value={messageForm.content}
                  onChange={(e) => setMessageForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="例如：想给父亲整理一本传记，老人今年 80 岁，住在杭州……"
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 8 }}
                onClick={handleMessageSubmit}
              >
                提交留言
              </button>
            </div>
          </div>
        </div>
        </Annotate>
      )}
    </div>
  );
}
