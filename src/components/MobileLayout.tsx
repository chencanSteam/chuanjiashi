import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Mic, Archive, Users, User } from 'lucide-react';
import './MobileLayout.css';

const tabs = [
  { path: '/m', label: '首页', icon: Home },
  { path: '/m/interview', label: '采访', icon: Mic },
  { path: '/m/archive', label: '档案', icon: Archive },
  { path: '/m/family', label: '家庭', icon: Users },
  { path: '/m/profile', label: '我的', icon: User },
];

function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const titleMap: Record<string, string> = {
    '/m': '传家世',
    '/m/interview': 'AI 智能采访',
    '/m/archive': '人生档案',
    '/m/family': '家庭空间',
    '/m/profile': '我的',
    '/m/works': '我的作品',
    '/m/photo-restore': '照片修复',
  };
  const title = titleMap[location.pathname] || '传家世';
  const isHome = location.pathname === '/m';

  return (
    <header className="mobile-header">
      {isHome ? (
        <div className="mobile-header-placeholder" />
      ) : (
        <button
          className="mobile-header-back"
          onClick={() => navigate(-1)}
          aria-label="返回"
        >
          ←
        </button>
      )}
      <h1 className="mobile-header-title">{title}</h1>
      <div className="mobile-header-placeholder" />
    </header>
  );
}

export default function MobileLayout() {
  return (
    <div className="mobile-layout">
      <MobileHeader />
      <main className="mobile-layout-content">
        <Outlet />
      </main>
      <nav className="mobile-tab-bar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/m'}
              className={({ isActive }) =>
                `mobile-tab-item${isActive ? ' active' : ''}`
              }
            >
              <Icon size={22} />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
