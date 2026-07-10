import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Shield,
  Users,
  UserCheck,
  ClipboardList,
  Link2,
  TrendingUp,
  Wallet,
  Share2,
  LogOut,
  ArrowLeft,
  ChevronDown,
  ShoppingCart,
  Brain,
  BookOpen,
} from 'lucide-react';
import Avatar from './ui/Avatar';
import { useAuth } from '../hooks/useAuth';
import './Layout.css';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

const adminNavItems: NavItem[] = [
  { to: '/admin/biographers', icon: Users, label: '传记师管理' },
  { to: '/admin/partners', icon: UserCheck, label: '合伙人管理' },
  { to: '/admin/partner-applications', icon: ClipboardList, label: '合伙人申请' },
  { to: '/admin/partner-customers', icon: Link2, label: '客户归属' },
  { to: '/admin/orders', icon: ShoppingCart, label: '订单管理' },
  { to: '/admin/commission-records', icon: TrendingUp, label: '分润流水' },
  { to: '/admin/book-review', icon: BookOpen, label: '传记上架审核' },
  { to: '/admin/withdrawals', icon: Wallet, label: '提现审核' },
  { to: '/admin/user-invites', icon: Share2, label: '用户邀请奖励' },
  { to: '/admin/ai-usage', icon: Brain, label: 'AI 使用情况' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const displayName = user?.name || user?.phone || '管理员';
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
          <div className="brand-logo admin-brand-logo">
            <Shield size={28} color="#fff" />
          </div>
          <div>
            <div className="brand-title">运营后台</div>
            <div className="brand-subtitle">传家世管理平台</div>
          </div>
        </div>

        <nav className="nav">
          <ul className="nav-list">
            {adminNavItems.map((item) => (
              <li className="nav-item" key={item.to}>
                <NavLink
                  to={item.to}
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
                <span className="user-role">管理员</span>
              </div>
              <ChevronDown size={14} className={`user-menu-arrow ${showUserMenu ? 'open' : ''}`} />
              {showUserMenu && (
                <div className="user-dropdown">
                  <NavLink to="/" className="user-dropdown-item">
                    <ArrowLeft size={14} /> 返回用户端
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
