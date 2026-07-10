import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
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
  Settings,
  Search,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronDown,
  Briefcase,
  Share2,
  User,
  Bell as BellIcon,
  Shield as ShieldIcon,
  Database,
  Sparkles,
  Wand2,
  FileText,
  PenLine,
  UserCheck,
} from 'lucide-react';
import Avatar from './ui/Avatar';
import { useAuth } from '../hooks/useAuth';
import { useVersion } from '../hooks/useVersion';
import GuideTour, { openGuide } from './GuideTour';
import './Layout.css';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

interface NavGroup {
  key: string;
  icon: LucideIcon;
  label: string;
  items: NavItem[];
}

// 基础导航入口
const baseNavItemsFull: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: '首页' },
  { to: '/archive', icon: FolderOpen, label: '人生档案' },
  { to: '/photo-restore', icon: Wand2, label: '老照片修复' },
  { to: '/interview', icon: Mic, label: 'AI智能采访' },
  { to: '/biography', icon: BookOpen, label: 'AI传记生成' },
  { to: '/my-works', icon: BookMarked, label: '我的传记' },
  { to: '/biographers', icon: UserCheck, label: '找传记师' },
  { to: '/family', icon: Users, label: '家庭空间' },
  { to: '/genealogy', icon: GitFork, label: '数字家谱' },
  { to: '/family-hall', icon: Landmark, label: 'AI家风馆' },
  { to: '/digital-person', icon: UserCircle2, label: '数字人' },
  { to: '/digital-companion', icon: MessageCircleHeart, label: '数字陪伴' },
];

const baseNavItemsMVP: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: '首页' },
  { to: '/archive', icon: FolderOpen, label: '人生档案' },
  { to: '/photo-restore', icon: Wand2, label: '老照片修复' },
  { to: '/interview', icon: Mic, label: 'AI智能采访' },
  { to: '/biography', icon: BookOpen, label: 'AI传记生成' },
  { to: '/my-works', icon: BookMarked, label: '我的传记' },
  { to: '/biographers', icon: UserCheck, label: '找传记师' },
  { to: '/digital-person', icon: UserCircle2, label: '数字人' },
];

const settingsGroupItems: NavItem[] = [
  { to: '/settings/account', icon: User, label: '账户信息' },
  { to: '/settings/invite', icon: Share2, label: '我的邀请' },
  { to: '/settings/quota', icon: Sparkles, label: 'AI额度' },
  { to: '/settings/notification', icon: BellIcon, label: '通知设置' },
  { to: '/settings/privacy', icon: ShieldIcon, label: '隐私与安全' },
  { to: '/settings/family', icon: Users, label: '家庭成员' },
  { to: '/settings/storage', icon: Database, label: '存储与备份' },
  { to: '/settings/help', icon: HelpCircle, label: '帮助与反馈' },
];

function isGroupActive(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) => pathname.startsWith(item.to));
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { isMVP } = useVersion();
  const baseNavItems = isMVP ? baseNavItemsMVP : baseNavItemsFull;
  const location = useLocation();
  const pathname = location.pathname;

  const settingsGroup: NavGroup = { key: 'settings', icon: Settings, label: '系统设置', items: settingsGroupItems };

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => ({
    settings: settingsGroupItems.some((item) => pathname.startsWith(item.to)),
  }));

  useEffect(() => {
    setExpanded((prev) => ({
      ...prev,
      settings: settingsGroupItems.some((item) => pathname.startsWith(item.to)),
    }));
  }, [pathname]);

  const toggleGroup = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navigate = useNavigate();
  const displayName = user?.name || user?.phone || '用户';
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isAdmin = user?.roles?.includes('admin') ?? false;
  const isPartner = user?.roles?.includes('partner') ?? false;
  const isBiographer = user?.roles?.includes('biographer') ?? false;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    setShowUserMenu(false);
  }, [pathname]);

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
            {baseNavItems.map((item) => (
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

            <li className={`nav-item nav-group ${isGroupActive(settingsGroup, pathname) ? 'active' : ''}`} key="settings-group">
              <button
                className="nav-group-header"
                onClick={() => toggleGroup('settings')}
                type="button"
              >
                <settingsGroup.icon className="nav-icon" size={18} />
                <span>{settingsGroup.label}</span>
                {expanded.settings ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {expanded.settings && (
                <ul className="nav-sub-list">
                  {settingsGroup.items.map((item) => (
                    <li className="nav-sub-item" key={item.to}>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) => `nav-sub-link ${isActive ? 'active' : ''}`}
                      >
                        <item.icon className="nav-icon" size={16} />
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
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
            <button className="icon-btn" title="帮助中心" onClick={openGuide}>
              <HelpCircle size={18} />
            </button>
            <div className="user-card user-menu-trigger" onClick={() => setShowUserMenu((v) => !v)}>
              <Avatar name={displayName} size={32} />
              <div className="user-info">
                <span className="user-name">{displayName}</span>
                <span className="user-role">{user?.phone || ''}</span>
              </div>
              <ChevronDown size={14} className={`user-menu-arrow ${showUserMenu ? 'open' : ''}`} />
              {showUserMenu && (
                <div className="user-dropdown">
                  {isPartner ? (
                    <NavLink to="/partner" className="user-dropdown-item">
                      <Briefcase size={14} /> 合伙人中心
                    </NavLink>
                  ) : (
                    <NavLink to="/partner/apply" className="user-dropdown-item">
                      <FileText size={14} /> 申请成为合伙人
                    </NavLink>
                  )}
                  {isAdmin && (
                    <NavLink to="/admin" className="user-dropdown-item">
                      <ShieldIcon size={14} /> 管理后台
                    </NavLink>
                  )}
                  {isBiographer && (
                    <NavLink to="/biographer" className="user-dropdown-item">
                      <PenLine size={14} /> 传记师工作台
                    </NavLink>
                  )}
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
      <GuideTour />
    </div>
  );
}
