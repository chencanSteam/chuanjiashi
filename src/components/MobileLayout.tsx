import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Mic, Archive, Users, User } from 'lucide-react';
import { useVersion } from '../hooks/useVersion';
import AnnotationToggle from './annotation/AnnotationToggle';
import './MobileLayout.css';

// 「家庭」为 V1.2 功能，V1.0 模式下隐藏
const tabs = [
  { path: '/m', label: '首页', icon: Home },
  { path: '/m/interview', label: '采访', icon: Mic },
  { path: '/m/archive', label: '档案', icon: Archive },
  { path: '/m/family', label: '家庭', icon: Users, fullOnly: true },
  { path: '/m/profile', label: '我的', icon: User },
];

function MobileHeader() {
  const location = useLocation();
  const titleMap: Record<string, string> = {
    '/m': '传家世',
    '/m/onboarding': '创建传记',
    '/m/interview': 'AI 智能采访',
    '/m/archive': '人生档案',
    '/m/family': '家庭空间',
    '/m/profile': '我的',
    '/m/works': '我的作品',
    '/m/photo-restore': '照片修复',
    '/m/payment': '收银台',
    '/m/orders': '我的订单',
    '/m/after-sale': '售后服务',
    '/m/after-sale/apply': '申请退款',
    '/m/after-sale/result': '售后结果',
    '/m/address': '收货地址',
    '/m/notifications': '消息通知',
    '/m/invite': '我的邀请',
    '/m/account': '账号与隐私',
    '/m/works/': '作品详情',
  };
  const title = titleMap[location.pathname] || (location.pathname.startsWith('/m/works/') ? (location.pathname.endsWith('/read') ? '阅读传记' : '作品详情') : '传家世');

  return (
    <header className="mobile-header">
      <h1 className="mobile-header-title">{title}</h1>
    </header>
  );
}

export default function MobileLayout() {
  const { isV1 } = useVersion();
  const location = useLocation();
  const visibleTabs = tabs.filter((tab) => !tab.fullOnly || !isV1);
  return (
    <div className="mobile-layout">
      {location.pathname !== '/m/onboarding' && <MobileHeader />}
      <main className="mobile-layout-content">
        <Outlet />
      </main>
      {location.pathname !== '/m/onboarding' && <nav className="mobile-tab-bar">
        {visibleTabs.map((tab) => {
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
      </nav>}
      {location.pathname !== '/m/onboarding' && <AnnotationToggle />}
    </div>
  );
}
