import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  LayoutDashboard,
  Users,
  TrendingUp,
  CreditCard,
  LogOut,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import Avatar from './ui/Avatar';
import { useAuth } from '../hooks/useAuth';
import './Layout.css';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

const partnerNavItems: NavItem[] = [
  { to: '/partner', icon: LayoutDashboard, label: '数据看板' },
  { to: '/partner?tab=customers', icon: Users, label: '我的客户' },
  { to: '/partner?tab=earnings', icon: TrendingUp, label: '我的收益' },
  { to: '/partner?tab=withdraw', icon: CreditCard, label: '提现' },
];

export default function PartnerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const displayName = user?.name || user?.phone || '合伙人';
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    setShowUserMenu(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const currentTab = new URLSearchParams(location.search).get('tab') || 'dashboard';
  const isPartnerNavActive = (to: string) => {
    if (to === '/partner') return currentTab === 'dashboard';
    const tab = new URLSearchParams(to.split('?')[1] || '').get('tab');
    return currentTab === tab;
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo partner-brand-logo">
            <Briefcase size={26} color="#fff" />
          </div>
          <div>
            <div className="brand-title">合伙人中心</div>
            <div className="brand-subtitle">传家世推广端</div>
          </div>
        </div>

        <nav className="nav">
          <ul className="nav-list">
            {partnerNavItems.map((item) => (
              <li className="nav-item" key={item.to}>
                <NavLink
                  to={item.to}
                  className={() => `nav-link ${isPartnerNavActive(item.to) ? 'active' : ''}`}
                >
                  <item.icon className="nav-icon" size={18} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-art" aria-hidden />
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-actions" style={{ marginLeft: 'auto' }}>
            <div className="user-card user-menu-trigger" onClick={() => setShowUserMenu((v) => !v)}>
              <Avatar name={displayName} size={32} />
              <div className="user-info">
                <span className="user-name">{displayName}</span>
                <span className="user-role">合伙人</span>
              </div>
              <ChevronDown size={14} className={`user-menu-arrow ${showUserMenu ? 'open' : ''}`} />
              {showUserMenu && (
                <div className="user-dropdown">
                  <NavLink to="/" className="user-dropdown-item">
                    <ArrowLeft size={14} /> 用户端
                  </NavLink>
                  <div className="user-dropdown-divider" />
                  <button className="user-dropdown-item" onClick={handleLogout}>
                    <LogOut size={14} /> 退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
