import { useState, useEffect, useRef } from 'react';
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
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronDown,
  Share2,
  User,
  Bell as BellIcon,
  Shield as ShieldIcon,
  Database,
  Sparkles,
  Wand2,
  UserCheck,
  ClipboardList,
  ShoppingBag,
  TicketPercent,
  Building2,
  Gem,
} from 'lucide-react';
import Avatar from './ui/Avatar';
import { useAuth } from '../hooks/useAuth';
import { useVersion } from '../hooks/useVersion';
import GuideTour, { openGuide } from './GuideTour';
import AnnotationToggle from './annotation/AnnotationToggle';
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
const homeNavItem: NavItem = { to: '/home', icon: LayoutDashboard, label: '首页' };

// 「传记创作」组（V1.0 包含 AI智能采访、已有传记上传、AI传记生成、我的传记；「数字资产」仅完整版）
const creationGroupItemsV1: NavItem[] = [
  { to: '/interview', icon: Mic, label: 'AI智能采访' },
  { to: '/polish', icon: Wand2, label: '已有传记上传' },
  { to: '/biography', icon: BookOpen, label: 'AI传记生成' },
  { to: '/my-works', icon: BookMarked, label: '我的传记' },
];

const creationGroupItemsFull: NavItem[] = [
  ...creationGroupItemsV1,
  { to: '/digital-assets', icon: Gem, label: '数字资产' },
];

// 「人生记录」组（V1.0 仅保留人生档案；完整版额外包含老照片修复、数字博物馆、家庭空间、数字家谱、AI家风馆）
const lifeGroupItemsV1: NavItem[] = [
  { to: '/archive', icon: FolderOpen, label: '人生档案' },
];

const lifeGroupItemsFull: NavItem[] = [
  ...lifeGroupItemsV1,
  { to: '/photo-restore', icon: Wand2, label: '老照片修复' },
  { to: '/museum', icon: Building2, label: '数字博物馆' },
  { to: '/family', icon: Users, label: '家庭空间' },
  { to: '/genealogy', icon: GitFork, label: '数字家谱' },
  { to: '/family-hall', icon: Landmark, label: 'AI家风馆' },
];

// 「服务与商城」组（V1.0 包含传记书城、找传记师、传家商城、我的订单；「拼团活动」仅完整版）
const servicesGroupItemsV1: NavItem[] = [
  { to: '/biography-shelf', icon: BookMarked, label: '传记书城' },
  { to: '/biographers', icon: UserCheck, label: '找传记师' },
  { to: '/store', icon: ShoppingBag, label: '传家商城' },
  { to: '/my-orders', icon: ClipboardList, label: '我的订单' },
];

const servicesGroupItemsFull: NavItem[] = [
  { to: '/biography-shelf', icon: BookMarked, label: '传记书城' },
  { to: '/biographers', icon: UserCheck, label: '找传记师' },
  { to: '/group-buy', icon: TicketPercent, label: '拼团活动' },
  { to: '/store', icon: ShoppingBag, label: '传家商城' },
  { to: '/my-orders', icon: ClipboardList, label: '我的订单' },
];

// 「AI 数字人」组（仅完整版展示）
const digitalHumanGroupItemsFull: NavItem[] = [
  { to: '/digital-person', icon: UserCircle2, label: '数字人' },
  { to: '/digital-companion', icon: MessageCircleHeart, label: '数字陪伴' },
];

// 「系统设置」组（V1.0 包含账户信息、通知设置、隐私与安全、帮助与反馈；邀请/AI额度/家庭成员/存储备份仅完整版）
const settingsGroupItemsV1: NavItem[] = [
  { to: '/settings/account', icon: User, label: '账户信息' },
  { to: '/settings/notification', icon: BellIcon, label: '通知设置' },
  { to: '/settings/privacy', icon: ShieldIcon, label: '隐私与安全' },
  { to: '/settings/help', icon: HelpCircle, label: '帮助与反馈' },
];

const settingsGroupItemsFull: NavItem[] = [
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

interface NoticeItem {
  id: number;
  type: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

// 顶栏消息铃铛的 mock 通知数据
const initialNotices: NoticeItem[] = [
  { id: 1, type: '审核结果', title: '传记《我的父亲》审核通过', desc: '您的传记内容已通过平台审核，可前往「我的传记」查看。', time: '10 分钟前', read: false },
  { id: 2, type: '订单提醒', title: '实体书订单已发货', desc: '订单 CJ20260718001 已由顺丰发出，请注意查收。', time: '2 小时前', read: false },
  { id: 3, type: '订单提醒', title: '传记师服务预约成功', desc: '王雅琴传记师已确认您的采访预约，请保持电话畅通。', time: '昨天 18:30', read: false },
  { id: 4, type: '系统公告', title: '平台功能更新公告', desc: '数字博物馆分享功能上线，可为家人生成专属观展链接。', time: '3 天前', read: false },
  { id: 5, type: '审核结果', title: '家风故事修改提醒', desc: '您提交的家风故事需补充来源说明，请修改后重新提交。', time: '5 天前', read: true },
];

function getNavGroups(isV1: boolean): NavGroup[] {
  // V1.0 版：传记创作、人生记录、服务与商城、系统设置（家庭空间 V1.2、数字家谱/AI家风馆 V2.0、数字人 V3.0 不开放）
  if (isV1) {
    return [
      { key: 'creation', icon: BookOpen, label: '传记创作', items: creationGroupItemsV1 },
      { key: 'life', icon: FolderOpen, label: '人生记录', items: lifeGroupItemsV1 },
      { key: 'services', icon: ShoppingBag, label: '服务与商城', items: servicesGroupItemsV1 },
      { key: 'settings', icon: Settings, label: '系统设置', items: settingsGroupItemsV1 },
    ];
  }
  return [
    { key: 'creation', icon: BookOpen, label: '传记创作', items: creationGroupItemsFull },
    { key: 'life', icon: FolderOpen, label: '人生记录', items: lifeGroupItemsFull },
    { key: 'services', icon: ShoppingBag, label: '服务与商城', items: servicesGroupItemsFull },
    { key: 'digital-human', icon: UserCircle2, label: 'AI 数字人', items: digitalHumanGroupItemsFull },
    { key: 'settings', icon: Settings, label: '系统设置', items: settingsGroupItemsFull },
  ];
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { isV1 } = useVersion();
  const location = useLocation();
  const pathname = location.pathname;

  const navGroups = getNavGroups(isV1);

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

  const navigate = useNavigate();
  const displayName = user?.name || user?.phone || '用户';
  const [showUserMenu, setShowUserMenu] = useState(false);

  // 顶栏消息通知
  const [notices, setNotices] = useState(initialNotices);
  const [showNotices, setShowNotices] = useState(false);
  const noticeRef = useRef<HTMLDivElement>(null);
  const unreadCount = notices.filter((n) => !n.read).length;

  const markNoticeRead = (id: number) => {
    setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  useEffect(() => {
    if (!showNotices) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (noticeRef.current && !noticeRef.current.contains(e.target as Node)) {
        setShowNotices(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotices]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    setShowUserMenu(false);
    setShowNotices(false);
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

        <nav className="nav">
          <ul className="nav-list">
            <li className="nav-item">
              <NavLink
                to={homeNavItem.to}
                end
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <homeNavItem.icon className="nav-icon" size={18} />
                <span>{homeNavItem.label}</span>
              </NavLink>
            </li>

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
          <div className="topbar-actions">
            <div className="notice-wrap" ref={noticeRef}>
              <button className="icon-btn message-btn" title="消息" onClick={() => setShowNotices((v) => !v)}>
                <Bell size={18} />
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
              </button>
              {showNotices && (
                <div className="notice-panel">
                  <div className="notice-panel-header">
                    <span>消息通知</span>
                    <span className="notice-panel-count">{unreadCount} 条未读</span>
                  </div>
                  {notices.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={`notice-item ${n.read ? 'read' : ''}`}
                      onClick={() => markNoticeRead(n.id)}
                    >
                      <span className={`notice-dot ${n.read ? 'read' : ''}`} />
                      <div className="notice-item-body">
                        <div className="notice-item-title">{n.title}</div>
                        <div className="notice-item-desc">{n.desc}</div>
                        <div className="notice-item-meta">
                          <span className="notice-item-type">{n.type}</span>
                          <span>{n.time}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                  <NavLink to="/profile" className="user-dropdown-item">
                    <User size={14} /> 个人中心
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
      <GuideTour />
      <AnnotationToggle />
    </div>
  );
}
