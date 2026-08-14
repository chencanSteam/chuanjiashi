import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Image,
  Mic,
  Phone,
  Video,
  MoreHorizontal,
  Heart,
  Calendar,
  Gift,
  MessageCircleHeart,
  Sparkles,
  Clock,
  Activity,
  MapPin,
  ShieldAlert,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';

import { useToast } from '../hooks/useToast';
import { loadJson, type ChapterData } from '../data/aiMock';
import { familyApi } from '../api/family';
import { getArchiveBasedDigitalAnswer } from '../utils/digitalAnswer';
import Annotate from '../components/annotation/Annotate';
import './DigitalCompanion.css';
import { useNavigate } from 'react-router-dom';

interface ChatMessage {
  sender: 'me' | 'other';
  text: string;
  time: string;
  /** 命中敏感词被拦截的消息 */
  blocked?: boolean;
}

/** 敏感词列表：政治、色情、暴恐、赌博、毒品等类别 */
const SENSITIVE_WORDS = [
  '领导人', '政变', '颠覆国家', '法轮功',
  '色情', '约炮', '裸聊',
  '恐怖袭击', '爆炸物', '自制炸弹', '枪支',
  '赌博', '赌场', '时时彩', '六合彩',
  '毒品', '冰毒', '海洛因',
];

const SENSITIVE_REPLY = '这个问题超出了我的回答范围，我们聊聊别的吧。';

const containsSensitiveWord = (text: string) => SENSITIVE_WORDS.some((w) => text.includes(w));

/** 关键词 → 传记章节匹配规则：问童年/事业/家人等话题时引用对应章节 */
const CHAPTER_RULES: { keywords: string[]; chapter: string }[] = [
  { keywords: ['童年', '小时候', '儿时', '长大'], chapter: '童年记忆' },
  { keywords: ['求学', '读书', '上学', '大学', '学校', '老师', '同学'], chapter: '求学岁月' },
  { keywords: ['事业', '工作', '职业', '工厂', '单位', '退休'], chapter: '工作经历' },
  { keywords: ['创业', '公司', '生意', '合伙', '经商'], chapter: '创业之路' },
  { keywords: ['家人', '家庭', '妻子', '丈夫', '孩子', '儿女', '儿子', '女儿', '结婚', '父亲', '母亲', '父母'], chapter: '家庭生活' },
  { keywords: ['家风', '家训', '感悟', '遗憾', '骄傲', '人生'], chapter: '人生感悟' },
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

/**
 * 基于档案资料的规则回复：按关键词匹配传记章节/家庭关系数据，
 * 以第一人称口吻引用内容并标注来源章节；匹配不到时回退到档案问答/温和拒答。
 */
async function buildArchiveReply(question: string, contactName: string): Promise<string> {
  const archiveId = localStorage.getItem('cj_current_archive_id') || 'default';
  const rule = CHAPTER_RULES.find((r) => r.keywords.some((k) => question.includes(k)));

  if (rule) {
    const chapters = loadJson<ChapterData[]>(`cj_biography_chapters_${archiveId}`, []);
    const idx = chapters.findIndex((c) => c.title === rule.chapter);
    const chapter = idx >= 0 ? chapters[idx] : null;
    const chapterText = chapter && chapter.status !== 'notGenerated' ? stripHtml(chapter.content) : '';
    if (chapter && chapterText) {
      const excerpt = chapterText.slice(0, 120);
      return `这段我记得很清楚。${excerpt}${chapterText.length > 120 ? '……' : ''}想听更多细节的话，可以再问我。（根据传记第${idx + 1}章「${chapter.title}」）`;
    }
    // 家人话题：章节未生成时引用家庭关系数据
    if (rule.chapter === '家庭生活') {
      try {
        const relations = await familyApi.relations(archiveId);
        if (relations.length > 0) {
          const desc = relations.slice(0, 4).map((r) => `${r.from}是我的${r.relation}${r.to ? `（${r.to}）` : ''}`).join('，');
          return `说起家里人，我都记着呢：${desc}。你还想听谁的故事？（根据家庭关系档案）`;
        }
      } catch {
        // 关系数据不可用时继续走兜底
      }
    }
  }

  // 匹配不到章节时，使用档案问答的规则回复（含温和拒答）
  return getArchiveBasedDigitalAnswer(question, contactName).answer;
}

const DISCLAIMER_CONFIRMED_KEY = 'cj_companion_disclaimer_confirmed';

const tabs = [
  { key: 'chat', label: '陪伴聊天' },
  { key: 'schedule', label: '节日/纪念日提醒' },
  { key: 'emotion', label: '情绪关怀' },
  { key: 'share', label: '家庭群聊' },
  { key: 'story', label: '故事与回忆' },
];

const initialContacts = [
  { name: '爸爸', status: '在线', recent: '记得提醒我吃药' },
  { name: '妈妈', status: '1小时前', recent: '周末一起包饺子' },
  { name: '张慧', status: '在线', recent: '爷爷的采访整理好了' },
  { name: '张慧女儿', status: '2小时前', recent: '谢谢奶奶的语音' },
];

const initMessages: Record<string, ChatMessage[]> = {
  chat: [
    { sender: 'other', text: '今天天气不错，你那边怎么样？', time: '09:30' },
    { sender: 'me', text: '挺好的，我刚从外面回来。', time: '09:32' },
    { sender: 'other', text: '那就好，记得多喝水，别太累。', time: '09:33' },
    { sender: 'me', text: '知道啦，你也是。', time: '09:35' },
  ],
};

const initialEvents = [
  { date: '2026-06-18', title: '父亲节', type: '节日', icon: Gift },
  { date: '2026-06-20', title: '爷爷生日', type: '生日', icon: Calendar },
  { date: '2026-06-25', title: '结婚纪念日', type: '纪念日', icon: Heart },
];

const emotionSuggestions = [
  '发送一条温暖的早安问候',
  '分享一段共同的老照片回忆',
  '邀请家人进行视频通话',
];

const initialStories = [
  { icon: Sparkles, title: '爷爷讲的故事：童年的夏天', meta: '2026-06-10 · 5分钟阅读' },
  { icon: MapPin, title: '老宅的记忆：那个有葡萄架的院子', meta: '2026-06-08 · 3分钟阅读' },
  { icon: Heart, title: '家族年夜饭的传统', meta: '2026-06-01 · 4分钟阅读' },
];

export default function DigitalCompanion() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  const [contacts, setContacts] = useState(initialContacts);
  const [activeContact, setActiveContact] = useState(contacts[0].name);
  const [messages, setMessages] = useState<ChatMessage[]>(initMessages.chat);
  const [input, setInput] = useState('');
  const { addToast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);

  // 首次进入需确认数字人免责声明
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    try {
      return !localStorage.getItem(DISCLAIMER_CONFIRMED_KEY);
    } catch {
      return false;
    }
  });

  const confirmDisclaimer = () => {
    try {
      localStorage.setItem(DISCLAIMER_CONFIRMED_KEY, '1');
    } catch {
      // ignore
    }
    setShowDisclaimer(false);
  };

  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');

  const [events, setEvents] = useState(initialEvents);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');

  const [activeSuggestion, setActiveSuggestion] = useState<number | null>(null);
  const [calling, setCalling] = useState<'voice' | 'video' | null>(null);
  const [showMoreChat, setShowMoreChat] = useState(false);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [sentBlessings, setSentBlessings] = useState<Set<string>>(new Set());
  const [groupMessages, setGroupMessages] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: '家庭助手', text: '欢迎来到家庭群聊，在这里可以和家人们一起聊天、分享回忆。', time: '09:00' },
    { sender: '妈妈', text: '周末记得回家吃饭呀。', time: '09:05' },
  ]);
  const [groupInput, setGroupInput] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const text = input;
    // 敏感问题拦截：命中敏感词的消息标记为已拦截，返回固定拒答文案
    if (containsSensitiveWord(text)) {
      setMessages((m) => [...m, { sender: 'me', text, time: now, blocked: true }]);
      setInput('');
      setTimeout(() => {
        setMessages((m) => [...m, {
          sender: 'other',
          text: SENSITIVE_REPLY,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        }]);
      }, 800);
      return;
    }
    setMessages((m) => [...m, { sender: 'me', text, time: now }]);
    setInput('');
    setTimeout(() => {
      void buildArchiveReply(text, activeContact).then((reply) => {
        setMessages((m) => [...m, {
          sender: 'other',
          text: reply,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        }]);
        addToast(`已收到 ${activeContact} 的回复`, 'success');
      });
    }, 1200);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleSend(); };

  const addContact = () => {
    const name = newContactName.trim();
    if (!name) {
      addToast('请输入陪伴对象名称', 'error');
      return;
    }
    setContacts((prev) => [...prev, { name, status: '在线', recent: '' }]);
    setNewContactName('');
    setShowAddContact(false);
    addToast(`已添加陪伴对象：${name}`, 'success');
  };

  const addEvent = () => {
    const title = newEventTitle.trim();
    const date = newEventDate.trim();
    if (!title || !date) {
      addToast('请输入完整的提醒信息', 'error');
      return;
    }
    setEvents((prev) => [...prev, { date, title, type: '提醒', icon: Calendar }]);
    setNewEventTitle('');
    setNewEventDate('');
    setShowAddEvent(false);
    addToast('提醒已添加', 'success');
  };

  return (
    <div className="companion-page">
      <header className="page-header"><h1 className="page-title">数字陪伴</h1></header>

      <Annotate id="digital-companion.disclaimer">
      <div className="companion-disclaimer-bar">
        <ShieldAlert size={13} />
        本数字人由 AI 基于生平资料生成，回复不代表本人真实意愿
      </div>
      </Annotate>

      <div className="tabs">
        {tabs.map((t) => <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>)}
      </div>

      {activeTab === 'chat' && (
        <div className="chat-layout">
          <Annotate id="digital-companion.contacts">
          <div className="card contacts-card">
            <div className="card-header"><h3 className="card-title">陪伴对象</h3></div>
            <div className="card-body contacts-body">
              {contacts.map((c) => (
                <div key={c.name} className={`contact-item ${activeContact === c.name ? 'active' : ''}`} onClick={() => { setActiveContact(c.name); setMessages(initMessages.chat); }}>
                  <Avatar name={c.name} size={40} />
                  <div className="contact-info">
                    <div className="contact-name">{c.name}<span className="contact-status">{c.status}</span></div>
                    <div className="contact-recent">{c.recent}</div>
                  </div>
                </div>
              ))}
              {showAddContact ? (
                <div className="add-contact-row">
                  <input type="text" placeholder="名称" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addContact()} autoFocus />
                  <button onClick={addContact}>添加</button>
                  <button onClick={() => { setShowAddContact(false); setNewContactName(''); }}>取消</button>
                </div>
              ) : (
                <button className="add-contact" onClick={() => setShowAddContact(true)}><span>+</span> 添加陪伴对象</button>
              )}
            </div>
          </div>
          </Annotate>

          <Annotate id="digital-companion.chat">
          <div className="card chat-window">
            <div className="chat-header">
              <div className="chat-header-left">
                <Avatar name={activeContact} size={40} />
                <div>
                  <div className="chat-header-name">{activeContact}</div>
                  <div className="chat-header-status">{contacts.find(c => c.name === activeContact)?.status}</div>
                </div>
              </div>
              <div className="chat-actions">
                <button onClick={() => setCalling('voice')}><Phone size={18} /></button>
                <button onClick={() => setCalling('video')}><Video size={18} /></button>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setShowMoreChat((v) => !v)}><MoreHorizontal size={18} /></button>
                  {showMoreChat && (
                    <div className="chat-more-menu">
                      <button onClick={() => { setActiveTab('schedule'); setShowMoreChat(false); }}>查看日程</button>
                      <button onClick={() => { setActiveTab('share'); setShowMoreChat(false); }}>家庭群聊</button>
                      <button onClick={() => { setMessages([]); setShowMoreChat(false); addToast('已清空聊天记录', 'info'); }}>清空记录</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="chat-messages">
              <div className="chat-date"><span>今天</span></div>
              {messages.map((m, i) => (
                <div key={i} className={`chat-bubble ${m.sender}`}>
                  <Avatar name={m.sender === 'me' ? '我' : activeContact} size={32} />
                  <div className="bubble-content">
                    <div className="bubble-text">{m.text}</div>
                    <div className="bubble-time">
                      {m.time}
                      {m.blocked && <span className="bubble-blocked-tag">已拦截</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="chat-input-row">
              <label className="chat-tool" style={{ cursor: 'pointer' }}>
                <Image size={18} />
                <input type="file" accept="image/*" hidden onChange={() => addToast('图片已发送', 'success')} />
              </label>
              <button className={`chat-tool ${recordingVoice ? 'active' : ''}`} onClick={() => {
                if (recordingVoice) {
                  setRecordingVoice(false);
                  const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                  setMessages((m) => [...m, { sender: 'me', text: '[语音消息]', time: now }]);
                } else {
                  setRecordingVoice(true);
                }
              }}><Mic size={18} /></button>
              <input className="chat-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} placeholder="输入消息..." />
              <button className="send-btn" onClick={handleSend}><Send size={18} /></button>
            </div>
          </div>
          </Annotate>

          <div className="card companion-insights">
            <div className="card-header"><h3 className="card-title">陪伴洞察</h3></div>
            <div className="card-body insights-body">
              <div className="insight-item"><Clock size={16} color="#1B5E4B" /><div><div className="insight-label">本月陪伴时长</div><div className="insight-value">12.5 小时</div></div></div>
              <div className="insight-item"><MessageCircleHeart size={16} color="#1B5E4B" /><div><div className="insight-label">互动次数</div><div className="insight-value">86 次</div></div></div>
              <div className="insight-item"><Activity size={16} color="#1B5E4B" /><div><div className="insight-label">情绪评分</div><div className="insight-value">92 <span className="trend-up">↑</span></div></div></div>
              <div className="insight-section">
                <div className="insight-section-title">AI 关怀建议</div>
                <p>最近爷爷提到睡眠质量下降，建议提醒他按时休息，并在晚饭后陪他散步或聊聊天。</p>
              </div>
              <div className="insight-section">
                <div className="insight-section-title">共同回忆</div>
                <div className="memory-pill" onClick={() => navigate('/family/story/爷爷讲的故事：童年的夏天')}>童年的夏天 <span>3段故事</span></div>
                <div className="memory-pill" onClick={() => navigate('/family/story/老宅的记忆：那个有葡萄架的院子')}>老家的院子 <span>2张照片</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <Annotate id="digital-companion.schedule">
        <div className="card schedule-card">
          <div className="card-header">
            <h3 className="card-title">节日与纪念日提醒</h3>
            {!showAddEvent && <button className="btn btn-primary" onClick={() => setShowAddEvent(true)}>添加提醒</button>}
          </div>
          <div className="card-body schedule-body">
            {showAddEvent && (
              <div className="add-event-row">
                <input type="text" placeholder="提醒名称" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} />
                <input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} />
                <button className="btn btn-primary" onClick={addEvent}>保存</button>
                <button className="btn btn-ghost" onClick={() => { setShowAddEvent(false); setNewEventTitle(''); setNewEventDate(''); }}>取消</button>
              </div>
            )}
            {events.map((e, i) => (
              <div className="schedule-item" key={i}>
                <div className="schedule-icon"><e.icon size={20} /></div>
                <div className="schedule-main">
                  <div className="schedule-title">{e.title}</div>
                  <div className="schedule-date">{e.date} · {e.type}</div>
                </div>
                <button className="btn btn-outline" disabled={sentBlessings.has(e.title)} onClick={() => { setSentBlessings((prev) => new Set(prev).add(e.title)); addToast(`祝福已发送：${e.title}`, 'success'); }}>{sentBlessings.has(e.title) ? '已发送' : '发送祝福'}</button>
              </div>
            ))}
          </div>
        </div>
        </Annotate>
      )}

      {activeTab === 'emotion' && (
        <div className="card emotion-card">
          <div className="card-header"><h3 className="card-title">情绪关怀</h3></div>
          <div className="card-body emotion-body">
            <div className="emotion-score">
              <div className="emotion-chart">
                <div className="emotion-ring" style={{ background: 'conic-gradient(#1B5E4B 0% 92%, #e8ecea 92% 100%)' }}>
                  <div className="emotion-inner">92</div>
                </div>
              </div>
              <div className="emotion-legend">
                <div><span className="dot green" /> 积极情绪 92%</div>
                <div><span className="dot orange" /> 平静 6%</div>
                <div><span className="dot gray" /> 低落 2%</div>
              </div>
            </div>
            <div className="emotion-suggestions">
              <div className="insight-section-title">关怀建议</div>
              <ul>
                {emotionSuggestions.map((s, i) => (
                  <li key={i} className={activeSuggestion === i ? 'active' : ''} onClick={() => setActiveSuggestion(i)}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'share' && (
        <Annotate id="digital-companion.group-chat">
        <div className="card share-card">
          <div className="card-header"><h3 className="card-title">家庭群聊</h3>{!showInvite && <button className="btn btn-primary" onClick={() => setShowInvite(true)}>邀请成员</button>}</div>
          <div className="card-body share-body">
            {showInvite && (
              <div className="invite-row">
                <input type="text" placeholder="成员名称" value={inviteName} onChange={(e) => setInviteName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setContacts((prev) => [...prev, { name: inviteName.trim() || '新成员', status: '在线', recent: '' }]); setInviteName(''); setShowInvite(false); addToast('成员已邀请', 'success'); } }} autoFocus />
                <button onClick={() => { setContacts((prev) => [...prev, { name: inviteName.trim() || '新成员', status: '在线', recent: '' }]); setInviteName(''); setShowInvite(false); addToast('成员已邀请', 'success'); }}>邀请</button>
                <button onClick={() => { setShowInvite(false); setInviteName(''); }}>取消</button>
              </div>
            )}
            <div className="group-chat">
              <div className="group-messages">
                {groupMessages.map((m, i) => (
                  <div className={`group-bubble ${m.sender === '我' ? 'me' : ''}`} key={i}>
                    <Avatar name={m.sender} size={32} />
                    <div>
                      <div className="group-bubble-name">{m.sender} <span>{m.time}</span></div>
                      <div className="group-bubble-text">{m.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="group-input-row">
                <input type="text" placeholder="输入消息…" value={groupInput} onChange={(e) => setGroupInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && groupInput.trim()) { const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }); setGroupMessages((prev) => [...prev, { sender: '我', text: groupInput.trim(), time: now }]); setGroupInput(''); } }} />
                <button className="send-btn" onClick={() => { if (groupInput.trim()) { const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }); setGroupMessages((prev) => [...prev, { sender: '我', text: groupInput.trim(), time: now }]); setGroupInput(''); } }}><Send size={16} /></button>
              </div>
            </div>
          </div>
        </div>
        </Annotate>
      )}

      {calling && (
        <div className="call-modal" onClick={() => setCalling(null)}>
          <div className="call-content" onClick={(e) => e.stopPropagation()}>
            <Avatar name={activeContact} size={80} />
            <div className="call-name">{activeContact}</div>
            <div className="call-status">{calling === 'voice' ? '语音通话中…' : '视频通话中…'}</div>
            <div className="call-actions">
              <button className="btn btn-danger" onClick={() => setCalling(null)}>挂断</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'story' && (
        <div className="card story-card">
          <div className="card-header"><h3 className="card-title">故事与回忆</h3></div>
          <div className="card-body story-body">
            {initialStories.map((s, i) => (
              <div className="story-item" key={i} onClick={() => navigate(`/family/story/${encodeURIComponent(s.title)}`)}>
                <s.icon size={18} color="#1B5E4B" />
                <div>
                  <div className="story-title">{s.title}</div>
                  <div className="story-meta">{s.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={showDisclaimer}
        title="数字人免责声明"
        onClose={confirmDisclaimer}
        footer={
          <button className="btn btn-primary" onClick={confirmDisclaimer}>
            我已知晓并同意
          </button>
        }
      >
        <div className="disclaimer-modal-body">
          <p>本平台提供的「数字人」是基于您提供的生平资料、采访记录等素材，由人工智能技术生成的虚拟对话形象，并非真实人物本人。</p>
          <p>数字人的所有回复均由 AI 自动生成，仅供情感陪伴与纪念之用，不代表被纪念者的真实意愿、观点或立场，也不构成任何法律、医疗、投资等领域的专业建议。</p>
          <p>请勿将数字人的回复作为重大决策依据。如对话内容涉及敏感话题，系统将自动拦截并拒绝回答。平台不会将您的对话内容用于本服务之外的其他用途。</p>
          <p>继续使用即表示您已充分理解并接受上述内容。若您在使用过程中感到不适，可随时停止使用本功能。</p>
        </div>
      </Modal>
    </div>
  );
}
