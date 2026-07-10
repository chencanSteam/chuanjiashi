import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  PenLine,
  LayoutDashboard,
  ClipboardList,
  UserCircle,
  Settings,
  LogOut,
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

const biographerNavItems: NavItem[] = [
  { to: '/biographer', icon: LayoutDashboard, label: '工作台' },
  { to: '/biographer/orders', icon: ClipboardList, label: '我的订单' },
  { to: '/biographer/profile', icon: UserCircle, label: '我的介绍页' },
  { to: '/biographer/profile/edit', icon: Settings, label: '编辑资料' },
];

export default function BiographerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const displayName = user?.name || user?.phone || '传记师';
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    setShowUserMenu(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo partner-brand-logo">
            <PenLine size={26} color="#fff" />
          </div>
          <div>
            <div className="brand-title">传记师工作台</div>
            <div className="brand-subtitle">传家世传记服务端</div>
          </div>
        </div>

        <nav className="nav">
          <ul className="nav-list">
            {biographerNavItems.map((item) => (
              <li className="nav-item" key={item.to}>
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
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
                <span className="user-role">传记师</span>
              </div>
              <ChevronDown size={14} className={`user-menu-arrow ${showUserMenu ? 'open' : ''}`} />
              {showUserMenu && (
                <div className="user-dropdown">
                  <NavLink to="/" className="user-dropdown-item">
                    用户端
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
