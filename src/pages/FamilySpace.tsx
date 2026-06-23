import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Search,
  Users,
  BookOpen,
  Image,
  Clock,
  Calendar,
  Bell,
  Edit3,
  Baby,
  Maximize2,
  GraduationCap,
  Stethoscope,
  Music,
  Landmark,
  ArrowRight,
  Heart,
  Plus,
  X,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { useToast } from '../hooks/useToast';
import { generateImageDataUrl } from '../utils/mediaPlaceholder';
import './FamilySpace.css';

const tabs = [
  { key: 'space', label: '家庭空间' },
  { key: 'tree', label: '数字家谱' },
  { key: 'album', label: '家庭相册' },
  { key: 'story', label: '家庭故事共创' },
  { key: 'child', label: '亲子成长档案' },
  { key: 'memorial', label: '家庭数字纪念馆' },
  { key: 'inherit', label: '档案接管与继承' },
];

const members = [
  { name: '张明远', role: '我', tag: '家主', gen: '第1代' },
  { name: '李婉如', role: '配偶', tag: '', gen: '第1代' },
  { name: '张子涵', role: '长子', tag: '', gen: '第2代' },
  { name: '张若曦', role: '儿媳', tag: '', gen: '第2代' },
  { name: '张浩然', role: '孙子', tag: '', gen: '第3代' },
];

const treeData = [
  { gen: '第1代', members: [{ name: '张志远', years: '1920-1998' }, { name: '王淑兰', years: '1923-2001' }] },
  { gen: '第2代', members: [{ name: '张建国', years: '1948-' }, { name: '李秀英', years: '1950-' }, { name: '张建军', years: '1952-' }, { name: '刘芳', years: '1955-' }] },
  { gen: '第3代', members: [{ name: '张明远', years: '1975-' }, { name: '李婉如', years: '1978-' }, { name: '张伟', years: '1979-' }, { name: '陈静', years: '1981-' }] },
  { gen: '第4代', members: [{ name: '张子涵', years: '2003-' }, { name: '张若曦', years: '2006-' }, { name: '张浩然', years: '2009-' }] },
  { gen: '第5代', members: [{ name: '张小宝', years: '2028-' }, { name: '李小贝', years: '2030-' }] },
];

const treeTotal = treeData.reduce((sum, g) => sum + g.members.length, 0);

const albums = [
  { title: '2024春游记', count: '128张' },
  { title: '春节团圆', count: '96张' },
  { title: '成长记录', count: '312张' },
  { title: '家族聚会', count: '85张' },
  { title: '旅行足迹', count: '156张' },
  { title: '更多相册', count: '23个' },
];

const initialStories = [
  { title: '爷爷的记忆：从教40年', tag: '家庭教育', author: '张明远', views: 128, likes: 18 },
  { title: '我的大学时光', tag: '成长故事', author: '张子涵', views: 96, likes: 12 },
  { title: '奶奶的拿手菜', tag: '生活故事', author: '李婉如', views: 156, likes: 23 },
];

const storyPageData = [
  { title: '爷爷的记忆：从教40年', tag: '家庭教育', author: '张明远', date: '2 天前', views: 128, likes: 18 },
  { title: '我的大学时光', tag: '成长故事', author: '张子涵', date: '3 天前', views: 96, likes: 12 },
  { title: '奶奶的拿手菜', tag: '生活故事', author: '李婉如', date: '5 天前', views: 156, likes: 23 },
  { title: '父亲的创业之路', tag: '创业历程', author: '张建国', date: '1 周前', views: 210, likes: 34 },
  { title: '家谱里的家风家训', tag: '家风家训', author: '张明远', date: '2 周前', views: 178, likes: 29 },
];

const notices = [
  { title: '关于家族聚会的通知', time: '2小时前' },
  { title: '更新了家谱资料：张志远', time: '昨天' },
  { title: '新增相册《2024春游记》', time: '2天前' },
];

const events = [
  { title: '家族聚会', date: '5月20日（周一）10:00', loc: '苏州市中心公园', status: '进行中' },
  { title: '清明祭祖', date: '4月4日（周四）09:00', loc: '家族祠堂', status: '已结束' },
];

const initialCalendarEvents = [
  { day: 5, title: '家族会议', type: '聚会' },
  { day: 12, title: '母亲节', type: '节日' },
  { day: 15, title: '爷爷生日', type: '生日' },
  { day: 20, title: '家族聚会', type: '聚会' },
  { day: 25, title: '结婚纪念日', type: '纪念日' },
];

const calTypes = ['聚会', '节日', '生日', '纪念日', '其他'];

const storyFilters = ['最新故事', '我参与的', '我收藏的'];
const storyPageFilters = ['全部', '最新故事', '我参与的', '我收藏的', '家风家训', '创业历程'];
const albumCategories = ['全部', '春节团圆', '旅行足迹', '成长记录', '家族聚会', '老照片'];

export default function FamilySpace() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('space');
  const [treeMode, setTreeMode] = useState<'tree' | 'list'>('tree');
  const [selectedDay, setSelectedDay] = useState(15);
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 4, 1));
  const [calendarEventList, setCalendarEventList] = useState(initialCalendarEvents);
  const [showCalForm, setShowCalForm] = useState(false);
  const [newCalTitle, setNewCalTitle] = useState('');
  const [newCalDay, setNewCalDay] = useState('');
  const [newCalType, setNewCalType] = useState('聚会');
  const [storyFilter, setStoryFilter] = useState('最新故事');
  const [storyPageFilter, setStoryPageFilter] = useState('全部');
  const [albumCategory, setAlbumCategory] = useState('全部');
  const [photoPreview, setPhotoPreview] = useState<{ title: string } | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [stories, setStories] = useState(initialStories);
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set());
  const [showStoryInput, setShowStoryInput] = useState(false);
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [storyList, setStoryList] = useState(storyPageData);

  const filteredMembers = members.filter((m) => m.name.includes(memberSearch));

  const filteredStories = stories.filter((s) => {
    if (storyFilter === '我参与的') return s.author === '张明远' || s.author === '我';
    if (storyFilter === '我收藏的') return likedStories.has(s.title);
    return true;
  });

  const filteredStoryPage = storyList.filter((s) => {
    if (storyPageFilter === '全部') return true;
    if (storyPageFilter === '家风家训') return s.tag === '家风家训';
    if (storyPageFilter === '创业历程') return s.tag === '创业历程';
    if (storyPageFilter === '我参与的') return s.author === '张明远' || s.author === '我';
    if (storyPageFilter === '我收藏的') return likedStories.has(s.title);
    return true;
  });

  const filteredAlbums = albumCategory === '全部'
    ? albums
    : albums.filter((a) => a.title.includes(albumCategory) || (albumCategory === '老照片' && a.title.includes('更多')));

  const monthLabel = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`;
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const startOffset = (() => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    return d === 0 ? 6 : d - 1;
  })();

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDay(1);
    addToast('上个月', 'info');
  };
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDay(1);
    addToast('下个月', 'info');
  };
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      addToast('全屏切换失败', 'error');
    }
  };

  const likeStory = (title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedStories((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
        addToast('已取消收藏', 'info');
      } else {
        next.add(title);
        addToast('已收藏故事', 'success');
      }
      return next;
    });
  };

  const createStory = () => {
    const title = newStoryTitle.trim();
    if (!title) {
      addToast('请输入故事标题', 'error');
      return;
    }
    const story = { title, tag: '家庭故事', author: '我', views: 0, likes: 0, date: '刚刚' };
    setStoryList((prev) => [story, ...prev]);
    setStories((prev) => [story, ...prev]);
    setNewStoryTitle('');
    setShowStoryInput(false);
    addToast('新故事已创建', 'success');
  };

  return (
    <div className="family-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">家庭空间</h1>
        </div>
      </header>

      <div className="tabs">
        {tabs.map((t) => (
          <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'space' && (
        <>
          <div className="family-hero-row">
            <div className="card family-card">
              <div className="card-body family-body">
                <div className="family-info">
                  <div className="family-badge">张</div>
                  <div>
                    <div className="family-name">张氏家庭空间</div>
                    <div className="family-motto" onClick={() => navigate('/family/motto')}>家训：忠厚传家远，诗书继世长 <Edit3 size={12} /></div>
                    <div className="family-meta">
                      <span>创建时间<br /><strong>2018-05-20</strong></span>
                      <span>创建者<br /><strong>张明远</strong></span>
                      <span>成员规模<br /><strong>32人</strong></span>
                      <span>家族代数<br /><strong>5代</strong></span>
                      <span>现居地<br /><strong>江苏省苏州市</strong></span>
                    </div>
                  </div>
                </div>
                <div className="family-art" />
              </div>
            </div>

            <div className="card stats-wide">
              <div className="card-body stats-wide-body">
                {[
                  { label: '家庭成员数', value: '32人', trend: '4', path: '/family/members' },
                  { label: '家庭故事数', value: `${stories.length}篇`, trend: '12', path: '/family/stories' },
                  { label: '相册照片数', value: '1,268张', trend: '128', path: '/family/albums' },
                  { label: '家族分支数', value: '8个', trend: '1', path: '/family/relations' },
                  { label: '近期活动数', value: '5场', trend: '2', path: '/family/events' },
                ].map((s, i) => (
                  <div className="wide-stat" key={i} onClick={() => navigate(s.path)}>
                    <div className="wide-label">{s.label}</div>
                    <div className="wide-value">{s.value}</div>
                    <div className="wide-trend">较上月 <ChevronRight size={10} className="trend-up" /> {s.trend}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="family-grid">
            <div className="card member-card">
              <div className="card-header">
                <h3 className="card-title">家庭成员（{filteredMembers.length}人）</h3>
                <button className="btn btn-ghost" onClick={() => navigate('/family/members')}>查看全部 <ChevronRight size={14} /></button>
              </div>
              <div className="card-body">
                <div className="member-search">
                  <Search size={14} />
                  <input type="text" placeholder="搜索成员姓名" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
                </div>
                <div className="member-list">
                  {filteredMembers.map((m, i) => (
                    <div className="member-item" key={i} onClick={() => navigate(`/family/members/${encodeURIComponent(m.name)}`)}>
                      <Avatar name={m.name} size={38} />
                      <div className="member-info">
                        <div className="member-name">{m.name} <span className="member-role">（{m.role}）</span>{m.tag && <span className="member-tag">{m.tag}</span>}</div>
                        <div className="member-gen">{m.gen}</div>
                      </div>
                      <button className="member-data-btn" onClick={(e) => { e.stopPropagation(); navigate(`/family/members/${encodeURIComponent(m.name)}`); }}>资料</button>
                    </div>
                  ))}
                </div>
                <div className="member-actions">
                  <button className="member-action" onClick={() => navigate('/family/members')}><Users size={14} /> 家庭成员资料</button>
                  <button className="member-action" onClick={() => navigate('/family/relations')}><Clock size={14} /> 关系维护</button>
                  <button className="member-action" onClick={() => navigate('/family/roles')}><BookOpen size={14} /> 角色权限</button>
                </div>
              </div>
            </div>

            <div className="card tree-card">
              <div className="card-header">
                <h3 className="card-title">家谱树 <span>（五代同堂）</span></h3>
                <div className="tree-modes">
                  <button className={`tree-mode ${treeMode === 'tree' ? 'active' : ''}`} onClick={() => setTreeMode('tree')}>树状图</button>
                  <button className={`tree-mode ${treeMode === 'list' ? 'active' : ''}`} onClick={() => setTreeMode('list')}>列表图</button>
                  <button className="tree-mode" onClick={toggleFullscreen}><Maximize2 size={12} /> 全屏查看</button>
                </div>
              </div>
              <div className="card-body tree-body">
                {treeMode === 'tree' ? (
                  <>
                    {treeData.map((gen, i) => (
                      <div className="tree-gen" key={i}>
                        <div className="tree-gen-label">{gen.gen}</div>
                        <div className="tree-gen-members">
                          {gen.members.map((m, j) => (
                            <div className="tree-member" key={j} onClick={() => navigate(`/family/members/${encodeURIComponent(m.name)}`)}>
                              <Avatar name={m.name} size={44} />
                              <div className="tree-member-name">{m.name}</div>
                              <div className="tree-member-years">{m.years}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="tree-legend">
                      <span><span className="dot male" />男</span>
                      <span><span className="dot female" />女</span>
                      <span><span className="dot deceased" />已故</span>
                      <span><span className="dot missing" />未录入</span>
                    </div>
                    <div className="tree-count">共{treeData.length}代{treeTotal}人</div>
                  </>
                ) : (
                  <table className="genealogy-table">
                    <thead><tr><th>代数</th><th>姓名</th><th>生卒年</th></tr></thead>
                    <tbody>
                      {treeData.flatMap((gen) => gen.members.map((m, idx) => (
                        <tr key={`${gen.gen}-${idx}`} onClick={() => navigate(`/family/members/${encodeURIComponent(m.name)}`)}>
                          <td>{gen.gen}</td>
                          <td><Avatar name={m.name} size={28} /><span>{m.name}</span></td>
                          <td>{m.years}</td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="family-right">
              <div className="card calendar-card">
                <div className="card-header">
                  <h3 className="card-title">家庭日历</h3>
                  <button className="btn btn-ghost" onClick={() => navigate('/family/calendar')}>查看全部 <ChevronRight size={14} /></button>
                </div>
                <div className="card-body">
                  <div className="calendar-header">
                    <ChevronRight size={14} className="cal-arrow left" onClick={prevMonth} /> <span>{monthLabel}</span> <ChevronRight size={14} className="cal-arrow" onClick={nextMonth} />
                  </div>
                  <div className="calendar-grid">
                    {['一','二','三','四','五','六','日'].map((d) => <div className="cal-weekday" key={d}>{d}</div>)}
                    {Array.from({ length: startOffset }).map((_, i) => <div className="cal-day empty" key={`empty-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const ev = calendarEventList.find((e) => e.day === day);
                      return (
                        <div
                          className={`cal-day ${selectedDay === day ? 'active' : ''} ${ev ? 'has-event' : ''}`}
                          key={i}
                          onClick={() => {
                            setSelectedDay(day);
                            if (ev) addToast(`${day}日：${ev.title}`, 'info');
                          }}
                        >
                          <span>{day}</span>
                          {ev && <span className="cal-dot" title={ev.title} />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="calendar-events">
                    {calendarEventList.map((e, i) => (
                      <div className={`cal-event ${selectedDay === e.day ? 'active' : ''}`} key={i} onClick={() => setSelectedDay(e.day)}>
                        <span className="cal-event-dot" />
                        <span className="cal-event-day">{e.day}日</span>
                        <span className="cal-event-title">{e.title}</span>
                        <span className="cal-event-type">{e.type}</span>
                        <button
                          className="cal-event-del"
                          onClick={(evt) => {
                            evt.stopPropagation();
                            setCalendarEventList((prev) => prev.filter((_, idx) => idx !== i));
                            addToast('已删除日程', 'info');
                          }}
                          title="删除"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {!showCalForm ? (
                    <button className="btn btn-outline cal-add-btn" onClick={() => setShowCalForm(true)}><Plus size={14} /> 添加日程</button>
                  ) : (
                    <form
                      className="cal-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const day = parseInt(newCalDay, 10);
                        if (!newCalTitle.trim() || Number.isNaN(day) || day < 1 || day > 31) {
                          addToast('请填写 1-31 的日期和日程标题', 'error');
                          return;
                        }
                        setCalendarEventList((prev) => [...prev, { day, title: newCalTitle.trim(), type: newCalType }].sort((a, b) => a.day - b.day));
                        setNewCalTitle('');
                        setNewCalDay('');
                        setNewCalType('聚会');
                        setShowCalForm(false);
                        addToast('日程已添加', 'success');
                      }}
                    >
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={newCalDay}
                        onChange={(e) => setNewCalDay(e.target.value)}
                        placeholder="日期"
                        className="cal-input cal-input-day"
                        required
                      />
                      <input
                        type="text"
                        value={newCalTitle}
                        onChange={(e) => setNewCalTitle(e.target.value)}
                        placeholder="日程标题"
                        className="cal-input"
                        required
                      />
                      <select
                        value={newCalType}
                        onChange={(e) => setNewCalType(e.target.value)}
                        className="cal-input cal-input-select"
                      >
                        {calTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <div className="cal-form-actions">
                        <button type="submit" className="btn btn-primary">保存</button>
                        <button type="button" className="btn btn-ghost" onClick={() => setShowCalForm(false)}>取消</button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              <div className="card events-card">
                <div className="card-header">
                  <h3 className="card-title">活动提醒</h3>
                  <button className="btn btn-ghost" onClick={() => navigate('/family/events')}>查看全部 <ChevronRight size={14} /></button>
                </div>
                <div className="card-body">
                  {events.map((e, i) => (
                    <div className="event-item" key={i} onClick={() => navigate(`/family/event/${encodeURIComponent(e.title)}`)}>
                      <div className="event-icon"><Calendar size={16} /></div>
                      <div className="event-main">
                        <div className="event-title">{e.title}</div>
                        <div className="event-meta">{e.date}<br />{e.loc}</div>
                      </div>
                      <span className={`event-status ${e.status === '进行中' ? 'active' : ''}`}>{e.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card notice-card">
                <div className="card-header">
                  <h3 className="card-title">家庭通知</h3>
                  <button className="btn btn-ghost" onClick={() => navigate('/family/notice/0')}>查看全部 <ChevronRight size={14} /></button>
                </div>
                <div className="card-body">
                  {notices.map((n, i) => (
                    <div className="notice-item" key={i} onClick={() => navigate(`/family/notice/${i}`)}>
                      <Bell size={14} />
                      <div className="notice-main">
                        <div className="notice-title">{n.title}</div>
                        <div className="notice-time">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card relation-chart-card">
                <div className="card-header">
                  <h3 className="card-title">家庭关系图</h3>
                  <button className="btn btn-ghost" onClick={() => navigate('/family/relations')}>查看全部 <ChevronRight size={14} /></button>
                </div>
                <div className="card-body relation-chart-body">
                  <div className="donut">
                    <div className="donut-inner">32人<br /><span>总关系</span></div>
                  </div>
                  <div className="donut-legend">
                    <span><span className="dot green" /> 直系亲属 12人 37.5%</span>
                    <span><span className="dot teal" /> 旁系亲属 15人 46.9%</span>
                    <span><span className="dot orange" /> 姻亲关系 5人 15.6%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="family-bottom">
            <div className="card album-card">
              <div className="card-header">
                <h3 className="card-title">家庭相册</h3>
                <button className="btn btn-ghost" onClick={() => navigate('/family/albums')}>查看全部 <ChevronRight size={14} /></button>
              </div>
              <div className="card-body album-grid">
                {filteredAlbums.map((a, i) => (
                  <div className="album-thumb" key={i} onClick={() => navigate(`/family/album/${encodeURIComponent(a.title)}`)}>
                    <div className="album-img"><Image size={24} /></div>
                    <div className="album-title">{a.title}</div>
                    <div className="album-count">{a.count}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card story-card">
              <div className="card-header">
                <h3 className="card-title">家庭故事共创</h3>
                <button className="btn btn-ghost" onClick={() => navigate('/family/stories')}>查看全部 <ChevronRight size={14} /></button>
              </div>
              <div className="card-body story-tabs">
                <div className="story-filter">
                  {storyFilters.map((f) => (
                    <span key={f} className={storyFilter === f ? 'active' : ''} onClick={() => setStoryFilter(f)}>{f}</span>
                  ))}
                </div>
                {filteredStories.map((s, i) => (
                  <div className="story-row" key={i} onClick={() => navigate(`/family/story/${encodeURIComponent(s.title)}`)}>
                    <div className="story-title">{s.title}</div>
                    <span className="story-tag">{s.tag}</span>
                    <div className="story-author">{s.author} · 发布于 {i + 2} 天前</div>
                    <div className="story-stats">
                      <span>👁 {s.views}</span>
                      <span className={likedStories.has(s.title) ? 'liked' : ''} onClick={(e) => likeStory(s.title, e)}><Heart size={12} className="story-heart" /> {s.likes + (likedStories.has(s.title) ? 1 : 0)}</span>
                    </div>
                  </div>
                ))}
                <button className="create-story" onClick={() => setActiveTab('story')}>+ 创建新故事</button>
              </div>
            </div>

            <div className="card child-card">
              <div className="card-header">
                <h3 className="card-title">亲子成长档案</h3>
                <button className="btn btn-ghost" onClick={() => navigate('/family/child')}>查看全部 <ChevronRight size={14} /></button>
              </div>
              <div className="card-body child-body">
                <div className="child-profile">
                  <Avatar name="张子涵" size={50} />
                  <div>
                    <div className="child-name">张子涵</div>
                    <div className="child-meta">2003年5月12日出生 · 21岁</div>
                  </div>
                </div>
                <div className="child-stats">
                  <div><span>身高</span><strong>178cm</strong></div>
                  <div><span>体重</span><strong>68kg</strong></div>
                  <div><span>星座</span><strong>金牛座</strong></div>
                </div>
                <div className="child-cats">
                  {[
                    { label: '成长记录', key: 'growth', Icon: Baby },
                    { label: '学习档案', key: 'study', Icon: GraduationCap },
                    { label: '健康档案', key: 'health', Icon: Stethoscope },
                    { label: '兴趣特长', key: 'hobby', Icon: Music },
                  ].map(({ label, key, Icon }) => (
                    <span key={label} onClick={() => navigate(`/family/child/${key}`)}><Icon size={12} /> {label}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="card memorial-card">
              <div className="card-header">
                <h3 className="card-title">家庭数字纪念馆</h3>
              </div>
              <div className="card-body memorial-body">
                <div className="memorial-text">珍藏家族记忆，传承家族精神</div>
                <div className="memorial-art"><Landmark size={40} color="#1B5E4B" /></div>
                <button className="btn btn-primary memorial-btn" onClick={() => navigate('/family/memorial/张志远')}><ArrowRight size={14} /> 进入纪念馆</button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'tree' && (
        <div className="card genealogy-table-card">
          <div className="card-header">
            <h3 className="card-title">数字家谱 · 五代同堂</h3>
            <div className="tree-modes">
              <button className={`tree-mode ${treeMode === 'tree' ? 'active' : ''}`} onClick={() => setTreeMode('tree')}>树状图</button>
              <button className={`tree-mode ${treeMode === 'list' ? 'active' : ''}`} onClick={() => setTreeMode('list')}>列表图</button>
              <button className="tree-mode" onClick={toggleFullscreen}><Maximize2 size={12} /> 全屏查看</button>
            </div>
          </div>
          <div className="card-body genealogy-table-body">
            {treeMode === 'tree' ? (
              <div className="tree-body" style={{ gap: 18 }}>
                {treeData.map((gen, i) => (
                  <div className="tree-gen" key={i}>
                    <div className="tree-gen-label">{gen.gen}</div>
                    <div className="tree-gen-members">
                      {gen.members.map((m, j) => (
                        <div className="tree-member" key={j} onClick={() => navigate(`/family/members/${encodeURIComponent(m.name)}`)}>
                          <Avatar name={m.name} size={44} />
                          <div className="tree-member-name">{m.name}</div>
                          <div className="tree-member-years">{m.years}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <table className="genealogy-table">
                <thead><tr><th>代数</th><th>姓名</th><th>关系</th><th>生卒年</th><th>状态</th></tr></thead>
                <tbody>
                  {[
                    ['第1代', '张志远', '家族始祖', '1920-1998', '已故'],
                    ['第1代', '王淑兰', '家族始祖配偶', '1923-2001', '已故'],
                    ['第2代', '张建国', '长子', '1948-', '健在'],
                    ['第2代', '李秀英', '长媳', '1950-', '健在'],
                    ['第2代', '张建军', '次子', '1952-', '健在'],
                    ['第3代', '张明远', '孙子', '1975-', '健在'],
                    ['第3代', '李婉如', '孙媳', '1978-', '健在'],
                    ['第4代', '张子涵', '曾孙', '2003-', '健在'],
                    ['第4代', '张浩然', '曾孙', '2009-', '健在'],
                  ].map((row, i) => (
                    <tr key={i} onClick={() => navigate(`/family/members/${encodeURIComponent(row[1])}`)}>
                      <td>{row[0]}</td><td><Avatar name={row[1]} size={28} /><span>{row[1]}</span></td><td>{row[2]}</td><td>{row[3]}</td><td><span className={`status-tag ${row[4] === '已故' ? 'deceased' : ''}`}>{row[4]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'album' && (
        <div className="card album-page-card">
          <div className="card-header">
            <h3 className="card-title">家庭相册</h3>
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              <Image size={14} /> 上传照片
              <input type="file" accept="image/*" hidden onChange={() => addToast('照片上传成功', 'success')} />
            </label>
          </div>
          <div className="card-body album-page-body">
            <div className="album-cats">
              {albumCategories.map((c) => (
                <button className={`album-cat ${albumCategory === c ? 'active' : ''}`} key={c} onClick={() => setAlbumCategory(c)}>{c}</button>
              ))}
            </div>
            <div className="album-photo-grid">
              {Array.from({ length: albumCategory === '全部' ? 12 : 6 }).map((_, i) => (
                <div className="album-photo" key={i} onClick={() => setPhotoPreview({ title: `${albumCategory === '全部' ? '家庭影像' : albumCategory} 第 ${i + 1} 张` })}>
                  <div className="album-photo-thumb"><Image size={24} /></div>
                  <div className="album-photo-title">{albumCategory === '全部' ? '家庭影像' : albumCategory} {i + 1}</div>
                  <div className="album-photo-date">2024-0{(i % 6) + 1}-{(i % 28) + 1}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {photoPreview && (
        <div className="modal-overlay" onClick={() => setPhotoPreview(null)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>{photoPreview.title}</h4><button className="modal-close" onClick={() => setPhotoPreview(null)}><X size={16} /></button></div>
            <div className="modal-body preview-body">
              <img className="preview-image" src={generateImageDataUrl(photoPreview.title)} alt={photoPreview.title} />
              <p>正在预览：{photoPreview.title}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'story' && (
        <div className="card story-page-card">
          <div className="card-header">
            <h3 className="card-title">家庭故事共创</h3>
            {!showStoryInput && <button className="btn btn-primary" onClick={() => setShowStoryInput(true)}>+ 创建新故事</button>}
          </div>
          <div className="card-body story-page-body">
            {showStoryInput && (
              <div className="story-add-row">
                <input type="text" placeholder="输入故事标题" value={newStoryTitle} onChange={(e) => setNewStoryTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createStory()} autoFocus />
                <button className="btn btn-primary" onClick={createStory}>发布</button>
                <button className="btn btn-ghost" onClick={() => { setShowStoryInput(false); setNewStoryTitle(''); }}>取消</button>
              </div>
            )}
            <div className="story-page-filter">
              {storyPageFilters.map((f) => (
                <button className={storyPageFilter === f ? 'active' : ''} key={f} onClick={() => setStoryPageFilter(f)}>{f}</button>
              ))}
            </div>
            {filteredStoryPage.map((s, i) => (
              <div className="story-page-row" key={i} onClick={() => navigate(`/family/story/${encodeURIComponent(s.title)}`)}>
                <div className="story-page-main">
                  <div className="story-page-title">{s.title} <span className="story-tag">{s.tag}</span></div>
                  <div className="story-page-meta">{s.author} · {s.date} · 👁 {s.views} · ♥ {s.likes + (likedStories.has(s.title) ? 1 : 0)}</div>
                </div>
                <button className="btn btn-outline" onClick={(e) => { e.stopPropagation(); navigate(`/family/story/${encodeURIComponent(s.title)}`); }}>阅读</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'child' && (
        <div className="card child-page-card">
          <div className="card-header"><h3 className="card-title">亲子成长档案</h3></div>
          <div className="card-body child-page-body">
            {['张子涵', '张若曦', '张浩然'].map((name, i) => (
              <div className="child-page-item" key={i}>
                <div className="child-page-profile">
                  <Avatar name={name} size={60} />
                  <div>
                    <div className="child-page-name">{name}</div>
                    <div className="child-page-meta">{2003 + i * 3}年5月12日出生 · {21 - i * 3}岁</div>
                  </div>
                </div>
                <div className="child-page-cats">
                  {[
                    { label: '成长记录', key: 'growth', Icon: Baby },
                    { label: '学习档案', key: 'study', Icon: GraduationCap },
                    { label: '健康档案', key: 'health', Icon: Stethoscope },
                    { label: '兴趣特长', key: 'hobby', Icon: Music },
                  ].map(({ label, key, Icon }) => (
                    <span key={label} onClick={() => navigate(`/family/child/${key}`)}><Icon size={14} /> {label}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'memorial' && (
        <div className="card memorial-page-card">
          <div className="card-header"><h3 className="card-title">家庭数字纪念馆</h3><button className="btn btn-primary" onClick={() => navigate('/family/memorial/张志远')}><Landmark size={14} /> 进入纪念馆</button></div>
          <div className="card-body memorial-page-body">
            <div className="memorial-intro">珍藏家族记忆，传承家族精神。为逝去的亲人建立数字纪念馆，永久保存他们的音容笑貌与人生故事。</div>
            <div className="memorial-list">
              {[
                { name: '张志远', years: '1920-1998', title: '家族始祖' },
                { name: '王淑兰', years: '1923-2001', title: '家族始祖配偶' },
              ].map((m, i) => (
                <div className="memorial-person" key={i} onClick={() => navigate(`/family/memorial/${encodeURIComponent(m.name)}`)}>
                  <Avatar name={m.name} size={60} />
                  <div className="memorial-info">
                    <div className="memorial-name">{m.name}</div>
                    <div className="memorial-title">{m.title}</div>
                    <div className="memorial-years">{m.years}</div>
                  </div>
                  <button className="btn btn-outline" onClick={(e) => { e.stopPropagation(); navigate(`/family/memorial/${encodeURIComponent(m.name)}`); }}>缅怀</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inherit' && (
        <div className="card inherit-card">
          <div className="card-header"><h3 className="card-title">档案接管与继承</h3></div>
          <div className="card-body inherit-body">
            {[
              { id: 'archive', title: '数字档案继承方案', desc: '指定家庭成员作为档案继承人，确保家族记忆代代相传。', status: '已设置' },
              { id: 'oral', title: '口述史资料托管', desc: '选择可靠的云端或本地托管方式，保障音视频资料长期可访问。', status: '云端托管' },
              { id: 'hall', title: '家风馆运营授权', desc: '授权指定成员继续维护和更新家风馆内容。', status: '待设置' },
              { id: 'privacy', title: '隐私与开放权限', desc: '设置哪些内容对家族公开、哪些仅限直系亲属查看。', status: '已设置' },
            ].map((item, i) => (
              <div className="inherit-row" key={i} onClick={() => navigate(`/family/inherit/${item.id}`)}>
                <div>
                  <div className="inherit-title">{item.title}</div>
                  <div className="inherit-desc">{item.desc}</div>
                </div>
                <span className="inherit-status">{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
