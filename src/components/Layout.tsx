import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Mic,
  BookOpen,
  BookMarked,
  FolderOpen,
  Users,
  GitFork,
  Landmark,
  UserCircle2,
  MessageCircleHeart,
  Building2,
  Settings,
  Search,
  Bell,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import Avatar from './ui/Avatar';
import { useAuth } from '../hooks/useAuth';
import { useVersion } from '../hooks/useVersion';
import './Layout.css';

// 完整版导航入口
const navItemsFull = [
  { to: '/', icon: LayoutDashboard, label: '首页' },
  { to: '/interview', icon: Mic, label: 'AI智能采访' },
  { to: '/archive', icon: FolderOpen, label: '人生档案' },
  { to: '/biography', icon: BookOpen, label: 'AI传记生成' },
  { to: '/my-works', icon: BookMarked, label: '我的传记' },
  { to: '/family', icon: Users, label: '家庭空间' },
  { to: '/genealogy', icon: GitFork, label: '数字家谱' },
  { to: '/family-hall', icon: Landmark, label: 'AI家风馆' },
  { to: '/digital-person', icon: UserCircle2, label: '数字人' },
  { to: '/digital-companion', icon: MessageCircleHeart, label: '数字陪伴' },
  { to: '/government', icon: Building2, label: '政务客户服务' },
  { to: '/settings', icon: Settings, label: '系统设置' },
];

// MVP 版导航入口：保留核心闭环 + 基础数字人体验
const navItemsMVP = [
  { to: '/', icon: LayoutDashboard, label: '首页' },
  { to: '/interview', icon: Mic, label: 'AI智能采访' },
  { to: '/archive', icon: FolderOpen, label: '人生档案' },
  { to: '/biography', icon: BookOpen, label: 'AI传记生成' },
  { to: '/my-works', icon: BookMarked, label: '我的传记' },
  { to: '/digital-person', icon: UserCircle2, label: '数字人' },
  { to: '/settings', icon: Settings, label: '系统设置' },
];

// const isMVP = import.meta.env.VITE_MVP_MODE === 'true';
// const navItems = isMVP ? navItemsMVP : navItemsFull;

export default function Layout() {
  const { user, logout } = useAuth();
  const { isMVP } = useVersion();
  const navItems = isMVP ? navItemsMVP : navItemsFull;
  const navigate = useNavigate();
  const displayName = user?.name || user?.phone || '用户';
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            <svg viewBox="0 0 44 44" width="44" height="44">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2D5A4A" />
                  <stop offset="100%" stopColor="#3D7A64" />
                </linearGradient>
                <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#B8860B" />
                  <stop offset="100%" stopColor="#D4A84B" />
                </linearGradient>
              </defs>
              {/* 外圈印章风格 */}
              <circle cx="22" cy="22" r="20" fill="url(#logoGrad)" />
              <circle cx="22" cy="22" r="17" fill="none" stroke="url(#accentGrad)" strokeWidth="1.5" opacity="0.6" />
              {/* 内圈装饰 */}
              <circle cx="22" cy="22" r="14" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
              {/* 传字 */}
              <text x="22" y="28" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="700" fontFamily="serif" letterSpacing="1">传</text>
              {/* 顶部装饰点 */}
              <circle cx="22" cy="8" r="1.5" fill="url(#accentGrad)" />
            </svg>
          </div>
          <div>
            <div className="brand-title">传家世</div>
            <div className="brand-subtitle">AI数字人生与家风传承平台</div>
          </div>
        </div>

        {isMVP && (
          <div className="mvp-badge" title="当前为 MVP 模式，仅展示核心功能入口">
            MVP 模式
          </div>
        )}

        <nav className="nav">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li className="nav-item" key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
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
          <div className="search-bar">
            <Search size={16} />
            <input type="text" placeholder="搜索人物、档案、家谱、家风故事等…" />
          </div>
          <div className="topbar-actions">
            <button className="icon-btn message-btn" title="消息">
              <Bell size={18} />
              <span className="badge">12</span>
            </button>
            <button className="icon-btn" title="帮助中心">
              <HelpCircle size={18} />
            </button>
            <div className="user-card">
              <Avatar name={displayName} size={32} />
              <div className="user-info">
                <span className="user-name">{displayName}</span>
                <span className="user-role">{user?.phone || ''}</span>
              </div>
              <button className="icon-btn logout-btn" title="退出登录" onClick={handleLogout}>
                <LogOut size={16} />
              </button>
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
