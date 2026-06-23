import { useState, useEffect, useRef } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Mic,
  Pause,
  Square,
  RotateCcw,
  RefreshCw,
  Maximize2,
  Image,
  Smile,
  Sparkles,
  Bookmark,
  Save,
  Star,
  Clock,
  User,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import './AIInterview.css';

const subject = {
  name: '张家声',
  age: 75,
  tags: ['父亲', '家族长辈'],
};

const initialOutline = [
  { title: '童年时光', total: 6, done: 4, items: [
    { text: '您出生在哪一年？家里当时的生活条件如何？', checked: true },
    { text: '您小时候最难忘的一件事是什么？', checked: true },
    { text: '您的父母是怎样教育您的？', checked: false, active: true },
    { text: '儿时的玩伴和邻里关系如何？', checked: false },
  ]},
  { title: '求学经历', total: 5, done: 0, items: [] },
  { title: '工作事业', total: 6, done: 0, items: [] },
  { title: '婚恋家庭', total: 6, done: 0, items: [] },
  { title: '人生感悟', total: 5, done: 0, items: [] },
];

const memoryTabs = [
  { key: 'photo', label: '老照片' },
  { key: 'place', label: '地点回忆' },
  { key: 'event', label: '时代事件' },
];

const memories = [
  { title: '小学毕业合影', year: '约1958年', img: true },
  { title: '家中老宅', year: '约1960年', img: true },
  { title: '与父亲合影', year: '约1962年', img: true },
];

const waveSegments = [20, 45, 30, 60, 40, 75, 50, 35, 65, 25, 55, 40, 70, 30, 50, 60, 35, 45, 55, 40, 65, 30, 50, 70, 25, 45, 60, 35, 55, 40, 75, 50, 30, 60, 45, 55, 35, 65, 40, 50];

const followUpPool = [
  '那时家里的收入来源主要是什么？',
  '您还记得第一次上学的情景吗？',
  '在那个年代，最让您感到骄傲的事是什么？',
  '能分享一个在邻里间互帮互助的故事吗？',
  '您小时候最喜欢吃什么零食？',
  '家里有没有特别重视的传统节日？',
  '您第一次离家出远门是什么时候？',
];

const topicPool = [
  '那时候家里条件不太好，父亲是教书的，母亲在家照顾我们几个孩子。',
  '我记得小时候最喜欢跟邻居小伙伴在巷子里玩耍。',
  '父亲常说，做人要正直，做事要踏实。',
  '考上大学那年，全家人都特别高兴。',
];

const baseTranscript = [
  { speaker: 'AI采访官', time: '10:15:23', text: '您的父母是怎样教育您的？' },
  { speaker: '张家声', time: '10:15:48', text: '我父亲是个很有原则的人，他常说做人要正直，要有担当，虽然那时候家里不富裕，但他从不让我们乱花一分钱。母亲则非常慈爱，她教会了我们勤俭、善良，还有就是要懂得帮助别人。', audio: '00:25' },
];

const keywords = ['正直', '担当', '勤俭', '善良', '帮助别人', '家庭教育', '父亲', '母亲', '原则'];
const initialNotes = [
  { title: '父亲的教育原则：正直、担当', time: '10:16:02' },
  { title: '母亲教会的品质：勤俭、善良、助人为乐', time: '10:16:18' },
];

const rolesData = [
  { label: '晚辈视角', desc: '亲切自然', active: true },
  { label: '朋友视角', desc: '平等交流', active: false },
  { label: '记者视角', desc: '专业深入', active: false },
];

export default function AIInterview() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [outline, setOutline] = useState(initialOutline);
  const [openGroups, setOpenGroups] = useState<number[]>([0]);
  const [showCustomTopic, setShowCustomTopic] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [memTab, setMemTab] = useState('photo');
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(756); // 12:36
  const [transcript, setTranscript] = useState(baseTranscript);
  const [followUps, setFollowUps] = useState(followUpPool.slice(0, 4));
  const [roles, setRoles] = useState(rolesData);
  const [caption, setCaption] = useState(topicPool[0]);
  const [fullscreen, setFullscreen] = useState(false);
  const [showRoleHelp, setShowRoleHelp] = useState(false);
  const roleHelpRef = useRef<HTMLDivElement | null>(null);
  const [notes, setNotes] = useState(initialNotes);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const noteInputRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recording]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleHelpRef.current && !roleHelpRef.current.contains(e.target as Node)) {
        setShowRoleHelp(false);
      }
      if (noteInputRef.current && !noteInputRef.current.contains(e.target as Node)) {
        setShowNoteInput(false);
      }
    };
    if (showRoleHelp || showNoteInput) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRoleHelp, showNoteInput]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const toggleGroup = (i: number) => {
    setOpenGroups((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };

  const getAnswer = (q: string) => {
    if (q.includes('父母') || q.includes('教育')) {
      return '我父亲是个很有原则的人，他常说做人要正直，要有担当。母亲则非常慈爱，她教会了我们勤俭、善良，还有就是要懂得帮助别人。';
    }
    if (q.includes('邻里') || q.includes('玩伴')) {
      return '小时候邻里之间特别亲近，夏天晚上大家会把竹床搬到巷子里，孩子们追逐打闹，大人们摇着蒲扇聊天，谁家做了好吃的都会端一碗。';
    }
    if (q.includes('上学') || q.includes('第一次上学')) {
      return '我第一次上学是母亲牵着手送去的，学校就在巷子口。那时候的书包是母亲用旧衣服改的，里面装着一块小黑板和半截粉笔。';
    }
    if (q.includes('难忘')) {
      return '最难忘的是十岁那年发大水，父亲背着我蹚水去上学，水都漫到他的腰了，可他一直把我举在肩膀上，生怕我湿一点。';
    }
    if (q.includes('收入') || q.includes('来源')) {
      return '那时候家里主要靠父亲一个人的工资，他在镇上小学教书，一个月也就几十块钱。母亲偶尔给别人缝补衣服，补贴家用，日子虽然不宽裕，但过得踏实。';
    }
    if (q.includes('骄傲')) {
      return '最让我骄傲的是考上大学那年，父亲特意把通知书拿给全厂的人看。他说张家终于出了个大学生，那天他喝了点酒，话比平时多了一倍。';
    }
    if (q.includes('互帮互助')) {
      return '有一年冬天特别冷，邻居家老人病了，我母亲连续好几天给送饭送药。后来我们家有事，邻居们也主动来帮忙，那时候的人情味特别浓。';
    }
    if (q.includes('零食')) {
      return '小时候零食很少，最盼着过年吃麦芽糖。父亲会买一小袋回来，我和妹妹分着吃，能甜一整天，连糖纸都舍不得扔。';
    }
    if (q.includes('节日')) {
      return '我们家最重视春节。除夕晚上要祭祖，大年初一早上要吃汤圆，寓意团团圆圆。母亲还会给我们做新衣裳。';
    }
    if (q.includes('离家') || q.includes('远门')) {
      return '我第一次离家是去南京上大学，坐的是绿皮火车。母亲给我煮了十几个茶叶蛋，一路上舍不得吃，到了学校才发觉全捂在怀里还是热的。';
    }
    return '这个问题让我想想……那时候的日子虽然清苦，但人与人之间很真诚，很多事现在想起来还是暖暖的。';
  };

  const askQuestion = (q: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const audioSec = Math.min(58, Math.max(10, q.length * 2 + 4));
    const audio = `00:${audioSec.toString().padStart(2, '0')}`;
    setTranscript((prev) => [...prev,
      { speaker: 'AI采访官', time: now, text: q },
    ]);
    setTimeout(() => {
      setTranscript((prev) => [...prev,
        { speaker: '张家声', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), text: getAnswer(q), audio },
      ]);
    }, 1500);
  };

  const toggleRecord = () => {
    setRecording((r) => {
      addToast(r ? '已暂停录制' : '开始录制', r ? 'info' : 'success');
      return !r;
    });
  };

  const stopRecord = () => {
    setRecording(false);
    addToast('本次访谈已保存', 'success');
  };

  const refreshFollowUps = () => {
    const shuffled = [...followUpPool].sort(() => Math.random() - 0.5);
    setFollowUps(shuffled.slice(0, 4));
    addToast('已刷新追问建议', 'info');
  };

  const switchTopic = () => {
    const next = topicPool[Math.floor(Math.random() * topicPool.length)];
    setCaption(next);
    addToast('已切换话题', 'info');
  };

  const retakeSegment = () => {
    addToast('本段已重置，可重新录制', 'info');
  };

  const toggleFullscreen = () => {
    setFullscreen((f) => !f);
    addToast(fullscreen ? '已退出全屏' : '已进入全屏模式', 'info');
  };

  const selectRole = (idx: number) => {
    setRoles((prev) => prev.map((r, i) => ({ ...r, active: i === idx })));
    addToast(`已切换为「${roles[idx].label}」`, 'success');
  };

  const addCustomTopic = () => {
    const text = customTopic.trim();
    if (!text) {
      addToast('请输入自定义话题', 'error');
      return;
    }
    setOutline((prev) => {
      const next = [...prev];
      next[0] = { ...next[0], items: [...next[0].items, { text, checked: false }], total: next[0].total + 1 };
      return next;
    });
    setCustomTopic('');
    setShowCustomTopic(false);
    addToast('自定义话题已添加', 'success');
  };

  const saveNote = () => {
    const title = noteText.trim() || '重点标注';
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setNotes((prev) => [{ title, time: now }, ...prev]);
    setNoteText('');
    setShowNoteInput(false);
    addToast('已添加重点标注', 'success');
  };

  const markKeyPoint = () => {
    setShowNoteInput((v) => !v);
  };

  const saveSegment = () => {
    addToast('分段已保存', 'success');
  };

  return (
    <div className="interview-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">AI智能采访</h1>
          <div className="breadcrumb"><span>首页</span> / <span className="active">AI智能采访</span></div>
        </div>
      </header>

      <div className="interview-top-stats">
        <div className="card stat-person">
          <div className="card-body">
            <div className="stat-label-text">当前采访对象</div>
            <div className="person-row">
              <Avatar name={subject.name} size={48} />
              <div>
                <div className="person-name">{subject.name}<span className="person-age">{subject.age}岁</span></div>
                <div className="person-tags">
                  {subject.tags.map((t, i) => <span key={i}>{t}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="card stat-phase">
          <div className="card-body">
            <div className="stat-label-text">访谈阶段</div>
            <div className="phase-main">
              <div className="phase-num">第 3 阶段</div>
              <div className="phase-desc">求学与初入社会</div>
            </div>
            <button className="phase-link" onClick={() => navigate('/biography')}>查看进度 <ChevronRight size={12} /></button>
          </div>
        </div>
        <div className="card stat-time">
          <div className="card-body">
            <div className="stat-label-text">累计时长</div>
            <div className="time-value">02:38:45</div>
            <div className="stat-label-text">共 8 次访谈</div>
          </div>
        </div>
        <div className="card stat-emotion">
          <div className="card-body">
            <div className="stat-label-text">本次情绪状态</div>
            <div className="emotion-row">
              <Smile size={28} color="#4CA88E" />
              <div>
                <div className="emotion-label">平和</div>
                <div className="emotion-desc">情绪稳定，表达流畅</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="interview-grid">
        <div className="card outline-card">
          <div className="card-header">
            <h3 className="card-title">个性化访谈提纲</h3>
            <button className="btn btn-ghost" onClick={() => setOpenGroups(openGroups.length === outline.length ? [] : outline.map((_, i) => i))}><ChevronDown size={14} /> {openGroups.length === outline.length ? '收起全部' : '展开全部'}</button>
          </div>
          <div className="card-body outline-body">
            {outline.map((group, i) => (
              <div className="outline-group" key={i}>
                <button className="outline-header" onClick={() => toggleGroup(i)}>
                  {openGroups.includes(i) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className="outline-title">{group.title}</span>
                  <span className="outline-progress">({group.done}/{group.total})</span>
                </button>
                {openGroups.includes(i) && (
                  <ul className="outline-list">
                    {group.items.map((item, j) => (
                      <li className={`outline-item ${item.active ? 'active' : ''} ${item.checked ? 'checked' : ''}`} key={j} onClick={() => askQuestion(item.text)}>
                        <span className="outline-num">{j + 1}.</span>
                        <span className="outline-text">{item.text}</span>
                        {item.checked && <span className="outline-check">✓</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {showCustomTopic ? (
              <div className="custom-topic-input">
                <input type="text" placeholder="输入自定义话题" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustomTopic()} autoFocus />
                <button onClick={addCustomTopic}>添加</button>
                <button onClick={() => { setShowCustomTopic(false); setCustomTopic(''); }}>取消</button>
              </div>
            ) : (
              <button className="custom-topic" onClick={() => setShowCustomTopic(true)}>+ 自定义话题</button>
            )}
          </div>
        </div>

        <div className="card studio-card">
          <div className="card-header">
            <h3 className="card-title">采访工作区</h3>
            <div className="recording-status"><span className={`red-dot ${recording ? 'active' : ''}`} /> {recording ? '录制中' : '已暂停'} {formatTime(recordSeconds)} <Mic size={14} /></div>
            <button className="btn btn-outline" onClick={toggleFullscreen}><Maximize2 size={14} /> {fullscreen ? '退出全屏' : '全屏模式'}</button>
          </div>
          <div className="card-body studio-body">
            <div className="video-stage">
              <div className="video-bg real-feed"><Avatar name={subject.name} size={80} /><span>{subject.name} · 远程画面</span></div>
              <div className="ai-interviewer">
                <Avatar name="AI采访官" size={80} />
                <div className="ai-label">AI采访官 · 小传</div>
                <div className="ai-listen">倾听中</div>
              </div>
              <div className="video-caption">{caption}</div>
            </div>
            <div className="wave-bar">
              <span>02:36</span>
              <div className="waveform">
                {waveSegments.map((h, i) => (
                  <div key={i} className="wave-segment" style={{ height: `${h}%` }} />
                ))}
              </div>
              <span>10:00</span>
            </div>
            <div className="studio-controls">
              <button className={`control-btn primary ${!recording ? 'paused' : ''}`} onClick={toggleRecord}><Pause size={16} /> {recording ? '暂停录制' : '继续录制'}</button>
              <button className="control-btn danger" onClick={stopRecord}><Square size={16} /> 结束录制</button>
              <button className="control-btn" onClick={retakeSegment}><RotateCcw size={16} /> 重录本段</button>
              <button className="control-btn" onClick={switchTopic}><RefreshCw size={16} /> 切换话题</button>
            </div>
          </div>
        </div>

        <div className="interview-right">
          <div className="card memory-card">
            <div className="card-header">
              <h3 className="card-title">记忆触发</h3>
              <button className="btn btn-ghost" onClick={() => navigate('/archive')}>更多 <ChevronRight size={14} /></button>
            </div>
            <div className="card-body">
              <div className="memory-tabs">
                {memoryTabs.map((t) => (
                  <button key={t.key} className={`mem-tab ${memTab === t.key ? 'active' : ''}`} onClick={() => setMemTab(t.key)}>{t.label}</button>
                ))}
              </div>
              <div className="memory-grid">
                {memories.map((m, i) => (
                  <div className="memory-thumb" key={i} onClick={() => navigate('/archive')}>
                    <div className="memory-img"><Image size={20} /></div>
                    <div className="memory-title">{m.title}</div>
                    <div className="memory-year">{m.year}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card followup-card">
            <div className="card-header">
              <h3 className="card-title">AI追问建议</h3>
              <button className="btn btn-ghost" onClick={refreshFollowUps}><RefreshCw size={12} /> 换一批</button>
            </div>
            <div className="card-body">
              {followUps.map((q, i) => (
                <div className="followup-item" key={i} onClick={() => askQuestion(q)}>
                  <Sparkles size={14} className="followup-icon" />
                  <span>{q}</span>
                  <ChevronRight size={14} className="followup-arrow" />
                </div>
              ))}
            </div>
          </div>

          <div className="card roles-card" ref={roleHelpRef}>
            <div className="card-header">
              <h3 className="card-title">提问角色</h3>
              <button className="btn btn-ghost role-help-btn" onClick={() => setShowRoleHelp((v) => !v)}>如何选择提问角色？</button>
            </div>
            {showRoleHelp && (
              <div className="role-help-popover">
                <div className="role-help-title">提问角色说明</div>
                <p className="role-help-desc">不同角色会影响 AI 提问的语气和侧重点，您可以根据访谈目的随时切换。</p>
                <div className="role-help-list">
                  {roles.map((r, i) => (
                    <div className="role-help-item" key={i}>
                      <User size={14} />
                      <div>
                        <div className="role-help-label">{r.label}</div>
                        <div className="role-help-text">{r.desc} · {i === 0 ? '适合日常家庭访谈，语气亲切自然' : i === 1 ? '适合深入了解，语气平等开放' : '适合结构化采访，语气专业深入'}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="role-help-close" onClick={() => setShowRoleHelp(false)}>知道了</button>
              </div>
            )}
            <div className="card-body">
              <div className="roles-grid">
                {roles.map((r, i) => (
                  <button className={`role-item ${r.active ? 'active' : ''}`} key={i} onClick={() => selectRole(i)}>
                    <User size={18} />
                    <div className="role-label">{r.label}</div>
                    <div className="role-desc">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card transcript-card">
        <div className="card-header">
          <h3 className="card-title">实时转写与重点标注</h3>
          <div className="transcript-meta">
            <span><Clock size={14} /> 自动保存中…</span>
            <span><Save size={14} /> 已保存 02:35</span>
          </div>
          <div className="page-actions" ref={noteInputRef}>
            <button className="btn btn-outline" onClick={markKeyPoint}><Star size={14} /> 标注重点</button>
            {showNoteInput && (
              <div className="note-input-popover">
                <div className="note-input-title">添加重点标注</div>
                <input
                  type="text"
                  className="note-input"
                  placeholder="输入重点内容，如：父亲的教育原则"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveNote(); }}
                  autoFocus
                />
                <div className="note-input-actions">
                  <button className="btn btn-outline" onClick={() => setShowNoteInput(false)}>取消</button>
                  <button className="btn btn-primary" onClick={saveNote}>保存</button>
                </div>
              </div>
            )}
            <button className="btn btn-primary" onClick={saveSegment}><Bookmark size={14} /> 分段保存</button>
          </div>
        </div>
        <div className="card-body transcript-body">
          <div className="transcript-left">
            {transcript.map((line, i) => (
              <div className="transcript-line" key={i}>
                <Avatar className="tx-avatar" name={line.speaker} size={36} />
                <div className="tx-main">
                  <div className="tx-header">
                    <span className="tx-speaker">{line.speaker}</span>
                    <span className="tx-time">{line.time}</span>
                  </div>
                  <div className="tx-text">{line.text}</div>
                </div>
                {line.audio && <div className="tx-audio"><Mic size={12} /> {line.audio}</div>}
              </div>
            ))}
          </div>
          <div className="transcript-right">
            <div className="keywords-section">
              <div className="section-title">重点关键词</div>
              <div className="keywords-list">
                {keywords.map((k, i) => <span className="keyword-tag" key={i}>{k}</span>)}
              </div>
            </div>
            <div className="notes-section">
              <div className="section-title">标注记录 <span className="notes-count">(2)</span></div>
              {notes.map((n, i) => (
                <div className="note-item" key={i}>
                  <Star size={12} color="#D4A373" />
                  <div>
                    <div className="note-title">{n.title}</div>
                    <div className="note-time">{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
