import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Mic,
  BookOpen,
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
  ChevronDown,
} from 'lucide-react';
import Avatar from './ui/Avatar';
import './Layout.css';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '首页' },
  { to: '/interview', icon: Mic, label: 'AI智能采访' },
  { to: '/biography', icon: BookOpen, label: 'AI传记生成' },
  { to: '/archive', icon: FolderOpen, label: '人生档案' },
  { to: '/family', icon: Users, label: '家庭空间' },
  { to: '/genealogy', icon: GitFork, label: '数字家谱' },
  { to: '/family-hall', icon: Landmark, label: 'AI家风馆' },
  { to: '/digital-person', icon: UserCircle2, label: '数字人格' },
  { to: '/digital-companion', icon: MessageCircleHeart, label: '数字陪伴' },
  { to: '/government', icon: Building2, label: '政务客户服务' },
  { to: '/settings', icon: Settings, label: '系统设置' },
];

export default function Layout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            <svg viewBox="0 0 40 40" width="40" height="40">
              <circle cx="20" cy="20" r="18" fill="#1B5E4B" />
              <text x="20" y="26" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="700">传</text>
            </svg>
          </div>
          <div>
            <div className="brand-title">传家世</div>
            <div className="brand-subtitle">AI数字人生与家风传承平台</div>
          </div>
        </div>

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
              <Avatar name="张明远" size={32} />
              <div className="user-info">
                <span className="user-name">张明远</span>
                <span className="user-role">家庭管理员</span>
              </div>
              <ChevronDown size={14} className="user-chevron" />
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
