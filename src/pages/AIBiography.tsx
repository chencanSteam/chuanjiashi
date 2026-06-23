import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import {
  ChevronRight,
  Plus,
  Settings,
  BookOpen,
  FileText,
  Image,
  Play,
  File,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  List,
  MoreHorizontal,
  Sparkles,
  Wand2,
  Palette,
  ToggleRight,
  Type,
  Download,
  FileType,
  BookMarked,
  Shield,
  RefreshCw,
  Clock,
  Baby,
  GraduationCap,
  Briefcase,
  Heart,
  Rocket,
  Coffee,
  Trash2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import './AIBiography.css';

const stats = [
  { icon: FileText, label: '素材总数', value: '2,345', trend: '12.6%', path: '/archive' },
  { icon: BookOpen, label: '章节数量', value: '9', trend: '-', path: '/biography' },
  { icon: Type, label: '金句提炼', value: '48', trend: '20.0%', path: '/biography' },
  { icon: Clock, label: '最近更新', value: '2025-05-24 10:32', sub: '婚恋家庭', path: '/biography' },
];

const initialChapters = [
  '前言', '童年', '求学', '工作', '婚恋家庭', '家风传承', '人生感悟', '年谱', '后记',
];

const initialEditorContent = `人生如河，岁月如歌。每个人的生命旅程都是独一无二的篇章，承载着家族的记忆，也映照着时代的变迁。本传记旨在记录张明远先生（1958年生）的人生历程，梳理其成长轨迹、重要抉择与心路历程，传承其优良家风与人生智慧，启迪后人，薪火相传。\n\n一、童年\n1958年，张明远先生出生于江苏苏州的一个书香门第之家。父亲张文轩先生是一位中学教师，母亲李淑贞女士勤劳贤慧，操持家务，孝敬长辈。在父母的言传身教下，他从小养成了勤奋好学、诚实守信的品格。\n\n父亲常说：“做人要正直，做事要踏实，读书要用心。”这句话伴随我一生，成为我前进的动力。\n\n二、求学\n1965年，我进入苏州市立实验小学。那时的校园古朴宁静，青砖黛瓦间充满了书香气息。老师们严谨治学，同学们互帮互助。我尤其对文学和历史产生了浓厚的兴趣，常常泡在图书馆里，一读就是一整天。\n\n1976年，我考入南京大学机械工程专业。大学四年，是我人生中最重要的转折点之一。在那里，我不仅学到了专业知识，更结识了一群志同道合的朋友。我们曾一起在实验室熬夜，也曾在紫金山下畅谈理想。\n\n三、工作\n1982年大学毕业后，我被分配到南京机床厂担任技术员。那时的工厂条件艰苦，但我始终保持着学习的热情。从基层做起，我逐步成长为技术骨干，参与了多个重要项目的设计与研发。\n\n1992年，在改革开放的浪潮中，我辞去稳定的工作，与两位合作伙伴共同创立明远机械有限公司。创业初期条件艰苦，但团队齐心协力，逐步打开市场，产品远销海外，为公司奠定了坚实基础。`;

const aiTools = [
  { label: '续写', icon: ChevronRight },
  { label: '润色', icon: Palette },
  { label: '扩写', icon: Type },
  { label: '缩写', icon: FileText },
  { label: '调整语气', icon: Settings },
  { label: '提炼金句', icon: Sparkles },
  { label: '纠错', icon: Wand2 },
];

const timeline = [
  { year: '1958', title: '出生', desc: '出生于苏州一个普通工人家庭，父母勤劳善良。', Icon: Baby, color: '#1B5E4B' },
  { year: '1976', title: '考入大学', desc: '努力学习，顺利考入大学，开启人生新阶段。', Icon: GraduationCap, color: '#1B5E4B' },
  { year: '1982', title: '参加工作', desc: '毕业后进入国营企业，踏实工作，虚心学习。', Icon: Briefcase, color: '#1B5E4B' },
  { year: '1988', title: '结婚成家', desc: '与妻子喜结连理，组建自己的小家庭。', Icon: Heart, color: '#DB2777' },
  { year: '1992', title: '创业', desc: '辞职下海，创办公司，开启创业之路，迎接新挑战。', Icon: Rocket, color: '#1B5E4B' },
  { year: '2020', title: '退休', desc: '光荣退休，开启人生新篇章，享受美好生活。', Icon: Coffee, color: '#D97706' },
];

const archives = [
  { title: '童年照片', count: '126 张', type: 'image' },
  { title: '荣誉证书', count: '8 份', type: 'doc' },
  { title: '工作合影', count: '24 张', type: 'image' },
  { title: '手写笔记', count: '38 页', type: 'doc' },
  { title: '采访视频', count: '03:42', type: 'video' },
  { title: '书画作品', count: '12 幅', type: 'image' },
];

const relations = [
  { role: '父亲', name: '张文轩', side: 'left' },
  { role: '母亲', name: '李淑贞', side: 'left' },
  { role: '妻子', name: '王丽华', side: 'right' },
  { role: '儿子', name: '张子文', side: 'right' },
  { role: '女儿', name: '张子涵', side: 'right' },
];

const recentEdits = [
  { title: '婚恋家庭', date: '05-22' },
  { title: '家风传承', date: '05-22' },
  { title: '童年', date: '05-20' },
  { title: '人生感悟', date: '05-18' },
  { title: '求学', date: '05-15' },
];

const coverColors = ['#e8f3ee', '#fce7f3', '#fef3c7', '#dbeafe'];

export default function AIBiography() {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [chapterList, setChapterList] = useState(initialChapters);
  const [activeChap, setActiveChap] = useState(0);
  const [manageMode, setManageMode] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newChapter, setNewChapter] = useState('');

  const [editorText, setEditorText] = useState(initialEditorContent);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiWorking, setAiWorking] = useState(false);

  const [aiToggle1, setAiToggle1] = useState(true);
  const [aiToggle2, setAiToggle2] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(68);
  const [savedAt, setSavedAt] = useState('10:32:15');

  const [coverColor, setCoverColor] = useState(0);
  const [activeTimeline, setActiveTimeline] = useState<string | null>(null);
  const [exporting, setExporting] = useState<Record<string, boolean>>({});
  const [showMoreFormats, setShowMoreFormats] = useState(false);
  const [outlineList, setOutlineList] = useState<string[]>([]);

  const wordCount = editorText.replace(/\s/g, '').length;

  const selectChapter = (i: number) => {
    setActiveChap(i);
    addToast(`已切换到「${chapterList[i]}」`, 'info');
  };

  const addChapter = () => {
    const title = newChapter.trim();
    if (!title) {
      addToast('请输入章节名称', 'error');
      return;
    }
    setChapterList((prev) => [...prev, title]);
    setActiveChap(chapterList.length);
    setNewChapter('');
    setShowAddInput(false);
    addToast(`已新增章节「${title}」`, 'success');
  };

  const removeChapter = (i: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (chapterList.length <= 1) {
      addToast('至少保留一个章节', 'error');
      return;
    }
    const title = chapterList[i];
    setChapterList((prev) => prev.filter((_, idx) => idx !== i));
    if (activeChap >= i && activeChap > 0) setActiveChap(activeChap - 1);
    addToast(`已删除章节「${title}」`, 'info');
  };

  const moveChapter = (i: number, dir: -1 | 1, e: React.MouseEvent) => {
    e.stopPropagation();
    const j = i + dir;
    if (j < 0 || j >= chapterList.length) return;
    const next = [...chapterList];
    [next[i], next[j]] = [next[j], next[i]];
    setChapterList(next);
    if (activeChap === i) setActiveChap(j);
    else if (activeChap === j) setActiveChap(i);
  };

  const applyAiTool = (label: string) => {
    if (aiWorking) return;
    setAiWorking(true);
    setTimeout(() => {
      setEditorText((prev) => {
        const additions: Record<string, string> = {
          续写: '\n\n[AI 续写] 后来，我将这些经历整理成册，成为家族记忆的一部分。',
          润色: '\n\n[AI 润色] 文字已优化，语句更加流畅自然。',
          扩写: '\n\n[AI 扩写] 在那些年里，每一次抉择都凝聚着家人的支持与时代的机遇。',
          缩写: '\n\n[AI 缩写] 人生历经求学、工作与创业，始终秉持正直踏实的家风。',
          调整语气: '\n\n[AI 调整语气] 段落语气已调整为更温暖、亲切的表达。',
          提炼金句: '\n\n【金句】家风如灯，照亮后人前行的路。',
          纠错: '\n\n[AI 纠错] 已完成错别字与语法检查。',
        };
        return prev + (additions[label] || `\n\n[AI ${label} 完成]`);
      });
      setAiWorking(false);
      addToast(`AI ${label} 完成`, 'success');
    }, 600);
  };

  const generateFromPrompt = () => {
    const prompt = aiPrompt.trim();
    if (!prompt || aiWorking) return;
    setAiWorking(true);
    addToast('AI 正在处理您的需求…', 'info');
    setTimeout(() => {
      setEditorText((prev) => prev + `\n\n[AI 生成] 根据“${prompt}”，补充了相关内容，并已融入当前章节。`);
      setAiPrompt('');
      setAiWorking(false);
      addToast('AI 已生成内容', 'success');
    }, 1000);
  };

  const generate = () => {
    if (generating || progress >= 100) return;
    setGenerating(true);
    addToast('AI 正在生成章节…', 'info');
    let p = progress;
    const id = setInterval(() => {
      p += 4;
      if (p >= 100) {
        p = 100;
        clearInterval(id);
        setGenerating(false);
        addToast('章节生成完成', 'success');
      }
      setProgress(p);
    }, 200);
  };

  const autoSave = () => {
    const now = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    setSavedAt(now);
    addToast('已自动保存', 'success');
  };

  const exportFile = (type: string) => {
    setExporting((prev) => ({ ...prev, [type]: true }));
    addToast(`${type} 导出中…`, 'info');
    setTimeout(() => {
      setExporting((prev) => ({ ...prev, [type]: false }));
      addToast(`${type} 导出完成`, 'success');
    }, 1500);
  };

  const changeCover = () => {
    setCoverColor((i) => (i + 1) % coverColors.length);
    addToast('封面已更换', 'success');
  };

  const formatTool = (type: string) => {
    setEditorText((prev) => {
      if (type === 'bold') return prev + '\n\n**加粗文本示例**';
      if (type === 'italic') return prev + '\n\n*斜体文本示例*';
      if (type === 'underline') return prev + '\n\n<u>下划线文本示例</u>';
      if (type === 'list') return prev + '\n\n- 列表项一\n- 列表项二';
      if (type === 'h1') return prev + '\n\n# 一级标题';
      if (type === 'quote') return prev + '\n\n> 引用文本';
      if (type === 'divider') return prev + '\n\n---';
      return prev;
    });
    const map: Record<string, string> = { bold: '加粗', italic: '斜体', underline: '下划线', list: '列表', h1: '标题', quote: '引用', divider: '分割线' };
    addToast(`已应用${map[type] ?? type}`, 'info');
  };

  return (
    <div className="biography-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">AI传记生成</h1>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={autoSave}><RefreshCw size={14} /> 自动保存于 {savedAt}</button>
        </div>
      </header>

      <div className="bio-stats-row">
        {stats.map((s, i) => (
          <div className="card bio-stat" key={i} onClick={() => s.path && navigate(s.path)}>
            <div className="card-body">
              <div className="bio-stat-icon"><s.icon size={22} color="#1B5E4B" /></div>
              <div className="bio-stat-label">{s.label}</div>
              <div className="bio-stat-value">{s.label === '章节数量' ? chapterList.length : s.value}</div>
              {s.trend ? <div className="bio-stat-trend">较上月 <ChevronRight size={10} className="trend-up" /> {s.trend}</div> : <div className="bio-stat-sub">{s.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="biography-main">
        <div className="card chapter-tree">
          <div className="card-header">
            <h3 className="card-title">章节结构</h3>
            {!showAddInput && (
              <button className="btn btn-ghost" onClick={() => setShowAddInput(true)}><Plus size={14} /> 新增章节</button>
            )}
          </div>
          <div className="card-body">
            {showAddInput && (
              <div className="chapter-add-row">
                <input
                  type="text"
                  value={newChapter}
                  onChange={(e) => setNewChapter(e.target.value)}
                  placeholder="输入章节名称"
                  onKeyDown={(e) => e.key === 'Enter' && addChapter()}
                  autoFocus
                />
                <button className="btn btn-primary" onClick={addChapter}>保存</button>
                <button className="btn btn-ghost" onClick={() => { setShowAddInput(false); setNewChapter(''); }}>取消</button>
              </div>
            )}
            <div className="chapter-list">
              {chapterList.map((title, i) => (
                <div className={`chapter-item ${activeChap === i ? 'active' : ''}`} key={i} onClick={() => selectChapter(i)}>
                  <BookOpen size={16} />
                  <span>{title}</span>
                  {manageMode && (
                    <span className="chapter-actions">
                      <button onClick={(e) => moveChapter(i, -1, e)} disabled={i === 0}><ArrowUp size={12} /></button>
                      <button onClick={(e) => moveChapter(i, 1, e)} disabled={i === chapterList.length - 1}><ArrowDown size={12} /></button>
                      <button onClick={(e) => removeChapter(i, e)}><Trash2 size={12} /></button>
                    </span>
                  )}
                </div>
              ))}
            </div>
            <button className={`chapter-manage ${manageMode ? 'active' : ''}`} onClick={() => setManageMode((v) => !v)}><Settings size={14} /> {manageMode ? '完成管理' : '章节管理'}</button>
          </div>
        </div>

        <div className="card editor-card">
          <div className="card-header">
            <h3 className="card-title">传记编辑器</h3>
            <div className="editor-meta">
              <span>自动保存于 {savedAt}</span>
              <span><RefreshCw size={12} /></span>
              <span>字数：{wordCount.toLocaleString()}</span>
              <span><ChevronRight size={12} /> 全屏编辑</span>
            </div>
          </div>
          <div className="editor-toolbar">
            <select className="tool-select"><option>正文</option></select>
            <select className="tool-select"><option>思源宋体</option></select>
            <select className="tool-select"><option>16</option></select>
            <button className="tool-btn" onClick={() => formatTool('bold')}><Bold size={14} /></button>
            <button className="tool-btn" onClick={() => formatTool('italic')}><Italic size={14} /></button>
            <button className="tool-btn" onClick={() => formatTool('underline')}><Underline size={14} /></button>
            <button className="tool-btn" onClick={() => formatTool('align')}><AlignLeft size={14} /></button>
            <button className="tool-btn" onClick={() => formatTool('list')}><List size={14} /></button>
            <label className="tool-btn" style={{ position: 'relative' }}>
              <Image size={14} />
              <input type="file" accept="image/*" hidden onChange={() => addToast('图片上传成功', 'success')} />
            </label>
            <div style={{ position: 'relative' }}>
              <button className="tool-btn" onClick={() => setShowMoreFormats((v) => !v)}><MoreHorizontal size={14} /></button>
              {showMoreFormats && (
                <div className="format-popover">
                  <button onClick={() => { formatTool('h1'); setShowMoreFormats(false); }}>标题</button>
                  <button onClick={() => { formatTool('quote'); setShowMoreFormats(false); }}>引用</button>
                  <button onClick={() => { formatTool('divider'); setShowMoreFormats(false); }}>分割线</button>
                </div>
              )}
            </div>
          </div>
          <div className="editor-body">
            <h2 className="editor-chapter-title">{chapterList[activeChap] ?? '前言'}</h2>
            <div className="editor-text">
              {editorText.split('\n\n').map((p, i) => (
                <p key={i}>{p.split('\n').map((line, j) => <span key={j}>{line}<br /></span>)}</p>
              ))}
            </div>
            <div className="editor-quote">父亲常说：“做人要正直，做事要踏实，读书要用心。”这句话伴随我一生，成为我前进的动力。</div>
          </div>
          <div className="ai-assistant-bar">
            <div className="ai-tools">
              <span className="ai-tools-title"><Sparkles size={14} /> AI写作助手</span>
              {aiTools.map((t, i) => (
                <button className="ai-tool" key={i} onClick={() => applyAiTool(t.label)} disabled={aiWorking}><t.icon size={12} /> {t.label}</button>
              ))}
            </div>
            <div className="ai-input-row">
              <input
                type="text"
                placeholder="请输入您的写作需求，如：帮我把整体润色这一段…"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateFromPrompt()}
                disabled={aiWorking}
              />
              <button className="btn btn-primary" onClick={generateFromPrompt} disabled={aiWorking}><Sparkles size={14} /> {aiWorking ? '生成中…' : '生成'}</button>
            </div>
          </div>
        </div>

        <div className="biography-side">
          <div className="card settings-card">
            <div className="card-header">
              <h3 className="card-title">生成设置</h3>
            </div>
            <div className="card-body settings-body">
              <div className="setting-row">
                <label>风格模板</label>
                <select><option>温馨叙事风（推荐）</option></select>
              </div>
              <div className="setting-row">
                <label>语气选择</label>
                <select><option>真诚、温暖、富有感染力</option></select>
              </div>
              <div className="setting-row">
                <label>多语言翻译</label>
                <select><option>中文（简体）</option></select>
              </div>
              <div className="setting-toggle">
                <span>AI润色</span>
                <button className={`toggle ${aiToggle1 ? 'on' : ''}`} onClick={() => setAiToggle1(!aiToggle1)}><ToggleRight size={20} /></button>
              </div>
              <div className="setting-toggle">
                <span>AI摘要生成</span>
                <button className={`toggle ${aiToggle2 ? 'on' : ''}`} onClick={() => setAiToggle2(!aiToggle2)}><ToggleRight size={20} /></button>
              </div>
              <button className="btn btn-primary generate-chapter" onClick={generate} disabled={generating}><Sparkles size={14} /> {generating ? '生成中…' : '智能生成章节'}</button>
              <button className="btn btn-outline outline-btn" onClick={() => setOutlineList(chapterList.map((c, i) => `${i + 1}. ${c}`))}><List size={14} /> 生成目录大纲</button>
              {outlineList.length > 0 && (
                <div className="outline-list-preview">
                  {outlineList.map((o, i) => <div className="outline-list-item" key={i}>{o}</div>)}
                </div>
              )}
            </div>
          </div>

          <div className="card cover-card">
            <div className="card-header">
              <h3 className="card-title">封面预览</h3>
            </div>
            <div className="card-body cover-body">
              <div className="book-cover" style={{ background: `linear-gradient(135deg, ${coverColors[coverColor]}, #fff)` }}>
                <div className="book-title">张明远传记</div>
                <div className="book-subtitle">平凡人生不凡足迹</div>
              </div>
              <button className="btn btn-outline cover-btn" onClick={changeCover}><RefreshCw size={14} /> 更换封面</button>
            </div>
          </div>

          <div className="card export-card">
            <div className="card-header">
              <h3 className="card-title">导出与发布</h3>
            </div>
            <div className="card-body export-body">
              <button className="export-btn" onClick={() => exportFile('Word')} disabled={exporting.Word}><FileType size={18} /> {exporting.Word ? '导出中…' : '导出 Word'}</button>
              <button className="export-btn" onClick={() => exportFile('PDF')} disabled={exporting.PDF}><Download size={18} /> {exporting.PDF ? '导出中…' : '导出 PDF'}</button>
              <button className="export-btn" onClick={() => exportFile('实体书排版')} disabled={exporting['实体书排版']}><BookMarked size={18} /> {exporting['实体书排版'] ? '生成中…' : '实体书排版'}</button>
              <button className="export-btn" onClick={() => exportFile('版权存证')} disabled={exporting['版权存证']}><Shield size={18} /> {exporting['版权存证'] ? '提交中…' : '版权存证'}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bio-bottom">
        <div className="card timeline-card">
          <div className="card-header">
            <h3 className="card-title">人生时间轴</h3>
            <button className="btn btn-ghost">查看全部</button>
          </div>
          <div className="card-body timeline-body">
            {timeline.map((t, i) => (
              <div className={`timeline-node ${activeTimeline === t.year ? 'active' : ''}`} key={i} onClick={() => setActiveTimeline(t.year)}>
                <div className="timeline-icon" style={{ background: t.color }}>
                  <t.Icon size={16} />
                </div>
                <div className="timeline-main">
                  <div className="timeline-head">
                    <span className="timeline-year">{t.year}</span>
                    <span className="timeline-title">{t.title}</span>
                  </div>
                  <div className="timeline-desc">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card archive-card">
          <div className="card-header">
            <h3 className="card-title">多媒体档案库</h3>
            <button className="btn btn-ghost" onClick={() => navigate('/archive')}>查看全部</button>
          </div>
          <div className="card-body archive-grid">
            {archives.map((a, i) => (
              <div className="archive-thumb" key={i} onClick={() => navigate('/archive')}>
                <div className="archive-icon">{a.type === 'image' ? <Image size={20} /> : a.type === 'video' ? <Play size={20} /> : <File size={20} />}</div>
                <div className="archive-title">{a.title}</div>
                <div className="archive-count">{a.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card relation-card" onClick={() => navigate('/family')}>
          <div className="card-header">
            <h3 className="card-title">人物关系图谱</h3>
          </div>
          <div className="card-body relation-body">
            <div className="relation-center">
              <Avatar name="张明远" size={64} />
              <span>张明远</span>
            </div>
            <div className="relation-others">
              {relations.map((r, i) => (
                <div className={`relation-item ${r.side}`} key={i}>
                  <Avatar name={r.name} size={40} />
                  <div className="relation-role">{r.role}</div>
                  <div className="relation-name">{r.name}</div>
                </div>
              ))}
            </div>
            <div className="relation-legend">
              <span><span className="legend-line green" /> 直系亲属</span>
              <span><span className="legend-line purple" /> 配偶关系</span>
              <span><span className="legend-line blue" /> 子女关系</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bio-footer">
        <div className="card recent-card">
          <div className="card-header">
            <h3 className="card-title">最近编辑</h3>
            <button className="btn btn-ghost" onClick={() => navigate('/biography')}>查看更多 <ChevronRight size={14} /></button>
          </div>
          <div className="card-body recent-body">
            {recentEdits.map((e, i) => (
              <div className="recent-item" key={i} onClick={() => navigate('/biography')}>
                <FileText size={16} color="#1B5E4B" />
                <span className="recent-title">{e.title}</span>
                <span className="recent-date">编辑于 {e.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card progress-card">
          <div className="card-header">
            <h3 className="card-title">写作进度</h3>
          </div>
          <div className="card-body">
            <div className="progress-text">完成度 {progress}%</div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
            <div className="progress-desc">已完成 {Math.floor(progress / 100 * chapterList.length)} / {chapterList.length} 章节</div>
          </div>
        </div>
      </div>
    </div>
  );
}
