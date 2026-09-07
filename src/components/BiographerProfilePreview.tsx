import { Award, BookOpen, Briefcase, Image, MapPin, Star } from 'lucide-react';
import type { Biographer } from '../mocks/types';
import './BiographerProfilePreview.css';

type ProfileData = Pick<Biographer, 'name' | 'phone' | 'email' | 'avatar' | 'city' | 'intro' | 'title' | 'specialties' | 'experience' | 'serviceAreas' | 'education' | 'certificates' | 'tags' | 'services' | 'cases' | 'rating' | 'reviewCount' | 'completedOrders'>;

export default function BiographerProfilePreview({ profile, reviewMode = false }: { profile: Partial<ProfileData>; reviewMode?: boolean }) {
  const services = profile.services || [];
  const cases = profile.cases || [];
  const certificates = profile.certificates || [];
  return (
    <div className="profile-preview">
      {reviewMode && <div className="profile-preview-banner">待审核预览 · 仅平台和传记师可见</div>}
      <section className="profile-preview-hero">
        <div className="profile-preview-avatar">{profile.avatar ? <img src={profile.avatar} alt={profile.name || '头像'} /> : (profile.name || '传').charAt(0)}</div>
        <div><h2>{profile.name || '未填写姓名'}</h2><strong>{profile.title || '传记师'}</strong><span>{profile.city || '未填写城市'} · 从业 {profile.experience || 0} 年</span></div>
        {profile.rating !== undefined && <div className="profile-preview-rating"><Star size={16} fill="currentColor" /> {profile.rating.toFixed(1)}<small>{profile.reviewCount || 0} 条评价</small></div>}
      </section>
      <section className="profile-preview-section"><h3><Briefcase size={16} /> 个人简介</h3><p>{profile.intro || '暂无个人简介'}</p></section>
      <section className="profile-preview-section"><h3><MapPin size={16} /> 服务区域</h3><div className="profile-preview-tags">{(profile.serviceAreas?.length ? profile.serviceAreas : [profile.city || '未填写']).map((item) => <span key={item}><MapPin size={12} /> {item}</span>)}</div></section>
      <section className="profile-preview-section"><h3><Star size={16} /> 专长与标签</h3><div className="profile-preview-tags">{[...(profile.specialties || []), ...(profile.tags || [])].map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div></section>
      <section className="profile-preview-section"><h3><BookOpen size={16} /> 服务套餐（{services.length}）</h3>{services.length ? <div className="profile-preview-services">{services.map((service) => <div className="profile-preview-service" key={service.id}><div><strong>{service.name || '未命名套餐'}</strong><p>{service.description || '暂无套餐说明'}</p>{[['采访次数', service.interviewCount], ['传记字数', service.wordCount], ['交付周期', service.deliveryPeriod], ['实体书', service.physicalBook], ['影像资料', service.mediaMaterial], ['修改次数', service.revisionCount]].some(([, v]) => v) && <p className="profile-preview-muted">{[['采访次数', service.interviewCount], ['传记字数', service.wordCount], ['交付周期', service.deliveryPeriod], ['实体书', service.physicalBook], ['影像资料', service.mediaMaterial], ['修改次数', service.revisionCount]].filter(([, v]) => v).map(([k, v]) => `${k}：${v}`).join(' · ')}</p>}</div><b>¥{service.price?.toLocaleString() || 0}</b></div>)}</div> : <p className="profile-preview-muted">暂无服务套餐</p>}</section>
      <section className="profile-preview-section"><h3><Image size={16} /> 成功案例（{cases.length}）</h3>{cases.length ? <div className="profile-preview-cases">{cases.map((item) => <article key={item.id}><div className="profile-preview-case-cover">{item.cover ? <img src={item.cover} alt={item.title} /> : <Image size={25} />}</div><strong>{item.title || '未命名案例'}</strong><p>{item.summary || '暂无案例说明'}</p></article>)}</div> : <p className="profile-preview-muted">暂无成功案例</p>}</section>
      <section className="profile-preview-section"><h3><Award size={16} /> 资质证明（{certificates.length}）</h3>{certificates.length ? <div className="profile-preview-certificates">{certificates.map((item, index) => <span key={`${item}-${index}`}><Award size={14} /> {item || '未命名资质'}</span>)}</div> : <p className="profile-preview-muted">暂无资质证明</p>}</section>
    </div>
  );
}
