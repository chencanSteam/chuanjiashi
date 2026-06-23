import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import {
  ChevronRight,
  Plus,
  Landmark,
  BookOpen,
  GraduationCap,
  Users,
  Star,
  Monitor,
  Eye,
  Save,
  Send,
  Sparkles,
  BookMarked,
  FileText,
  Mic,
  BarChart3,
  Building2,
  FileCheck,
  Download,
  Image,
  Share2,
  QrCode,
  Link,
  EyeOff,
} from 'lucide-react';
import './AIFamilyHall.css';

const stats = [
  { icon: Landmark, label: '在建家风馆', value: '18', trend: '12.5%' },
  { icon: BookOpen, label: '已发布专题', value: '36', trend: '8.3%' },
  { icon: BookMarked, label: '家风故事库', value: '1,258', trend: '15.6%' },
  { icon: GraduationCap, label: '家风课程数', value: '128', trend: '9.4%' },
  { icon: Users, label: '最美家庭申报数', value: '243', trend: '11.2%' },
];

const initialProjects = [
  { name: '张氏家风馆', status: '建设中', date: '2024-05-24 15:30' },
  { name: '李氏家风馆', status: '建设中', date: '2024-05-22 11:20' },
  { name: '王氏家风馆', status: '已发布', date: '2024-05-18 09:10' },
  { name: '陈氏家风馆', status: '已发布', date: '2024-05-15 16:45' },
  { name: '赵氏家风馆', status: '建设中', date: '2024-05-10 14:20' },
];

const hallNav = ['首页', '家训家规', '家风故事', '家风课程', '最美家庭', 'AI家风导师'];
const modules = [
  { icon: FileText, label: '家训家规', desc: '家训家规传承' },
  { icon: BookOpen, label: '家风故事', desc: '家风故事传承' },
  { icon: GraduationCap, label: '家风课程', desc: '精品课程学习' },
  { icon: Star, label: '最美家庭', desc: '榜样力量展示' },
  { icon: Sparkles, label: 'AI家风导师', desc: '智能导师咨询' },
];

const moduleRouteMap: Record<string, string> = {
  '家训家规': 'rules',
  '家风故事': 'stories',
  '家风课程': 'courses',
  '最美家庭': 'election',
  'AI家风导师': 'mentor',
};

const pageModules = [
  '轮播Banner', '家训家规', '家风故事', '家风课程', '最美家庭', 'AI家风导师'
];

const contentCards = [
  { title: 'AI家风提炼', desc: '基于人物档案与故事，AI提炼家风内涵', btn: '开始提炼', path: '/family-hall/ai-refine' },
  { title: '家风故事库', desc: '管理家风故事，支持AI扩写与润色', btn: '故事管理', path: '/family-hall/story-library' },
  { title: '家风测评', desc: '构建家风测评问卷，评估家风传承', btn: '创建测评', path: '/family-hall/assessment' },
  { title: '最美家庭评选', desc: '发起评选活动，展示榜样力量', btn: '发起评选', path: '/family-hall/activity' },
];

const oralStats = [
  { label: '采访任务', value: '64' },
  { label: '已完成', value: '38' },
  { label: '进行中', value: '16' },
  { label: '待审核', value: '10' },
];

const govStats = [
  { label: '服务项目', value: '24' },
  { label: '数据总量', value: '128万+' },
  { label: '成果报告', value: '56份' },
  { label: '覆盖家庭', value: '12万+' },
];

export default function AIFamilyHall() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeNav, setActiveNav] = useState('首页');
  const [activeColor, setActiveColor] = useState('#1B5E4B');
  const [configTab, setConfigTab] = useState('配置');
  const [publishSetting, setPublishSetting] = useState('公开访问');
  const [template, setTemplate] = useState('水墨典雅（默认）');
  const [bannerUploaded, setBannerUploaded] = useState(false);

  const [projectsList, setProjectsList] = useState(initialProjects);
  const [showNewHall, setShowNewHall] = useState(false);
  const [newHallName, setNewHallName] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [visibleModules, setVisibleModules] = useState<Set<string>>(new Set(pageModules));
  const [outputing, setOutputing] = useState<Record<string, boolean>>({});

  const addHall = () => {
    const name = newHallName.trim();
    if (!name) {
      addToast('请输入家风馆名称', 'error');
      return;
    }
    setProjectsList((prev) => [{ name, status: '建设中', date: new Date().toLocaleString('zh-CN', { hour12: false }) }, ...prev]);
    setNewHallName('');
    setShowNewHall(false);
    addToast(`已创建「${name}」`, 'success');
  };

  const saveHall = () => {
    setSavedAt(new Date().toLocaleString('zh-CN', { hour12: false }));
    addToast('已保存草稿', 'success');
  };

  const publishHall = () => {
    setPublishedAt(new Date().toLocaleString('zh-CN', { hour12: false }));
    addToast('家风馆已发布', 'success');
  };

  const toggleModule = (m: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVisibleModules((prev) => {
      const next = new Set(prev);
      if (next.has(m)) {
        next.delete(m);
        addToast(`已隐藏：${m}`, 'info');
      } else {
        next.add(m);
        addToast(`已显示：${m}`, 'info');
      }
      return next;
    });
  };

  const deploy = () => {
    navigate('/family-hall/deploy');
  };

  const output = (type: string) => {
    setOutputing((prev) => ({ ...prev, [type]: true }));
    addToast(`${type} 生成中…`, 'info');
    setTimeout(() => {
      setOutputing((prev) => ({ ...prev, [type]: false }));
      addToast(`${type} 已完成`, 'success');
    }, 1200);
  };

  const previewModules = modules.filter((m) => visibleModules.has(m.label));

  return (
    <div className="hall-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">AI家风馆</h1>
        </div>
      </header>

      <div className="hall-stats-row">
        {stats.map((s, i) => (
          <div className="card hall-stat" key={i} onClick={() => {
            const paths = ['/family-hall', '/family-hall/deploy', '/family/stories', '/family-hall/activity', '/family-hall/activity'];
            navigate(paths[i]);
          }}>
            <div className="card-body">
              <div className="hall-stat-icon"><s.icon size={22} color="#1B5E4B" /></div>
              <div className="hall-stat-label">{s.label}</div>
              <div className="hall-stat-value">{s.label === '在建家风馆' ? projectsList.filter((p) => p.status === '建设中').length : s.value}</div>
              <div className="hall-stat-trend">较上月 <ChevronRight size={10} className="trend-up" /> {s.trend}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="hall-main-grid">
        <div className="card project-list">
          <div className="card-header">
            <h3 className="card-title">馆馆项目列表</h3>
            {!showNewHall && (
              <button className="btn btn-outline" onClick={() => setShowNewHall(true)}><Plus size={14} /> 新建家风馆</button>
            )}
          </div>
          <div className="card-body project-body">
            {showNewHall && (
              <div className="new-hall-row">
                <input type="text" placeholder="输入家风馆名称" value={newHallName} onChange={(e) => setNewHallName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addHall()} autoFocus />
                <button className="btn btn-primary" onClick={addHall}>创建</button>
                <button className="btn btn-ghost" onClick={() => { setShowNewHall(false); setNewHallName(''); }}>取消</button>
              </div>
            )}
            {projectsList.map((p, i) => (
              <div className="project-item" key={i} onClick={() => navigate(`/family-hall/project/${encodeURIComponent(p.name)}`)}>
                <div className="project-thumb"><Landmark size={20} /></div>
                <div className="project-info">
                  <div className="project-name">{p.name}</div>
                  <div className="project-date">{p.status === '建设中' ? '更新于' : '发布于'} {p.date}</div>
                </div>
                <span className={`project-status ${p.status === '建设中' ? 'building' : 'published'}`}>{p.status}</span>
              </div>
            ))}
            <button className="view-all-projects" onClick={() => navigate('/family-hall/project/张氏家风馆')}>查看全部项目（{projectsList.length}）</button>
          </div>
        </div>

        <div className="card hall-preview">
          <div className="card-header">
            <h3 className="card-title">家风馆主页 <span>（可视化编辑 / 拖拽组件）</span></h3>
            <div className="preview-actions">
              <button className="icon-btn" onClick={() => navigate('/family-hall/project/张氏家风馆')} title="预览"><Eye size={16} /></button>
              <button className="btn btn-outline" onClick={saveHall}><Save size={14} /> 保存{savedAt ? `于 ${savedAt.split(' ')[1]}` : ''}</button>
              <button className="btn btn-primary" onClick={publishHall}><Send size={14} /> 发布{publishedAt ? 'ed' : ''}</button>
            </div>
          </div>
          <div className="card-body preview-body">
            <div className="preview-banner">
              <div className="preview-banner-content">
                <div className="preview-logo">张氏家风馆</div>
                <div className="preview-nav">
                  {hallNav.map((n) => (
                    <span key={n} className={activeNav === n ? 'active' : ''} onClick={() => setActiveNav(n)}>{n}</span>
                  ))}
                </div>
                <h2 className="preview-slogan">忠厚传家久 · 诗书继世长</h2>
                <p className="preview-desc">百年张氏家风传承与数字化展馆</p>
                <button className="btn btn-primary enter-hall" onClick={() => navigate('/family-hall/project/张氏家风馆')}>进入家风馆 <ChevronRight size={14} /></button>
              </div>
            </div>
            <div className="preview-modules">
              {previewModules.map((m, i) => (
                <div className="preview-module" key={i} onClick={() => navigate(`/family-hall/project/${encodeURIComponent('张氏家风馆')}/${moduleRouteMap[m.label] ?? 'rules'}`)}>
                  <div className="preview-module-icon"><m.icon size={22} /></div>
                  <div className="preview-module-label">{m.label}</div>
                  <div className="preview-module-desc">{m.desc}</div>
                </div>
              ))}
              {previewModules.length === 0 && <div className="preview-empty">请在配置面板开启模块</div>}
            </div>
          </div>
        </div>

        <div className="card config-card">
          <div className="card-header">
            <h3 className="card-title">页面配置</h3>
          </div>
          <div className="card-body config-body">
            <div className="config-tabs">
              {['配置', '组件库'].map((t) => (
                <span key={t} className={configTab === t ? 'active' : ''} onClick={() => setConfigTab(t)}>{t}</span>
              ))}
            </div>
            <div className="config-row">
              <label>模板选择</label>
              <select value={template} onChange={(e) => setTemplate(e.target.value)}>
                <option>水墨典雅（默认）</option>
                <option>红色家风</option>
                <option>现代简约</option>
              </select>
              <button className="btn btn-ghost" onClick={() => addToast(`模板已切换为：${template}`, 'success')}>更换模板</button>
            </div>
            <div className="config-row">
              <label>配色方案</label>
              <div className="color-palette">
                {['#1B5E4B', '#e8ecea', '#D4A373', '#C27BA0', '#6b7280'].map((c) => (
                  <span
                    key={c}
                    className={`color-box ${activeColor === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setActiveColor(c)}
                  />
                ))}
              </div>
            </div>
            <div className="config-modules">
              <label>页面模块</label>
              <div className="module-list">
                {pageModules.map((m, i) => (
                  <div className={`module-item ${visibleModules.has(m) ? '' : 'disabled'}`} key={i} onClick={() => toggleModule(m, { stopPropagation: () => {} } as React.MouseEvent)}>
                    <span>≡ {m}</span>
                    {visibleModules.has(m)
                      ? <Eye size={14} color="#9ca3af" className="module-eye" onClick={(e) => toggleModule(m, e)} />
                      : <EyeOff size={14} color="#9ca3af" className="module-eye" onClick={(e) => toggleModule(m, e)} />}
                  </div>
                ))}
              </div>
            </div>
            <div className="config-row">
              <label>Banner设置</label>
              <label className="banner-thumb" style={{ cursor: 'pointer' }}>
                <Image size={16} />
                <input type="file" accept="image/*" hidden onChange={() => { setBannerUploaded(true); addToast('Banner图片已更换', 'success'); }} />
              </label>
              <button className="btn btn-ghost" onClick={() => addToast('图片已更换', bannerUploaded ? 'success' : 'info')}>更换图片</button>
            </div>
            <div className="config-row">
              <label>发布设置</label>
              <select value={publishSetting} onChange={(e) => setPublishSetting(e.target.value)}>
                <option>公开访问</option>
                <option>家人可见</option>
                <option>密码访问</option>
              </select>
            </div>
            <button className="btn btn-primary publish-btn" onClick={publishHall}>发布</button>
            <div className="deploy-actions">
              <button className="deploy-btn" onClick={deploy}><Link size={14} /> H5链接</button>
              <button className="deploy-btn" onClick={deploy}><QrCode size={14} /> 二维码</button>
              <button className="deploy-btn" onClick={deploy}><Monitor size={14} /> 嵌入官网</button>
              <button className="deploy-btn" onClick={deploy}><Share2 size={14} /> 分享海报</button>
            </div>
          </div>
        </div>
      </div>

      <div className="hall-bottom">
        <div className="card content-prod">
          <div className="card-header">
            <h3 className="card-title">内容生产</h3>
          </div>
          <div className="card-body content-grid">
            {contentCards.map((c, i) => (
              <div className="content-item" key={i} onClick={() => navigate(c.path)}>
                <div className="content-title">{c.title}</div>
                <div className="content-desc">{c.desc}</div>
                <button className="btn btn-outline" onClick={(e) => {
                  e.stopPropagation();
                  navigate(c.path);
                }}>{c.btn}</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card election-card" onClick={() => navigate('/family-hall/activity')}>
          <div className="card-header">
            <h3 className="card-title">最美家庭评选 <span className="tag-active">进行中</span></h3>
            <span className="card-extra" style={{ color: '#1B5E4B' }} onClick={(e) => { e.stopPropagation(); navigate('/family-hall/activity'); }}>进入活动</span>
          </div>
          <div className="card-body election-body">
            <div className="election-title">2024年度最美家庭评选活动</div>
            <div className="election-date">活动时间：2024.04.20 - 2024.06.30</div>
            <div className="election-stats">
              <div onClick={(e) => { e.stopPropagation(); navigate('/family-hall/activity'); }}><strong>126</strong><span>参评家庭</span></div>
              <div onClick={(e) => { e.stopPropagation(); navigate('/family-hall/activity'); }}><strong>8,563</strong><span>累计投票</span></div>
              <div onClick={(e) => { e.stopPropagation(); navigate('/family-hall/activity'); }}><strong>32,158</strong><span>访问量</span></div>
              <div onClick={(e) => { e.stopPropagation(); navigate('/family-hall/activity'); }}><strong>20</strong><span>入围家庭</span></div>
            </div>
            <div className="election-progress-bar">
              <div className="election-progress-fill" />
            </div>
            <div className="election-stages">
              <span>报名阶段<br />04.20-05.10</span>
              <span className="active">投票阶段<br />05.11-06.10</span>
              <span>评审阶段<br />06.11-06.25</span>
              <span>结果公示<br />06.26-06.30</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hall-footer">
        <div className="card oral-card">
          <div className="card-header">
            <h3 className="card-title">口述史工程</h3>
            <span className="card-extra" onClick={() => navigate('/interview')}>采访记录家族记忆，留存珍贵口述历史</span>
          </div>
          <div className="card-body">
            <div className="oral-stats">
              {oralStats.map((s, i) => (
                <div className="oral-stat" key={i} onClick={() => navigate('/interview')}>
                  <div className="oral-label">{s.label}</div>
                  <div className="oral-value">{s.value}</div>
                </div>
              ))}
            </div>
            <div className="oral-actions">
              <button className="oral-action" onClick={() => navigate('/interview')}><Mic size={14} /> 任务管理</button>
              <button className="oral-action" onClick={() => navigate('/government/dashboard')}><BarChart3 size={14} /> 数据统计</button>
              <button className="oral-action" onClick={() => output('成果输出')}><FileCheck size={14} /> {outputing['成果输出'] ? '生成中…' : '成果输出'}</button>
            </div>
          </div>
        </div>

        <div className="card gov-card">
          <div className="card-header">
            <h3 className="card-title">政务客户服务</h3>
            <span className="card-extra" onClick={() => navigate('/government')}>为政府与机构提供家风建设数字化解决方案</span>
          </div>
          <div className="card-body">
            <div className="oral-stats">
              {govStats.map((s, i) => (
                <div className="oral-stat" key={i} onClick={() => navigate('/government')}>
                  <div className="oral-label">{s.label}</div>
                  <div className="oral-value">{s.value}</div>
                </div>
              ))}
            </div>
            <div className="oral-actions">
              <button className="oral-action" onClick={() => navigate('/government')}><Building2 size={14} /> 项目管理</button>
              <button className="oral-action" onClick={() => navigate('/government/dashboard')}><BarChart3 size={14} /> 数据看板</button>
              <button className="oral-action" onClick={() => output('成果报告')}><FileCheck size={14} /> {outputing['成果报告'] ? '生成中…' : '成果输出'}</button>
            </div>
          </div>
        </div>

        <div className="card output-card">
          <div className="card-header">
            <h3 className="card-title">成果输出口</h3>
          </div>
          <div className="card-body output-body">
            <button className="output-item" onClick={() => output('家风馆导出')} disabled={outputing['家风馆导出']}><BookOpen size={18} /> {outputing['家风馆导出'] ? '导出中…' : '家风馆导出'}</button>
            <button className="output-item" onClick={() => output('成果报告')} disabled={outputing['成果报告']}><FileText size={18} /> {outputing['成果报告'] ? '生成中…' : '成果报告'}</button>
            <button className="output-item" onClick={() => output('宣传册生成')} disabled={outputing['宣传册生成']}><Image size={18} /> {outputing['宣传册生成'] ? '生成中…' : '宣传册生成'}</button>
            <button className="output-item" onClick={() => output('数据包导出')} disabled={outputing['数据包导出']}><Download size={18} /> {outputing['数据包导出'] ? '导出中…' : '数据包导出'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
