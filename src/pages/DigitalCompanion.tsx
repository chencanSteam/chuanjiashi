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
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';

import { useToast } from '../hooks/useToast';
import './DigitalCompanion.css';
import { useNavigate } from 'react-router-dom';

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

const initMessages: Record<string, { sender: 'me' | 'other'; text: string; time: string }[]> = {
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
  const [messages, setMessages] = useState(initMessages.chat);
  const [input, setInput] = useState('');
  const { addToast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);

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
    setMessages((m) => [...m, { sender: 'me', text: input, time: now }]);
    setInput('');
    setTimeout(() => {
      setMessages((m) => [...m, {
        sender: 'other',
        text: `收到你的消息啦，我会一直陪着你的。${activeContact === '爸爸' ? '你也要注意身体。' : ''}`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      }]);
      addToast(`已收到 ${activeContact} 的回复`, 'success');
    }, 1500);
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

      <div className="tabs">
        {tabs.map((t) => <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => { setActiveTab(t.key); addToast(`切换到：${t.label}`, 'info'); }}>{t.label}</button>)}
      </div>

      {activeTab === 'chat' && (
        <div className="chat-layout">
          <div className="card contacts-card">
            <div className="card-header"><h3 className="card-title">陪伴对象</h3></div>
            <div className="card-body contacts-body">
              {contacts.map((c) => (
                <div key={c.name} className={`contact-item ${activeContact === c.name ? 'active' : ''}`} onClick={() => { setActiveContact(c.name); setMessages(initMessages.chat); addToast(`切换陪伴对象：${c.name}`, 'info'); }}>
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
                      <button onClick={() => { setShowMoreChat(false); addToast('已清空聊天记录', 'info'); }}>清空记录</button>
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
                    <div className="bubble-time">{m.time}</div>
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
    </div>
  );
}
