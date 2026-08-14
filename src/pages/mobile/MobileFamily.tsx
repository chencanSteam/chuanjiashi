import { useState } from 'react';
import { Users, Heart, BookOpen, Calendar, Image, ChevronRight } from 'lucide-react';
import Annotate from '../../components/annotation/Annotate';
import './MobileFamily.css';

const modules = [
  { key: 'members', label: '家庭成员', desc: '3 位成员', icon: Users, color: '#1b5e4b' },
  { key: 'motto', label: '家训家规', desc: '忠厚传家远', icon: BookOpen, color: '#b8860b' },
  { key: 'album', label: '家族相册', desc: '12 张照片', icon: Image, color: '#8b5cf6' },
  { key: 'stories', label: '家族故事', desc: '5 个故事', icon: Heart, color: '#ef4444' },
  { key: 'events', label: '家族活动', desc: '近期 1 场', icon: Calendar, color: '#0ea5e9' },
];

function ModuleDetail({ moduleKey }: { moduleKey: string }) {
  switch (moduleKey) {
    case 'members':
      return (
        <ul className="family-detail-list">
          <li>张明远 · 家主</li>
          <li>李婉如 · 管理员</li>
          <li>张子涵 · 成员</li>
        </ul>
      );
    case 'motto':
      return (
        <p className="family-detail-text">忠厚传家远，诗书继世长。勤俭以养德，诚信以立身。</p>
      );
    case 'album':
      return (
        <p className="family-detail-text">共 12 张照片，最近上传：2024 全家福。相册功能即将上线，敬请期待。</p>
      );
    case 'stories':
      return (
        <ul className="family-detail-list">
          <li>爷爷的从军岁月</li>
          <li>奶奶的针线活</li>
          <li>老屋拆迁记</li>
          <li>全家第一次旅行</li>
          <li>除夕团圆饭</li>
        </ul>
      );
    case 'events':
      return (
        <p className="family-detail-text">近期 1 场：中秋家宴 · 9 月 17 日 · 老家祖屋</p>
      );
    default:
      return null;
  }
}

export default function MobileFamily() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="mobile-family">
      <Annotate id="mobile-family.hero">
      <section className="mobile-family-hero">
        <h2>张氏家庭</h2>
        <p>传承优良家风，共建和谐家庭</p>
      </section>
      </Annotate>

      <section className="mobile-family-section">
        <h3 className="section-title">家庭模块</h3>
        <Annotate id="mobile-family.module-list">
        <div className="mobile-family-list">
          {modules.map((m) => {
            const Icon = m.icon;
            const isOpen = expanded === m.key;
            return (
              <div key={m.key} className={`mobile-family-item-wrap${isOpen ? ' expanded' : ''}`}>
                <div
                  className="mobile-family-item"
                  onClick={() => setExpanded(isOpen ? null : m.key)}
                >
                  <div className="family-item-icon" style={{ background: `${m.color}15`, color: m.color }}>
                    <Icon size={22} />
                  </div>
                  <div className="family-item-info">
                    <div className="family-item-title">{m.label}</div>
                    <div className="family-item-desc">{m.desc}</div>
                  </div>
                  <ChevronRight
                    size={18}
                    color={isOpen ? m.color : '#ccc'}
                    className={`family-item-chevron${isOpen ? ' open' : ''}`}
                  />
                </div>
                {isOpen && (
                  <Annotate id="mobile-family.module-detail">
                  <div className="family-item-detail">
                    <ModuleDetail moduleKey={m.key} />
                  </div>
                  </Annotate>
                )}
              </div>
            );
          })}
        </div>
        </Annotate>
      </section>

      <section className="mobile-family-section">
        <h3 className="section-title">家庭动态</h3>
        <Annotate id="mobile-family.activity">
        <div className="mobile-family-empty">
          <p>暂无动态</p>
        </div>
        </Annotate>
      </section>
    </div>
  );
}
