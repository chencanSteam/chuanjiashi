import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import {
  ChevronRight,
  Plus,
  Users,
  Mic,
  Brain,
  MessageCircle,
  Briefcase,
  Play,
  Volume2,
  MoreHorizontal,
  UserCheck,
  Lock,
  Database,
  Eye,

} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import './DigitalLife.css';

const stats = [
  { icon: Users, label: '数字人物数量', value: '8人', trend: '2' },
  { icon: Mic, label: '声音克隆进度', value: '72%', trend: '18%' },
  { icon: Brain, label: '人格训练完成度', value: '68%', trend: '15%' },
  { icon: MessageCircle, label: '活跃对话次数', value: '1,248次', trend: '320' },
  { icon: Briefcase, label: '数字遗产配置数', value: '6个', trend: '1' },
];

const tabs = [
  { key: 'clone', label: '形象与声音克隆' },
  { key: 'chat', label: '实时对话' },
  { key: 'memory', label: '记忆注入' },
];

const initialRelatives = [
  { name: '爷爷数字分身', date: '2024-03-12', progress: 68, active: true },
  { name: '奶奶数字分身', date: '2024-04-08', progress: 54 },
  { name: '父亲数字分身', date: '2024-03-20', progress: 72 },
  { name: '母亲数字分身', date: '2024-05-01', progress: 61 },
];

const trainingParams = [
  { label: '语言风格学习', desc: '学习说话习惯、语气、常用词汇', value: 72 },
  { label: '情感记忆', desc: '情感表达、情绪理解与回应能力', value: 68 },
  { label: '价值观建模', desc: '人生观、价值观、决策偏好建模', value: 75 },
  { label: '一致性测试', desc: '人格一致性与稳定性验证', value: 65 },
  { label: '安全边界', desc: '内容安全过滤与伦理边界设置', value: 90 },
];

const chatRecords = [
  { name: '爷爷数字分身', question: '爷爷，您当年教书时最难忘的一件事是什么？', answer: '我记得那是1985年，我带的第一届毕业班…', time: '今天 10:30' },
  { name: '爷爷数字分身', question: '您对我们家最大的期望是什么？', answer: '我希望你们都能成为正直善良、有担当的人…', time: '昨天 20:15' },
  { name: '奶奶数字分身', question: '您小时候的生活是什么样的？', answer: '我们那时候条件很苦，但邻里之间很互助…', time: '05-20 15:45' },
];

const memoryMaterials = [
  { icon: ImageIcon, label: '家庭照片', count: '126 张' },
  { icon: Mic, label: '音频记录', count: '38 段' },
  { icon: Play, label: '视频资料', count: '24 个' },
  { icon: FileIcon, label: '文档资料', count: '56 份' },
  { icon: GiftIcon, label: '生活物品', count: '18 件' },
];

const voiceWaves = [
  [30, 50, 20, 70, 40, 60, 30, 50, 80, 40, 60, 30, 50, 70, 40, 60, 30, 50, 70, 40],
  [40, 30, 60, 40, 50, 30, 60, 40, 50, 60, 30, 50, 40, 60, 50, 30, 60, 40, 50, 30],
  [50, 60, 40, 70, 50, 60, 40, 50, 70, 60, 40, 50, 60, 40, 70, 50, 60, 40, 50, 60],
];

const initialVoiceSamples = [
  { title: '克隆音色 v2.0（推荐）', time: '00:32' },
  { title: '日常对话样本', time: '00:28' },
  { title: '讲述故事样本', time: '00:45' },
];

const inheritanceItems = [
  { icon: UserCheck, label: '继承人指定', desc: '设置数字亲人的继承人和访问权限', status: '3人' },
  { icon: Lock, label: '分阶段解锁', desc: '按时间或条件分阶段开放记忆内容', status: '已设置' },
  { icon: Database, label: '数据托管', desc: '选择数据托管方式与服务等级', status: '云端托管' },
];

export default function DigitalLife() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('clone');
  const [activeRel, setActiveRel] = useState(0);
  const [chatMessages, setChatMessages] = useState(chatRecords);
  const [chatInput, setChatInput] = useState('');
  const [trainingValues, setTrainingValues] = useState(trainingParams);
  const [playingVoice, setPlayingVoice] = useState<number | null>(null);

  const [relativesList, setRelativesList] = useState(initialRelatives);
  const [showCreate, setShowCreate] = useState(false);
  const [newRelName, setNewRelName] = useState('');

  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [injecting, setInjecting] = useState(false);
  const [injected, setInjected] = useState(false);

  const [voiceSamples, setVoiceSamples] = useState(initialVoiceSamples);
  const [recording, setRecording] = useState(false);

  const [showPreview, setShowPreview] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<typeof chatRecords[0] | null>(null);
  const [showAllVoice, setShowAllVoice] = useState(false);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [...prev, { name: '我', question: chatInput, answer: '', time: '刚刚' }]);
    setChatInput('');
    addToast('数字亲人正在思考…', 'info');
    setTimeout(() => {
      setChatMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...next[next.length - 1], answer: '这个我也记得。咱们老张家的事，爷爷都放在心上。', time: '刚刚' };
        return next;
      });
    }, 1200);
  };

  const playVoice = (i: number) => {
    setPlayingVoice(i);
    addToast(`播放语音样本：${voiceSamples[i].title}`, 'info');
    setTimeout(() => setPlayingVoice(null), 2000);
  };

  const startTraining = () => {
    setTrainingValues((prev) => prev.map((p) => ({ ...p, value: Math.min(100, p.value + 5) })));
    addToast('人格训练已开始', 'success');
  };

  const createRelative = () => {
    const name = newRelName.trim();
    if (!name) {
      addToast('请输入数字亲人名称', 'error');
      return;
    }
    const relName = name.endsWith('数字分身') ? name : `${name}数字分身`;
    setRelativesList((prev) => [...prev, { name: relName, date: new Date().toISOString().slice(0,10), progress: 10 }]);
    setNewRelName('');
    setShowCreate(false);
    addToast(`已创建 ${relName}`, 'success');
  };

  const toggleMaterial = (label: string) => {
    setSelectedMaterials((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
        addToast(`取消选择：${label}`, 'info');
      } else {
        next.add(label);
        addToast(`已选择：${label}`, 'success');
      }
      return next;
    });
  };

  const startInject = () => {
    if (selectedMaterials.size === 0) {
      addToast('请先选择要注入的素材', 'error');
      return;
    }
    setInjecting(true);
    setInjected(false);
    addToast('开始记忆注入…', 'info');
    setTimeout(() => {
      setInjecting(false);
      setInjected(true);
      addToast('记忆注入完成', 'success');
    }, 1500);
  };

  const recordVoice = () => {
    setRecording(true);
    addToast('开始录制新语音样本…', 'info');
    setTimeout(() => {
      setVoiceSamples((prev) => [...prev, { title: `新样本 ${prev.length + 1}`, time: '00:15' }]);
      setRecording(false);
      addToast('语音样本已保存', 'success');
    }, 1500);
  };

  return (
    <div className="digital-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">数字人格</h1>
          <div className="page-subtitle">创建数字亲人，训练人格模型，让爱与记忆在数字世界延续</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> 创建数字亲人</button>
          <button className="btn btn-outline" onClick={() => navigate('/settings/help')}>使用指南</button>
        </div>
      </header>

      <div className="digital-stats-row">
        {stats.map((s, i) => {
          const statPaths = ['/digital-person', '/digital-person', '/digital-person/training-records', '/digital-person', '/government'];
          return (
          <div className="card digital-stat" key={i} onClick={() => navigate(statPaths[i])}>
            <div className="card-body">
              <div className="digital-stat-icon"><s.icon size={22} color="#1B5E4B" /></div>
              <div className="digital-stat-label">{s.label}</div>
              <div className="digital-stat-value">{s.label === '数字人物数量' ? `${relativesList.length}人` : s.value}</div>
              <div className="digital-stat-trend">较上月 <ChevronRight size={10} className="trend-up" /> {s.trend}</div>
            </div>
          </div>
          );
        })}
      </div>

      <div className="tabs">
        {tabs.map((t) => (
          <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <div className="digital-main">
        <div className="card relatives-card">
          <div className="card-header">
            <h3 className="card-title">我的数字亲人</h3>
            {!showCreate && <button className="btn btn-ghost" onClick={() => setShowCreate(true)}><Plus size={14} /> 新建</button>}
          </div>
          <div className="card-body relatives-body">
            {showCreate && (
              <div className="create-rel-row">
                <input type="text" placeholder="输入称呼，如：爷爷" value={newRelName} onChange={(e) => setNewRelName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createRelative()} autoFocus />
                <button className="btn btn-primary" onClick={createRelative}>创建</button>
                <button className="btn btn-ghost" onClick={() => { setShowCreate(false); setNewRelName(''); }}>取消</button>
              </div>
            )}
            {relativesList.map((r, i) => (
              <div className={`relative-item ${activeRel === i ? 'active' : ''}`} key={i} onClick={() => setActiveRel(i)}>
                <Avatar name={r.name} size={46} />
                <div className="relative-info">
                  <div className="relative-name">{r.name}</div>
                  <div className="relative-date">创建时间：{r.date}</div>
                  <div className="relative-progress-bar"><div className="relative-progress-fill" style={{ width: `${r.progress}%` }} /></div>
                </div>
                <ChevronRight size={16} className="relative-arrow" />
              </div>
            ))}
            <button className="view-all-rel" onClick={() => navigate('/digital-person')}>查看全部（{relativesList.length}）</button>
          </div>
        </div>

        {activeTab === 'clone' && (
          <div className="card clone-card">
            <div className="card-header">
              <h3 className="card-title">形象与声音克隆</h3>
            </div>
            <div className="card-body clone-body">
              <div className="clone-stage">
                <div className="clone-image real-clone"><Avatar name={relativesList[activeRel]?.name || '爷爷数字分身'} size={80} /><button className="btn btn-outline" onClick={() => addToast('上传形象照片', 'success')}>上传形象</button></div>
                <div className="clone-info">
                  {editingName ? (
                  <div className="clone-name-edit">
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setRelativesList((prev) => prev.map((r, i) => i === activeRel ? { ...r, name: editName.trim() || r.name } : r)); setEditingName(false); addToast('名称已更新', 'success'); } }} autoFocus />
                    <button onClick={() => { setRelativesList((prev) => prev.map((r, i) => i === activeRel ? { ...r, name: editName.trim() || r.name } : r)); setEditingName(false); addToast('名称已更新', 'success'); }}>保存</button>
                  </div>
                ) : (
                  <div className="clone-name">{relativesList[activeRel]?.name || '爷爷数字分身'} <EditIcon size={14} onClick={() => { setEditName(relativesList[activeRel]?.name || ''); setEditingName(true); }} /></div>
                )}
                  <div className="clone-row"><span>年象</span><strong>78岁（生前）</strong></div>
                  <div className="clone-row"><span>籍贯</span><strong>浙江 · 绍兴</strong></div>
                  <div className="clone-row"><span>职业</span><strong>中学教师</strong></div>
                  <div className="clone-row"><span>性格</span><strong>温和、严谨、乐观</strong></div>
                  <div className="clone-row"><span>创建时间</span><strong>2024-03-12</strong></div>
                </div>
              </div>
              <div className="clone-actions">
                <button className="btn btn-outline" onClick={() => playVoice(0)}><Volume2 size={14} /> 语音试听</button>
                <button className="btn btn-primary" onClick={() => setActiveTab('chat')}><MessageCircle size={14} /> 发起陪伴对话</button>
                <div className="more-actions-wrap">
                  <button className="icon-btn" onClick={() => setShowMoreActions((v) => !v)}><MoreHorizontal size={18} /></button>
                  {showMoreActions && (
                    <div className="more-actions-menu">
                      <button onClick={() => { const name = window.prompt('新名称', relativesList[activeRel]?.name); if (name) { setRelativesList((prev) => prev.map((r, i) => i === activeRel ? { ...r, name } : r)); addToast('已重命名', 'success'); } setShowMoreActions(false); }}>重命名</button>
                      <button onClick={() => { setRelativesList((prev) => prev.filter((_, i) => i !== activeRel)); setActiveRel(0); setShowMoreActions(false); addToast('已删除', 'info'); }}>删除</button>
                      <button onClick={() => { setActiveTab('chat'); setShowMoreActions(false); }}>开始对话</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="card chat-panel">
            <div className="card-header"><h3 className="card-title">实时对话</h3></div>
            <div className="card-body chat-history">
              {chatMessages.map((c, i) => (
                <div className="chat-record" key={i}>
                  <Avatar name={c.name} size={36} />
                  <div className="chat-main">
                    <div className="chat-name">{c.name} <span>{c.time}</span></div>
                    {c.question && <div className="chat-question">{c.question}</div>}
                    <div className="chat-answer">{c.answer}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="chat-input-bar">
              <input type="text" placeholder="输入消息…" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} />
              <button className="btn btn-primary" onClick={sendChat}>发送</button>
            </div>
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="card memory-panel">
            <div className="card-header"><h3 className="card-title">记忆注入</h3></div>
            <div className="card-body memory-inject">
              <p>选择要注入的记忆素材，系统将自动学习并更新数字人格的记忆库。</p>
              <div className="inject-grid">
                {memoryMaterials.map((m, i) => (
                  <div className={`inject-item ${selectedMaterials.has(m.label) ? 'selected' : ''}`} key={i} onClick={() => toggleMaterial(m.label)}>
                    <m.icon size={22} />
                    <div className="inject-label">{m.label}</div>
                    <div className="inject-count">{m.count}</div>
                  </div>
                ))}
              </div>
              {injected && <div className="inject-success">记忆注入完成，数字人格已更新</div>}
              <button className="btn btn-primary" onClick={startInject} disabled={injecting}>{injecting ? '注入中…' : '开始记忆注入'}</button>
            </div>
          </div>
        )}

        <div className="card training-card">
          <div className="card-header">
            <h3 className="card-title">人格训练参数</h3>
            <button className="btn btn-ghost" onClick={() => navigate('/digital-person/training-records')}>训练记录</button>
          </div>
          <div className="card-body training-body">
            {trainingValues.map((p, i) => (
              <div className="training-item" key={i}>
                <div className="training-top">
                  <div className="training-icon"><Brain size={16} /></div>
                  <div className="training-info">
                    <div className="training-label">{p.label}</div>
                    <div className="training-desc">{p.desc}</div>
                  </div>
                  <div className="training-value">{p.value}%</div>
                </div>
                <div className="training-bar"><div className="training-fill" style={{ width: `${p.value}%` }} /></div>
              </div>
            ))}
            <div className="training-actions">
              <button className="btn btn-primary train-btn" onClick={startTraining}>开始训练</button>
              <button className="btn btn-outline" onClick={() => navigate('/digital-person/training-report')}>训练报告</button>
            </div>
          </div>
        </div>
      </div>

      <div className="digital-bottom">
        <div className="card records-card">
          <div className="card-header">
            <h3 className="card-title">对话记录</h3>
            <button className="btn btn-ghost" onClick={() => setShowAllRecords((v) => !v)}>{showAllRecords ? '收起' : '查看更多'}</button>
          </div>
          <div className="card-body records-body">
            {(showAllRecords ? chatRecords : chatRecords.slice(0, 3)).map((c, i) => (
              <div className="record-row" key={i} onClick={() => setSelectedRecord(c)}>
                <Avatar name={c.name} size={36} />
                <div className="record-main">
                  <div className="record-title">{c.question}</div>
                  <div className="record-answer">{c.answer}</div>
                </div>
                <div className="record-time">{c.time}</div>
              </div>
            ))}
            <button className="view-all-records" onClick={() => setShowAllRecords((v) => !v)}>{showAllRecords ? '收起对话记录' : '查看全部对话记录'}</button>
          </div>
        </div>

        <div className="card materials-card">
          <div className="card-header">
            <h3 className="card-title">记忆素材库</h3>
            <button className="btn btn-ghost" onClick={() => navigate('/archive')}>查看更多</button>
          </div>
          <div className="card-body materials-body">
            {memoryMaterials.map((m, i) => (
              <div className="material-row" key={i} onClick={() => navigate('/archive')}>
                <div className="material-icon"><m.icon size={16} /></div>
                <div className="material-label">{m.label}</div>
                <div className="material-count">{m.count}</div>
              </div>
            ))}
            <label className="btn btn-outline upload-btn" style={{ cursor: 'pointer' }}>
              上传新素材
              <input type="file" hidden onChange={() => addToast('素材上传成功', 'success')} />
            </label>
          </div>
        </div>

        <div className="card voice-card">
          <div className="card-header">
            <h3 className="card-title">声音波形 / 语音样本</h3>
            <button className="btn btn-ghost" onClick={() => setShowAllVoice((v) => !v)}>{showAllVoice ? '收起' : '查看更多'}</button>
          </div>
          <div className="card-body voice-body">
            {(showAllVoice ? voiceSamples : voiceSamples.slice(0, 3)).map((v, i) => (
              <div className="voice-row" key={i}>
                <button className={`voice-play ${playingVoice === i ? 'playing' : ''}`} onClick={() => playVoice(i)}><Play size={12} fill="#1B5E4B" /></button>
                <div className="voice-wave-mini">
                  {voiceWaves[i % voiceWaves.length].map((h, j) => (
                    <div key={j} className="voice-mini-seg" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="voice-title">{v.title}</div>
                <div className="voice-time">{v.time}</div>
              </div>
            ))}
            <button className="btn btn-outline record-btn" onClick={recordVoice} disabled={recording}>{recording ? '录制中…' : '录制新语音样本'}</button>
          </div>
        </div>

        <div className="card inheritance-card">
          <div className="card-header">
            <h3 className="card-title">数字遗产与继承设置</h3>
            <button className="btn btn-ghost" onClick={() => navigate('/government')}>管理继承方案</button>
          </div>
          <div className="card-body inheritance-body">
            {inheritanceItems.map((item, i) => (
              <div className="inherit-row" key={i} onClick={() => navigate('/government')}>
                <div className="inherit-icon"><item.icon size={18} color="#1B5E4B" /></div>
                <div className="inherit-main">
                  <div className="inherit-label">{item.label}</div>
                  <div className="inherit-desc">{item.desc}</div>
                </div>
                <div className="inherit-status">{item.status} <ChevronRight size={14} /></div>
              </div>
            ))}
            {showPreview && <div className="inherit-preview">继承预览：数字亲人将由指定继承人接管，权限按阶段解锁。</div>}
            <button className="btn btn-outline preview-btn" onClick={() => setShowPreview((v) => !v)}><Eye size={14} /> {showPreview ? '关闭' : '查看'}继承预览</button>
          </div>
        </div>
      </div>

      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>对话详情</h4><button className="modal-close" onClick={() => setSelectedRecord(null)}>关闭</button></div>
            <div className="modal-body">
              <p><strong>{selectedRecord.name}</strong> · {selectedRecord.time}</p>
              <p className="record-question">问：{selectedRecord.question}</p>
              <p className="record-answer">答：{selectedRecord.answer}</p>
            </div>
          </div>
        </div>
      )}

      <div className="digital-footer">
        <span>数字人格功能基于AI技术生成，内容仅供参考，不替代真实的人际关系</span>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/settings/help'); }}>使用条款与隐私政策</a>
      </div>
    </div>
  );
}

function ImageIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>;
}

function FileIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
}

function GiftIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 2.5 2.5v5"/><path d="M16.5 8v-2.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1-2.5 2.5h-5"/></svg>;
}

function EditIcon({ size, onClick }: { size: number; onClick?: () => void }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>;
}
