import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Award, Phone, Mail, BookOpen, Image, CheckCircle, MessageCircle, Calendar, Briefcase, Edit2, ArrowLeft, X, ShoppingCart } from 'lucide-react';
import { biographerApi } from '../api/biographer';
import { useAuth } from '../hooks/useAuth';
import type { Biographer as MockBiographer } from '../mocks/types';
import './BiographerProfile.css';

const demoReviews = [
  { name: '张先生', rating: 5, text: '李老师非常专业，帮父亲整理了七十多年的人生经历，家人都非常感动。' },
  { name: '王女士', rating: 5, text: '从采访到成书整个过程很顺畅，传记质量超出预期，已经推荐给朋友。' },
  { name: '陈先生', rating: 5, text: '为我们家族三代人做了系统梳理，把零散的故事串成了完整的家族记忆。' },
];

interface BiographerProfileProps {
  biographerId?: string;
  embedded?: boolean;
  onClose?: () => void;
  onBookService?: (service: MockBiographer['services'][number]) => void;
}

export default function BiographerProfile({ biographerId, embedded, onClose, onBookService }: BiographerProfileProps) {
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id?: string }>();
  const id = biographerId ?? paramId;
  const { user } = useAuth();
  const [biographer, setBiographer] = useState<MockBiographer | null>(null);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !id || (biographer && user?.phone === biographer.phone);

  useEffect(() => {
    const fetch = id ? biographerApi.get(id) : biographerApi.me();
    fetch
      .then(setBiographer)
      .catch(() => setBiographer(null))
      .finally(() => setLoading(false));
  }, [id]);

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
    { value: '200+', label: '服务家庭' },
    { value: '98%', label: '好评率' },
    { value: '150+', label: '完稿作品' },
  ];

  return (
    <div className="biographer-profile-page">
      <div className="biographer-profile-cover" />
      <div className="biographer-profile-header-card">
        {!embedded && (
          <button
            className="btn btn-outline"
            style={{ position: 'absolute', top: 16, left: 16, padding: '6px 12px', fontSize: 13 }}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={14} /> 返回
          </button>
        )}
        {embedded && onClose && (
          <button
            className="btn btn-outline"
            style={{ position: 'absolute', top: 16, right: 16, padding: '6px', width: 32, height: 32 }}
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
        <div className="biographer-profile-avatar-wrap">
          <div className="biographer-profile-avatar">{avatarContent}</div>
          <div className="biographer-profile-verified"><CheckCircle size={18} /></div>
        </div>

        <div className="biographer-profile-name-row">
          <div>
            <div className="biographer-profile-name">{biographer.name}</div>
            <div className="biographer-profile-title">{biographer.title || '专业传记师'} · {biographer.city || '全国'}服务</div>
          </div>
          <div className="biographer-profile-rating">
            <Star size={14} fill="currentColor" /> 5.0 · 金牌认证
          </div>
        </div>

        <div className="biographer-profile-tags">
          {biographer.tags?.map((tag) => (
            <span key={tag} className="biographer-profile-tag">{tag}</span>
          ))}
          {!biographer.tags?.length && biographer.specialties?.map((s) => (
            <span key={s} className="biographer-profile-tag">{s}</span>
          ))}
        </div>

        <div className="biographer-profile-actions">
          {onBookService && biographer.services && biographer.services.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={() => onBookService(biographer.services![0])}
            >
              <ShoppingCart size={16} /> 立即预约
            </button>
          )}
          {!onBookService && <button className="btn btn-primary">立即预约</button>}
          <button className="btn btn-outline">在线咨询</button>
        </div>
      </div>

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
        <div className="biographer-profile-section">
          <h3 className="biographer-profile-section-title"><BookOpen size={18} /> 服务套餐</h3>
          <div className="biographer-profile-services">
            {biographer.services.map((s, idx) => (
              <div key={s.id} className="biographer-profile-service">
                {idx === 0 && <span className="biographer-profile-service-badge">热销</span>}
                <div className="biographer-profile-service-name">{s.name}</div>
                <div className="biographer-profile-service-desc">{s.description}</div>
                <div className="biographer-profile-service-footer">
                  <div className="biographer-profile-service-price">¥{s.price.toLocaleString()}<span> 起</span></div>
                  {onBookService ? (
                    <button className="biographer-profile-service-btn" onClick={() => onBookService(s)}>
                      预约此套餐
                    </button>
                  ) : (
                    <button className="biographer-profile-service-btn">了解详情</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
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

      <div className="biographer-profile-section">
        <h3 className="biographer-profile-section-title"><Star size={18} /> 客户评价</h3>
        <div className="biographer-profile-reviews">
          {demoReviews.map((r, idx) => (
            <div key={idx} className="biographer-profile-review">
              <div className="biographer-profile-review-header">
                <div className="biographer-profile-review-avatar">{r.name.charAt(0)}</div>
                <div>
                  <div className="biographer-profile-review-name">{r.name}</div>
                  <div className="biographer-profile-review-stars">{'★'.repeat(r.rating)}</div>
                </div>
              </div>
              <div className="biographer-profile-review-text">{r.text}</div>
            </div>
          ))}
        </div>
      </div>

      {biographer.certificates && biographer.certificates.length > 0 && (
        <div className="biographer-profile-section">
          <h3 className="biographer-profile-section-title"><Award size={18} /> 资质证明</h3>
          <div className="biographer-profile-certificates">
            {biographer.certificates.map((url, idx) => (
              <div key={idx} className="biographer-profile-certificate">
                {url ? <img src={url} alt="资质证明" /> : <Award size={28} />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="biographer-profile-section">
        <h3 className="biographer-profile-section-title"><Briefcase size={18} /> 更多信息</h3>
        <div className="biographer-profile-meta">
          {biographer.education && (
            <div className="biographer-profile-meta-item"><Award size={16} /> {biographer.education}</div>
          )}
          <div className="biographer-profile-meta-item"><Calendar size={16} /> 从业 {biographer.experience || 0} 年</div>
          <div className="biographer-profile-meta-item"><Phone size={16} /> {biographer.phone}</div>
          {biographer.email && <div className="biographer-profile-meta-item"><Mail size={16} /> {biographer.email}</div>}
        </div>
      </div>

      <div className="biographer-profile-cta">
        <h3>为家人留下一份珍贵的记忆</h3>
        <p>立即预约 {biographer.name}，开启专属传记服务</p>
        {onBookService && biographer.services && biographer.services.length > 0 ? (
          <button className="biographer-profile-cta-btn" onClick={() => onBookService(biographer.services![0])}>
            立即预约
          </button>
        ) : (
          <button className="biographer-profile-cta-btn">免费咨询</button>
        )}
      </div>
    </div>
  );
}
