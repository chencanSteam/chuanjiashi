import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Mic, Archive, Users, User } from 'lucide-react';
import AnnotationToggle from './annotation/AnnotationToggle';
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

  return (
    <header className="mobile-header">
      <h1 className="mobile-header-title">{title}</h1>
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
      <AnnotationToggle />
    </div>
  );
}
