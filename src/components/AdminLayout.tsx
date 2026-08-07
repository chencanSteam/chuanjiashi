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
  ChevronRight,
  ShoppingCart,
  Brain,
  BookOpen,
  LayoutDashboard,
  FolderOpen,
  PenLine,
  Package,
  TicketPercent,
  Bot,
  FileCheck,
  ShieldAlert,
  Settings,
  Briefcase,
  KeyRound,
} from 'lucide-react';
import Avatar from './ui/Avatar';
import { useAuth } from '../hooks/useAuth';
import { useVersion } from '../hooks/useVersion';
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

// 独立入口
const dashboardNavItem: NavItem = { to: '/admin/dashboard', icon: LayoutDashboard, label: '总览看板' };

const adminNavGroups: NavGroup[] = [
  {
    key: 'users',
    icon: Users,
    label: '用户与档案',
    items: [
      { to: '/admin/users', icon: Users, label: '用户管理' },
      { to: '/admin/archives', icon: FolderOpen, label: '人物档案管理' },
    ],
  },  {
    key: 'business',
    icon: Briefcase,
    label: '业务管理',
    items: [
      { to: '/admin/biographers', icon: PenLine, label: '传记师管理' },
      { to: '/admin/partners', icon: UserCheck, label: '合伙人管理' },
      { to: '/admin/partner-applications', icon: ClipboardList, label: '合伙人申请' },
      { to: '/admin/partner-customers', icon: Link2, label: '客户归属' },
      { to: '/admin/orders', icon: ShoppingCart, label: '订单管理' },
      { to: '/admin/products', icon: Package, label: '产品套餐管理' },
      { to: '/admin/group-buy', icon: TicketPercent, label: '拼团管理' },
    ],
  },
  {
    key: 'finance',
    icon: Wallet,
    label: '财务分润',
    items: [
      { to: '/admin/commission-records', icon: TrendingUp, label: '分润管理' },
      { to: '/admin/withdrawals', icon: Wallet, label: '提现审核' },
    ],
  },
  {
    key: 'content',
    icon: FileCheck,
    label: '内容与合规',
    items: [
      { to: '/admin/book-review', icon: BookOpen, label: '传记上架审核' },
      { to: '/admin/content-review', icon: FileCheck, label: '内容审核' },
      { to: '/admin/compliance', icon: ShieldAlert, label: '合规风控' },
    ],
  },
  {
    key: 'operations',
    icon: Settings,
    label: '运营与系统',
    items: [
      { to: '/admin/user-invites', icon: Share2, label: '用户邀请奖励' },
      { to: '/admin/ai-usage', icon: Brain, label: 'AI 使用情况' },
      { to: '/admin/ai-tasks', icon: Bot, label: 'AI任务管理' },
      { to: '/admin/settings', icon: Settings, label: '系统设置' },
    ],
  },
];

// MVP 版后台仅保留：用户与档案、AI任务、角色权限、消息通知
const adminNavGroupsMVP: NavGroup[] = [
  {
    key: 'users',
    icon: Users,
    label: '用户与档案',
    items: [
      { to: '/admin/users', icon: Users, label: '用户管理' },
      { to: '/admin/archives', icon: FolderOpen, label: '人物档案管理' },
    ],
  },
  {
    key: 'system',
    icon: Settings,
    label: '系统管理',
    items: [
      { to: '/admin/ai-tasks', icon: Bot, label: 'AI任务管理' },
      { to: '/admin/roles', icon: KeyRound, label: '角色权限' },
    ],
  },
];

function isGroupActive(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) => pathname.startsWith(item.to));
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { isMVP } = useVersion();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const displayName = user?.name || user?.phone || '管理员';
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navGroups = isMVP ? adminNavGroupsMVP : adminNavGroups;

  // 用户手动折叠/展开的覆盖值；未覆盖时默认展开当前路由所在分组
  const [expandedOverrides, setExpandedOverrides] = useState<Record<string, boolean>>({});

  const isExpanded = (group: NavGroup) =>
    expandedOverrides[group.key] ?? isGroupActive(group, pathname);

  const toggleGroup = (key: string) => {
    setExpandedOverrides((prev) => ({
      ...prev,
      [key]: !(prev[key] ?? navGroups.some((g) => g.key === key && isGroupActive(g, pathname))),
    }));
  };

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
            {!isMVP && (
              <li className="nav-item">
                <NavLink
                  to={dashboardNavItem.to}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <dashboardNavItem.icon className="nav-icon" size={18} />
                  <span>{dashboardNavItem.label}</span>
                </NavLink>
              </li>
            )}

            {navGroups.map((group) => (
              <li className={`nav-item nav-group ${isGroupActive(group, pathname) ? 'active' : ''}`} key={group.key}>
                <button
                  className="nav-group-header"
                  onClick={() => toggleGroup(group.key)}
                  type="button"
                >
                  <group.icon className="nav-icon" size={18} />
                  <span>{group.label}</span>
                  {isExpanded(group) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {isExpanded(group) && (
                  <ul className="nav-sub-list">
                    {group.items.map((item) => (
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
                  <NavLink to="/home" className="user-dropdown-item">
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
