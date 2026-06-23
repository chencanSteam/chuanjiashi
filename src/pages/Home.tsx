import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Mic,
  BookOpen,
  Users,
  UserCircle2,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';
import './Home.css';

const trendData = [
  { name: '04-24', 访谈: 420, 传记: 180, 档案: 120 },
  { name: '04-29', 访谈: 520, 传记: 220, 档案: 150 },
  { name: '05-04', 访谈: 480, 传记: 260, 档案: 180 },
  { name: '05-09', 访谈: 600, 传记: 300, 档案: 220 },
  { name: '05-14', 访谈: 580, 传记: 340, 档案: 260 },
  { name: '05-19', 访谈: 700, 传记: 380, 档案: 300 },
  { name: '05-24', 访谈: 740, 传记: 420, 档案: 340 },
];

const stats = [
  { label: '家庭用户数', value: '12,458', trend: '8.6%', path: '/family' },
  { label: '已生成传记', value: '186', trend: '12.3%', path: '/biography' },
  { label: '家庭档案数', value: '6,724', trend: '9.7%', path: '/archive' },
  { label: '数字亲人创建数', value: '243', trend: '11.2%', path: '/digital-person' },
];

const shortcuts = [
  { icon: Mic, label: 'AI智能采访', desc: '多模态问答采集', color: '#1B5E4B', path: '/interview' },
  { icon: BookOpen, label: 'AI传记生成', desc: 'AI生成传记', color: '#2D7A66', path: '/biography' },
  { icon: Users, label: '家庭空间', desc: '家庭空间协作', color: '#6B8E7B', path: '/family' },
  { icon: UserCircle2, label: '数字人格', desc: '数字亲人构建', color: '#C27BA0', path: '/digital-person' },
];

const todos = [
  { title: '待开始访谈', desc: '有 8 个访谈任务待开始', count: 8, path: '/interview' },
  { title: '待审核家风故事', desc: '有 6 个家风故事待审核', count: 6, path: '/family-hall' },
  { title: '待完善档案', desc: '有 12 份档案信息待完善', count: 12, path: '/archive' },
];

const activities = [
  { user: '张奶奶', action: '的故事《难忘的知青岁月》已生成传记', time: '2 小时前', type: '传记生成完成' },
  { user: '系统', action: '为照片《1980年全家福》进行了AI修复', time: '5 小时前', type: '图像修复完成' },
  { user: '李明远', action: '完成访谈任务《父亲的创业之路》', time: '1 天前', type: '访谈时长 68 分钟' },
  { user: '家风馆项目', action: '《忠厚传家久》已更新', time: '2 天前', type: '新增家风故事 3 篇' },
];

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="home-page">
      <header className="page-header">
        <h1 className="page-title">首页</h1>
      </header>

      <section className="home-hero">
        <div className="hero-copy">
          <h2>用 AI 记录人生故事，<br />传承家风温度</h2>
          <p>AI数字人生 · 家庭记忆沉淀 · 家风传承 · 数字陪伴</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => navigate('/interview')}><Mic size={16} /> 开始智能采访</button>
            <button className="btn btn-hero-secondary" onClick={() => navigate('/family')}><Users size={16} /> 进入家庭空间</button>
          </div>
        </div>
        <div className="hero-visual" aria-hidden>
          <svg viewBox="0 0 560 320" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e8f3ee" />
                <stop offset="100%" stopColor="#f6fbf9" />
              </linearGradient>
              <linearGradient id="mt1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b8d4ca" />
                <stop offset="100%" stopColor="#d8e8e2" />
              </linearGradient>
              <linearGradient id="mt2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8fbba9" />
                <stop offset="100%" stopColor="#b8d4ca" />
              </linearGradient>
              <linearGradient id="mt3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5e9a84" />
                <stop offset="100%" stopColor="#8fbba9" />
              </linearGradient>
            </defs>
            <rect width="560" height="320" fill="url(#sky)" />
            <path d="M0,320 L0,220 Q80,170 160,210 T320,190 T480,230 L560,250 L560,320 Z" fill="url(#mt1)" opacity="0.6" />
            <path d="M0,320 L0,250 Q120,200 240,250 T440,230 L560,270 L560,320 Z" fill="url(#mt2)" opacity="0.7" />
            <path d="M0,320 L0,290 Q140,250 280,290 T560,280 L560,320 Z" fill="url(#mt3)" opacity="0.8" />
            <g transform="translate(380, 175)" opacity="0.85">
              <path d="M0,40 L20,0 L40,40 Z" fill="#4a7c6b" />
              <rect x="5" y="40" width="30" height="22" rx="2" fill="#7aa897" />
              <rect x="18" y="48" width="6" height="14" fill="#d4e8e1" />
            </g>
            <g transform="translate(180, 245)" opacity="0.9">
              <circle cx="12" cy="12" r="6" fill="#4a7c6b" />
              <rect x="10" y="18" width="4" height="18" fill="#4a7c6b" />
              <path d="M2,36 Q12,20 22,36" stroke="#4a7c6b" strokeWidth="2" fill="none" />
            </g>
            <g transform="translate(220, 235)" opacity="0.9">
              <circle cx="16" cy="10" r="7" fill="#4a7c6b" />
              <rect x="13" y="17" width="6" height="24" fill="#4a7c6b" />
              <circle cx="32" cy="16" r="5" fill="#7aa897" />
              <rect x="30" y="21" width="4" height="20" fill="#7aa897" />
              <path d="M8,41 Q24,28 40,41" stroke="#4a7c6b" strokeWidth="2" fill="none" />
            </g>
            <g transform="translate(100, 250)" opacity="0.7">
              <circle cx="0" cy="20" r="2" fill="#5e9a84" />
              <circle cx="8" cy="14" r="2.5" fill="#5e9a84" />
              <circle cx="16" cy="22" r="2" fill="#5e9a84" />
              <path d="M0,20 Q8,6 16,22" stroke="#5e9a84" strokeWidth="1.5" fill="none" />
            </g>
          </svg>
        </div>
      </section>

      <section className="stats-strip">
        {stats.map((s, i) => (
          <div className="stat-item" key={i} onClick={() => s.path && navigate(s.path)}>
            <div className="stat-item-value">{s.value}</div>
            <div className="stat-item-label">{s.label}</div>
            <div className="stat-item-trend">较上月 <ChevronRight size={10} className="trend-up" /> {s.trend}</div>
          </div>
        ))}
      </section>

      <section className="workspace">
        <div className="surface chart-surface">
          <div className="surface-header">
            <h3>平台使用趋势</h3>
            <select className="surface-select">
              <option>近30天</option>
            </select>
          </div>
          <div className="chart-legend">
            <span><span className="dot" style={{ background: '#1B5E4B' }} /> 访谈次数</span>
            <span><span className="dot" style={{ background: '#2D7A66' }} /> 传记生成次数</span>
            <span><span className="dot" style={{ background: '#D4A373' }} /> 档案新增数</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="c1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1B5E4B" stopOpacity={0.2}/><stop offset="95%" stopColor="#1B5E4B" stopOpacity={0}/></linearGradient>
                <linearGradient id="c2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2D7A66" stopOpacity={0.2}/><stop offset="95%" stopColor="#2D7A66" stopOpacity={0}/></linearGradient>
                <linearGradient id="c3" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D4A373" stopOpacity={0.2}/><stop offset="95%" stopColor="#D4A373" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f2f1" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e8ecea' }} />
              <Area type="monotone" dataKey="访谈" stroke="#1B5E4B" strokeWidth={2} fill="url(#c1)" />
              <Area type="monotone" dataKey="传记" stroke="#2D7A66" strokeWidth={2} fill="url(#c2)" />
              <Area type="monotone" dataKey="档案" stroke="#D4A373" strokeWidth={2} fill="url(#c3)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="surface todo-surface">
          <div className="surface-header">
            <h3>待办事项</h3>
            <button className="btn btn-ghost" onClick={() => navigate('/interview')}>查看全部</button>
          </div>
          <div className="todo-list">
            {todos.map((t, i) => (
              <div className="todo-row" key={i} onClick={() => t.path && navigate(t.path)}>
                <div className="todo-main">
                  <div className="todo-title">{t.title}</div>
                  <div className="todo-desc">{t.desc}</div>
                </div>
                <div className="todo-count">{t.count}</div>
                <ChevronRight size={16} className="todo-arrow" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="quick-actions">
        {shortcuts.map((s, i) => (
          <button className="quick-action" key={i} onClick={() => navigate(s.path)}>
            <div className="quick-action-icon" style={{ color: s.color }}>
              <s.icon size={22} />
            </div>
            <div className="quick-action-main">
              <div className="quick-action-label">{s.label}</div>
              <div className="quick-action-desc">{s.desc}</div>
            </div>
            <ArrowRight size={16} className="quick-action-arrow" />
          </button>
        ))}
      </section>

      <section className="overview">
        <div className="surface activity-surface">
          <div className="surface-header">
            <h3>最近动态</h3>
            <button className="btn btn-ghost" onClick={() => navigate('/family/events')}>查看全部</button>
          </div>
          <div className="activity-list">
            {activities.map((a, i) => (
              <div className="activity-row" key={i}>
                {a.user === '系统' ? <div className="activity-avatar system">系</div> : <Avatar name={a.user} size={38} />}
                <div className="activity-main">
                  <div className="activity-title"><strong>{a.user}</strong> {a.action}</div>
                  <div className="activity-meta">{a.type} · {a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
