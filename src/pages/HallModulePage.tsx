import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import {
  ArrowLeft,
  Plus,
  FileText,
  BookOpen,
  GraduationCap,
  Star,
  Sparkles,
  Trash2,
  Save,
  Send,
  ThumbsUp,
  Users,
  Trophy,
  MessageCircle,
  Play,
  X,
} from 'lucide-react';
import './HallModulePage.css';

const moduleMeta: Record<string, { label: string; icon: React.ElementType; desc: string }> = {
  rules: { label: '家训家规', icon: FileText, desc: '编辑与管理家训家规内容' },
  stories: { label: '家风故事', icon: BookOpen, desc: '发布与展示家风故事' },
  courses: { label: '家风课程', icon: GraduationCap, desc: '创建与发布家风课程' },
  election: { label: '最美家庭', icon: Star, desc: '最美家庭申报与评选' },
  mentor: { label: 'AI家风导师', icon: Sparkles, desc: '智能问答与导师配置' },
};

/* 家训家规 */
const initialRules = [
  { id: 1, title: '勤俭持家', content: '一粥一饭，当思来之不易；半丝半缕，恒念物力维艰。', tags: ['勤俭'] },
  { id: 2, title: '孝敬父母', content: '父母呼，应勿缓；父母命，行勿懒。', tags: ['孝道'] },
  { id: 3, title: '诚实守信', content: '言必信，行必果，做人以诚信为本。', tags: ['诚信'] },
];

function RulesModule({ projectName }: { projectName: string }) {
  const { addToast } = useToast();
  const [rules, setRules] = useState(initialRules);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const addRule = () => {
    if (!title.trim() || !content.trim()) {
      addToast('请填写完整内容', 'error');
      return;
    }
    setRules((prev) => [...prev, { id: Date.now(), title: title.trim(), content: content.trim(), tags: ['家训'] }]);
    setTitle('');
    setContent('');
    setShowAdd(false);
    addToast('家训已添加', 'success');
  };

  const removeRule = (id: number) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    addToast('已删除', 'info');
  };

  return (
    <div className="hall-module-content">
      <div className="hall-module-toolbar">
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> 新建家训</button>
        <button className="btn btn-outline" onClick={() => { setSavedAt(new Date().toLocaleTimeString()); addToast('家训排序已保存', 'success'); }}><Save size={14} /> 保存排序{savedAt ? `于 ${savedAt}` : ''}</button>
      </div>
      {showAdd && (
        <div className="hall-module-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="hall-module-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hall-module-modal-header">
              <h4>新建家训</h4>
              <button className="icon-btn" onClick={() => setShowAdd(false)}><X size={16} /></button>
            </div>
            <div className="hall-module-form">
              <input type="text" placeholder="家训标题" value={title} onChange={(e) => setTitle(e.target.value)} />
              <textarea placeholder="家训内容" rows={4} value={content} onChange={(e) => setContent(e.target.value)} />
            </div>
            <div className="hall-module-modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>取消</button>
              <button className="btn btn-primary" onClick={addRule}>确认添加</button>
            </div>
          </div>
        </div>
      )}
      <div className="hall-rules-list">
        {rules.map((r, idx) => (
          <div className="hall-rule-card" key={r.id}>
            <div className="hall-rule-index">{String(idx + 1).padStart(2, '0')}</div>
            <div className="hall-rule-body">
              <div className="hall-rule-title">{r.title}</div>
              <div className="hall-rule-text">{r.content}</div>
              <div className="hall-rule-tags">
                {r.tags.map((t) => <span key={t} className="hall-rule-tag">{t}</span>)}
              </div>
            </div>
            <button className="hall-item-delete" onClick={() => removeRule(r.id)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <div className="hall-module-hint">共 {rules.length} 条家训，将展示在家风馆「{projectName}」的家训家规模块。</div>
    </div>
  );
}

/* 家风故事 */
const initialStories = [
  { id: 1, title: '祖父的木工箱', excerpt: '那只褪色的木工箱里，装着祖父一辈子对手艺的敬畏与对家人的疼爱。', author: '张明远', date: '2024-05-20', likes: 128, liked: false },
  { id: 2, title: '母亲的年夜饭', excerpt: '每年除夕，母亲都会提前三天准备，只为让全家人吃上一顿团圆饭。', author: '李晓如', date: '2024-04-18', likes: 96, liked: false },
  { id: 3, title: '父亲的诚信账簿', excerpt: '父亲做了三十年小生意，从不缺斤短两，那本账簿至今仍在。', author: '张子涵', date: '2024-03-12', likes: 215, liked: false },
];

function StoriesModule({ projectName }: { projectName: string }) {
  const { addToast } = useToast();
  const [stories, setStories] = useState(initialStories);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [author, setAuthor] = useState('');

  const addStory = () => {
    if (!title.trim() || !excerpt.trim()) {
      addToast('请填写标题与摘要', 'error');
      return;
    }
    setStories((prev) => [{ id: Date.now(), title: title.trim(), excerpt: excerpt.trim(), author: author.trim() || '佚名', date: new Date().toISOString().slice(0, 10), likes: 0, liked: false }, ...prev]);
    setTitle('');
    setExcerpt('');
    setAuthor('');
    setShowAdd(false);
    addToast('故事已发布', 'success');
  };

  const toggleLike = (id: number) => {
    setStories((prev) => prev.map((s) => s.id === id ? { ...s, liked: !s.liked, likes: s.liked ? s.likes - 1 : s.likes + 1 } : s));
  };

  const removeStory = (id: number) => {
    setStories((prev) => prev.filter((s) => s.id !== id));
    addToast('故事已删除', 'info');
  };

  return (
    <div className="hall-module-content">
      <div className="hall-module-toolbar">
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> 发布故事</button>
        <button className="btn btn-outline" onClick={() => { setSavedAt(new Date().toLocaleTimeString()); addToast('故事列表已保存', 'success'); }}><Save size={14} /> 保存{savedAt ? `于 ${savedAt}` : ''}</button>
      </div>
      {showAdd && (
        <div className="hall-module-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="hall-module-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hall-module-modal-header"><h4>发布家风故事</h4><button className="icon-btn" onClick={() => setShowAdd(false)}><X size={16} /></button></div>
            <div className="hall-module-form">
              <input type="text" placeholder="故事标题" value={title} onChange={(e) => setTitle(e.target.value)} />
              <textarea placeholder="故事摘要" rows={4} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
              <input type="text" placeholder="作者" value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <div className="hall-module-modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>取消</button>
              <button className="btn btn-primary" onClick={addStory}>发布</button>
            </div>
          </div>
        </div>
      )}
      <div className="hall-stories-list">
        {stories.map((s) => (
          <div className="hall-story-card" key={s.id}>
            <div className="hall-story-main">
              <h4 className="hall-story-title">{s.title}</h4>
              <p className="hall-story-excerpt">{s.excerpt}</p>
              <div className="hall-story-meta">
                <span>{s.author}</span>
                <span>{s.date}</span>
                <button className={`hall-story-like ${s.liked ? 'liked' : ''}`} onClick={() => toggleLike(s.id)}>
                  <ThumbsUp size={13} /> {s.likes}
                </button>
              </div>
            </div>
            <button className="hall-item-delete" onClick={() => removeStory(s.id)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <div className="hall-module-hint">共 {stories.length} 个故事，将展示在家风馆「{projectName}」的家风故事模块。</div>
    </div>
  );
}

/* 家风课程 */
const initialCourses = [
  { id: 1, title: '家风第一课：孝道的现代意义', lessons: 6, students: 342, status: '已发布' as const },
  { id: 2, title: '家书里的家风', lessons: 4, students: 128, status: '已发布' as const },
  { id: 3, title: '邻里和睦与家族传承', lessons: 8, students: 0, status: '草稿' as const },
];

function CoursesModule({ projectName }: { projectName: string }) {
  const { addToast } = useToast();
  const [courses, setCourses] = useState(initialCourses);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [lessons, setLessons] = useState('');

  const addCourse = () => {
    if (!title.trim()) {
      addToast('请填写课程名称', 'error');
      return;
    }
    const n = parseInt(lessons, 10) || 1;
    setCourses((prev) => [{ id: Date.now(), title: title.trim(), lessons: n, students: 0, status: '草稿' }, ...prev]);
    setTitle('');
    setLessons('');
    setShowAdd(false);
    addToast('课程已创建', 'success');
  };

  const toggleStatus = (id: number) => {
    setCourses((prev) => prev.map((c) => c.id === id ? { ...c, status: c.status === '已发布' ? '草稿' : '已发布' } : c));
    addToast('课程状态已更新', 'success');
  };

  return (
    <div className="hall-module-content">
      <div className="hall-module-toolbar">
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> 新建课程</button>
        <button className="btn btn-outline" onClick={() => { setSavedAt(new Date().toLocaleTimeString()); addToast('课程配置已保存', 'success'); }}><Save size={14} /> 保存{savedAt ? `于 ${savedAt}` : ''}</button>
      </div>
      {showAdd && (
        <div className="hall-module-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="hall-module-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hall-module-modal-header"><h4>新建课程</h4><button className="icon-btn" onClick={() => setShowAdd(false)}><X size={16} /></button></div>
            <div className="hall-module-form">
              <input type="text" placeholder="课程名称" value={title} onChange={(e) => setTitle(e.target.value)} />
              <input type="number" placeholder="课时数" value={lessons} onChange={(e) => setLessons(e.target.value)} />
            </div>
            <div className="hall-module-modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>取消</button>
              <button className="btn btn-primary" onClick={addCourse}>创建</button>
            </div>
          </div>
        </div>
      )}
      <div className="hall-courses-list">
        {courses.map((c) => (
          <div className="hall-course-card" key={c.id}>
            <div className="hall-course-icon"><Play size={20} /></div>
            <div className="hall-course-info">
              <div className="hall-course-title">{c.title}</div>
              <div className="hall-course-meta">
                <span>{c.lessons} 课时</span>
                <span>{c.students} 人在学</span>
                <span className={`hall-course-status ${c.status === '已发布' ? 'published' : 'draft'}`}>{c.status}</span>
              </div>
            </div>
            <button className={`btn ${c.status === '已发布' ? 'btn-ghost' : 'btn-primary'}`} onClick={() => toggleStatus(c.id)}>
              {c.status === '已发布' ? '下架' : '发布'}
            </button>
          </div>
        ))}
      </div>
      <div className="hall-module-hint">共 {courses.length} 门课程，将展示在家风馆「{projectName}」的家风课程模块。</div>
    </div>
  );
}

/* 最美家庭 */
const initialCandidates = [
  { id: 1, family: '张明远家庭', desc: '四世同堂，孝老爱亲，热心社区公益。', votes: 342 },
  { id: 2, family: '李建国家庭', desc: '夫妻和睦，教子有方，传承书香家风。', votes: 289 },
  { id: 3, family: '王淑芬家庭', desc: '勤俭持家，邻里互助，几十年如一日。', votes: 198 },
];

function ElectionModule({ projectName }: { projectName: string }) {
  const { addToast } = useToast();
  const [candidates, setCandidates] = useState(initialCandidates);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [family, setFamily] = useState('');
  const [desc, setDesc] = useState('');

  const addCandidate = () => {
    if (!family.trim()) {
      addToast('请填写家庭名称', 'error');
      return;
    }
    setCandidates((prev) => [...prev, { id: Date.now(), family: family.trim(), desc: desc.trim(), votes: 0 }]);
    setFamily('');
    setDesc('');
    setShowAdd(false);
    addToast('参评家庭已添加', 'success');
  };

  const vote = (id: number) => {
    setCandidates((prev) => prev.map((c) => c.id === id ? { ...c, votes: c.votes + 1 } : c).sort((a, b) => b.votes - a.votes));
    addToast('投票成功', 'success');
  };

  const remove = (id: number) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
    addToast('已移除', 'info');
  };

  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);

  return (
    <div className="hall-module-content">
      <div className="hall-module-toolbar">
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> 添加参评家庭</button>
        <button className="btn btn-outline" onClick={() => { setSavedAt(new Date().toLocaleTimeString()); addToast('评选数据已保存', 'success'); }}><Save size={14} /> 保存{savedAt ? `于 ${savedAt}` : ''}</button>
      </div>
      {showAdd && (
        <div className="hall-module-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="hall-module-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hall-module-modal-header"><h4>添加参评家庭</h4><button className="icon-btn" onClick={() => setShowAdd(false)}><X size={16} /></button></div>
            <div className="hall-module-form">
              <input type="text" placeholder="家庭名称" value={family} onChange={(e) => setFamily(e.target.value)} />
              <textarea placeholder="事迹简介" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <div className="hall-module-modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>取消</button>
              <button className="btn btn-primary" onClick={addCandidate}>添加</button>
            </div>
          </div>
        </div>
      )}
      <div className="hall-election-summary">
        <div><Trophy size={18} /> 参评家庭 <strong>{candidates.length}</strong></div>
        <div><Users size={18} /> 累计投票 <strong>{totalVotes}</strong></div>
      </div>
      <div className="hall-candidates-list">
        {candidates.map((c, idx) => (
          <div className="hall-candidate-card" key={c.id}>
            <div className="hall-candidate-rank">{idx + 1}</div>
            <div className="hall-candidate-info">
              <div className="hall-candidate-family">{c.family}</div>
              <div className="hall-candidate-desc">{c.desc}</div>
              <div className="hall-candidate-votes">
                <span>得票 {c.votes}</span>
                <div className="hall-vote-bar"><div style={{ width: `${Math.min(100, totalVotes ? (c.votes / totalVotes) * 100 : 0)}%` }} /></div>
              </div>
            </div>
            <div className="hall-candidate-actions">
              <button className="btn btn-primary" onClick={() => vote(c.id)}><ThumbsUp size={13} /> 投票</button>
              <button className="hall-item-delete" onClick={() => remove(c.id)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="hall-module-hint">排行榜实时更新，将展示在家风馆「{projectName}」的最美家庭模块。</div>
    </div>
  );
}

/* AI家风导师 */
const initialQA = [
  { id: 1, q: '什么是家风？', a: '家风是一个家庭长期形成的风气、风格和风尚，体现着家庭成员的价值取向与行为规范。' },
  { id: 2, q: '如何传承家训？', a: '可以通过家庭会议、节日仪式、故事讲述、日常行为示范等方式，让家训融入生活。' },
  { id: 3, q: '怎样开展最美家庭评选？', a: '制定评选标准，发动家庭申报，组织投票与评审，最后公示结果并宣传典型事迹。' },
];

function MentorModule({ projectName }: { projectName: string }) {
  const { addToast } = useToast();
  const [qa, setQa] = useState(initialQA);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const [ask, setAsk] = useState('');
  const [answer, setAnswer] = useState('');

  const addQA = () => {
    if (!q.trim() || !a.trim()) {
      addToast('请填写问题与答案', 'error');
      return;
    }
    setQa((prev) => [...prev, { id: Date.now(), q: q.trim(), a: a.trim() }]);
    setQ('');
    setA('');
    setShowAdd(false);
    addToast('问答已添加', 'success');
  };

  const test = () => {
    if (!ask.trim()) return;
    const found = qa.find((item) => ask.includes(item.q) || item.q.includes(ask));
    setAnswer(found ? found.a : '这个问题超出了当前知识库，建议补充更多家风资料后再试。');
    addToast('AI导师已回复', 'success');
  };

  const removeQA = (id: number) => {
    setQa((prev) => prev.filter((item) => item.id !== id));
    addToast('已删除', 'info');
  };

  return (
    <div className="hall-module-content">
      <div className="hall-module-toolbar">
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> 添加知识</button>
        <button className="btn btn-outline" onClick={() => { setSavedAt(new Date().toLocaleTimeString()); addToast('知识库已保存', 'success'); }}><Save size={14} /> 保存{savedAt ? `于 ${savedAt}` : ''}</button>
      </div>
      {showAdd && (
        <div className="hall-module-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="hall-module-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hall-module-modal-header"><h4>添加问答知识</h4><button className="icon-btn" onClick={() => setShowAdd(false)}><X size={16} /></button></div>
            <div className="hall-module-form">
              <input type="text" placeholder="问题" value={q} onChange={(e) => setQ(e.target.value)} />
              <textarea placeholder="答案" rows={4} value={a} onChange={(e) => setA(e.target.value)} />
            </div>
            <div className="hall-module-modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>取消</button>
              <button className="btn btn-primary" onClick={addQA}>添加</button>
            </div>
          </div>
        </div>
      )}
      <div className="hall-mentor-test">
        <h4><Sparkles size={16} /> 对话测试</h4>
        <div className="hall-mentor-input">
          <input type="text" placeholder="输入问题，测试 AI 家风导师" value={ask} onChange={(e) => setAsk(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && test()} />
          <button className="btn btn-primary" onClick={test}><Send size={14} /> 提问</button>
        </div>
        {answer && <div className="hall-mentor-answer"><MessageCircle size={14} /> {answer}</div>}
      </div>
      <div className="hall-qa-list">
        {qa.map((item) => (
          <div className="hall-qa-card" key={item.id}>
            <div className="hall-qa-q"><span>Q</span>{item.q}</div>
            <div className="hall-qa-a"><span>A</span>{item.a}</div>
            <button className="hall-item-delete" onClick={() => removeQA(item.id)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <div className="hall-module-hint">共 {qa.length} 条问答，将服务于家风馆「{projectName}」的 AI 家风导师。</div>
    </div>
  );
}

const moduleComponents: Record<string, React.FC<{ projectName: string }>> = {
  rules: RulesModule,
  stories: StoriesModule,
  courses: CoursesModule,
  election: ElectionModule,
  mentor: MentorModule,
};

export default function HallModulePage() {
  const navigate = useNavigate();
  const { name, module } = useParams<{ name: string; module: string }>();
  const decodedName = decodeURIComponent(name ?? '');
  const meta = moduleMeta[module ?? ''];
  const Content = moduleComponents[module ?? ''];

  if (!meta || !Content) {
    return (
      <div className="detail-page hall-module-page">
        <header className="page-header">
          <button className="btn btn-ghost" onClick={() => navigate(-1)}><ArrowLeft size={16} /> 返回</button>
          <h1 className="page-title">模块不存在</h1>
        </header>
      </div>
    );
  }

  const Icon = meta.icon;

  return (
    <div className="detail-page hall-module-page" key={module}>
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <div className="hall-module-title">
          <Icon size={20} />
          <div>
            <h1 className="page-title">{meta.label}</h1>
            <span className="hall-module-desc">{decodedName} · {meta.desc}</span>
          </div>
        </div>
      </header>
      <Content projectName={decodedName} />
    </div>
  );
}
