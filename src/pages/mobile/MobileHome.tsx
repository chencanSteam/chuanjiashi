import { useNavigate } from 'react-router-dom';
import { Mic, Archive, Users, BookOpen, Image, Settings, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './MobileHome.css';

interface Archive {
  id: string;
  name: string;
  birthYear: string;
  origin: string;
  occupation: string;
}

function loadCurrentArchive(): Archive | null {
  try {
    const currentId = localStorage.getItem('cj_current_archive_id');
    if (!currentId) return null;
    const raw = localStorage.getItem('cj_archives');
    if (!raw) return null;
    return JSON.parse(raw).find((a: Archive) => a.id === currentId) || null;
  } catch {
    return null;
  }
}

const quickActions = [
  { label: 'AI 采访', path: '/m/interview', icon: Mic, color: '#1b5e4b' },
  { label: '人生档案', path: '/m/archive', icon: Archive, color: '#b8860b' },
  { label: '家庭空间', path: '/m/family', icon: Users, color: '#8b5cf6' },
  { label: '传记作品', path: '/m/works', icon: BookOpen, color: '#0ea5e9' },
  { label: '照片修复', path: '/m/photo-restore', icon: Image, color: '#f59e0b' },
  { label: '设置', path: '/m/profile', icon: Settings, color: '#64748b' },
];

export default function MobileHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const archive = loadCurrentArchive();

  return (
    <div className="mobile-home">
      <section className="mobile-home-hero">
        <div className="mobile-home-greeting">
          <h2>您好，{user?.name || user?.phone?.slice(-4) || '用户'}</h2>
          <p>记录家族记忆，传承家风文化</p>
        </div>
      </section>

      {archive && (
        <section className="mobile-home-card archive-card" onClick={() => navigate('/m/archive')}>
          <div className="archive-card-info">
            <h3>{archive.name}</h3>
            <p>{archive.birthYear} 年 · {archive.origin}</p>
            <p className="archive-occupation">{archive.occupation}</p>
          </div>
          <ChevronRight size={20} color="#999" />
        </section>
      )}

      <section className="mobile-home-section">
        <h3 className="section-title">快捷功能</h3>
        <div className="mobile-home-grid">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                className="mobile-home-grid-item"
                onClick={() => navigate(action.path)}
              >
                <div className="grid-icon" style={{ background: `${action.color}15`, color: action.color }}>
                  <Icon size={24} />
                </div>
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mobile-home-section">
        <h3 className="section-title">最近动态</h3>
        <div className="mobile-home-empty">
          <p>暂无新动态</p>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/m/interview')}>
            去采访
          </button>
        </div>
      </section>
    </div>
  );
}
