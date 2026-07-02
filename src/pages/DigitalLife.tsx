import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { useVersion } from '../hooks/useVersion';
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
  Upload,
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import { generateImageDataUrl, generateAudioUrl } from '../utils/mediaPlaceholder';
import {
  memoryScopeOptions,
  languageStyleOptions,
  recommendedQuestions,
  loadQuota,
  consumeDigitalDialog,
  type AIQuota,
} from '../data/aiMock';
import { getArchiveBasedDigitalAnswer } from '../utils/digitalAnswer';
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

interface Relative {
  name: string;
  date: string;
  progress: number;
  active?: boolean;
  gender?: string;
  photo?: string;
  memoryScopes?: string[];
  languageStyle?: string;
}

const defaultRelatives: Relative[] = [
  { name: '爷爷数字分身', date: '2024-03-12', progress: 68, gender: '男' },
  { name: '奶奶数字分身', date: '2024-04-08', progress: 54, gender: '女' },
  { name: '父亲数字分身', date: '2024-03-20', progress: 72, gender: '男' },
  { name: '母亲数字分身', date: '2024-05-01', progress: 61, gender: '女' },
];

interface TrainingParam {
  label: string;
  desc: string;
  value: number;
}

const defaultTrainingParams: TrainingParam[] = [
  { label: '语言风格学习', desc: '学习说话习惯、语气、常用词汇', value: 72 },
  { label: '情感记忆', desc: '情感表达、情绪理解与回应能力', value: 68 },
  { label: '价值观建模', desc: '人生观、价值观、决策偏好建模', value: 75 },
  { label: '一致性测试', desc: '人格一致性与稳定性验证', value: 65 },
  { label: '安全边界', desc: '内容安全过滤与伦理边界设置', value: 90 },
];

interface ChatMessage {
  name: string;
  question: string;
  answer: string;
  time: string;
  source?: string;
  hasMemory?: boolean;
}

const defaultChatMessages: ChatMessage[] = [
  { name: '爷爷数字分身', question: '爷爷，您当年教书时最难忘的一件事是什么？', answer: '我记得那是1985年，我带的第一届毕业班…', time: '今天 10:30' },
  { name: '爷爷数字分身', question: '您对我们家最大的期望是什么？', answer: '我希望你们都能成为正直善良、有担当的人…', time: '昨天 20:15' },
  { name: '奶奶数字分身', question: '您小时候的生活是什么样的？', answer: '我们那时候条件很苦，但邻里之间很互助…', time: '05-20 15:45' },
];

interface VoiceSample {
  title: string;
  time: string;
  url: string;
}

const defaultVoiceSampleBase: Omit<VoiceSample, 'url'>[] = [
  { title: '克隆音色 v2.0（推荐）', time: '00:32' },
  { title: '日常对话样本', time: '00:28' },
  { title: '讲述故事样本', time: '00:45' },
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

const inheritanceItems = [
  { icon: UserCheck, label: '继承人指定', desc: '设置数字亲人的继承人和访问权限', status: '3人' },
  { icon: Lock, label: '分阶段解锁', desc: '按时间或条件分阶段开放记忆内容', status: '已设置' },
  { icon: Database, label: '数据托管', desc: '选择数据托管方式与服务等级', status: '云端托管' },
];

const LS_KEYS = {
  relatives: 'cj_relatives',
  activeRel: 'cj_active_rel',
  trainingValues: 'cj_training_values',
  chatMessages: 'cj_chat_messages',
  voiceSamples: 'cj_voice_samples',
  selectedMaterials: 'cj_selected_materials',
} as const;

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

export default function DigitalLife() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { isMVP } = useVersion();
  const [activeTab, setActiveTab] = useState('clone');
  const [activeRel, setActiveRel] = useState<number>(() => {
    const savedRelatives = loadJson<Relative[]>(LS_KEYS.relatives, defaultRelatives);
    const savedActive = loadJson<number>(LS_KEYS.activeRel, 0);
    return savedRelatives.length > 0 ? Math.min(Math.max(0, savedActive), savedRelatives.length - 1) : 0;
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = loadJson<ChatMessage[]>(LS_KEYS.chatMessages, []);
    return saved.length > 0 ? saved : defaultChatMessages;
  });
  const [chatInput, setChatInput] = useState('');
  const [quota, setQuota] = useState<AIQuota>(() => loadQuota());
  const [answerLength, setAnswerLength] = useState(80);
  const [safeBoundary, setSafeBoundary] = useState(true);
  const [trainingValues, setTrainingValues] = useState<TrainingParam[]>(() => loadJson(LS_KEYS.trainingValues, defaultTrainingParams));
  const [playingVoice, setPlayingVoice] = useState<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const [relativesList, setRelativesList] = useState<Relative[]>(() => loadJson(LS_KEYS.relatives, defaultRelatives));
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardName, setWizardName] = useState('');
  const [wizardGender, setWizardGender] = useState('男');
  const [wizardPhoto, setWizardPhoto] = useState('');
  const [wizardVoiceSamples, setWizardVoiceSamples] = useState<VoiceSample[]>([]);
  const [wizardMemoryScopes, setWizardMemoryScopes] = useState<Set<string>>(new Set());
  const [wizardLanguageStyle, setWizardLanguageStyle] = useState('朴实');
  const [recording, setRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [voiceSamples, setVoiceSamples] = useState<VoiceSample[]>(() => {
    const saved = loadJson<Omit<VoiceSample, 'url'>[]>(LS_KEYS.voiceSamples, []);
    const base = saved.length > 0 ? saved : defaultVoiceSampleBase;
    return base.map((s) => ({ ...s, url: generateAudioUrl() }));
  });
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(() => new Set(loadJson<string[]>(LS_KEYS.selectedMaterials, [])));
  const [injecting, setInjecting] = useState(false);
  const [injected, setInjected] = useState(false);

  const [showPreview, setShowPreview] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ChatMessage | null>(null);
  const [showAllVoice, setShowAllVoice] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const voiceUploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { saveJson(LS_KEYS.relatives, relativesList); }, [relativesList]);
  useEffect(() => { saveJson(LS_KEYS.activeRel, activeRel); }, [activeRel]);
  useEffect(() => { saveJson(LS_KEYS.trainingValues, trainingValues); }, [trainingValues]);
  useEffect(() => { saveJson(LS_KEYS.chatMessages, chatMessages); }, [chatMessages]);
  useEffect(() => { saveJson(LS_KEYS.voiceSamples, voiceSamples); }, [voiceSamples]);
  useEffect(() => { saveJson(LS_KEYS.selectedMaterials, Array.from(selectedMaterials)); }, [selectedMaterials]);

  const openWizard = () => {
    setShowWizard(true);
    setWizardStep(1);
    setWizardName('');
    setWizardGender('男');
    setWizardPhoto('');
    setWizardVoiceSamples([]);
    setWizardMemoryScopes(new Set());
    setWizardLanguageStyle('朴实');
    setRecording(false);
    setRecordProgress(0);
  };

  const closeWizard = () => {
    setShowWizard(false);
    setWizardStep(1);
    setWizardName('');
    setWizardGender('男');
    setWizardPhoto('');
    setWizardVoiceSamples([]);
    setWizardMemoryScopes(new Set());
    setWizardLanguageStyle('朴实');
    setRecording(false);
    setRecordProgress(0);
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  };

  const boostTrainingProgress = (targetIndex = activeRel) => {
    setRelativesList((prev) => {
      if (prev.length === 0) return prev;
      return prev.map((r, i) => (i === targetIndex ? { ...r, progress: Math.min(100, r.progress + 5) } : r));
    });
    setTrainingValues((prev) => prev.map((p) => ({ ...p, value: Math.min(100, p.value + 5) })));
  };

  const sendChat = (inputQuestion?: string) => {
    const question = (inputQuestion || chatInput).trim();
    if (!question) return;
    const currentName = relativesList[activeRel]?.name || '数字亲人';
    const nextQuota = consumeDigitalDialog(quota);
    setQuota(nextQuota);
    if (!inputQuestion) setChatInput('');
    setChatMessages((prev) => [...prev, { name: '我', question, answer: '', time: '刚刚', source: undefined, hasMemory: undefined }]);
    addToast('数字亲人正在回忆…', 'info');
    setTimeout(() => {
      const { answer, source, hasMemory } = getArchiveBasedDigitalAnswer(question, currentName);
      setChatMessages((prev) => {
        const next = [...prev];
        if (next.length > 0) {
          next[next.length - 1] = { ...next[next.length - 1], answer, source, hasMemory, time: '刚刚' };
        }
        return next;
      });
    }, 1200);
  };

  const askRecommended = (question: string) => {
    sendChat(question);
  };

  const playSample = (sample: VoiceSample, index: number) => {
    if (playingVoice === index) {
      audioPlayerRef.current?.pause();
      audioPlayerRef.current = null;
      setPlayingVoice(null);
      return;
    }
    audioPlayerRef.current?.pause();
    const audio = new Audio(sample.url);
    audio.onended = () => setPlayingVoice(null);
    audio.onerror = () => {
      setPlayingVoice(null);
      addToast('音频播放失败', 'error');
    };
    audio.play().catch(() => {
      setPlayingVoice(null);
    });
    audioPlayerRef.current = audio;
    setPlayingVoice(index);
  };

  const playPreview = () => {
    const sample = voiceSamples[0];
    if (sample) {
      playSample(sample, 0);
    } else {
      addToast('暂无语音样本', 'info');
    }
  };

  const startTraining = () => {
    boostTrainingProgress();
    addToast('人格训练已开始', 'success');
  };

  const finishWizard = () => {
    const name = wizardName.trim();
    if (!name) {
      addToast('请输入数字亲人名称', 'error');
      return;
    }
    const relName = name.endsWith('数字分身') ? name : `${name}数字分身`;
    const newIndex = relativesList.length;
    const newRelative: Relative = {
      name: relName,
      date: new Date().toISOString().slice(0, 10),
      progress: 10,
      gender: wizardGender,
      photo: wizardPhoto || generateImageDataUrl(relName),
      memoryScopes: Array.from(wizardMemoryScopes),
      languageStyle: wizardLanguageStyle,
    };
    setRelativesList((prev) => [...prev, newRelative]);
    setActiveRel(newIndex);
    if (wizardVoiceSamples.length > 0) {
      setVoiceSamples((prev) => [...prev, ...wizardVoiceSamples]);
    }
    boostTrainingProgress(newIndex);
    addToast(`已创建 ${relName}，训练已开始`, 'success');
    closeWizard();
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
      boostTrainingProgress();
      addToast('记忆注入完成', 'success');
    }, 1500);
  };

  const recordSample = (setter: React.Dispatch<React.SetStateAction<VoiceSample[]>>) => {
    if (recording) return;
    setRecording(true);
    setRecordProgress(0);
    addToast('开始录制新语音样本…', 'info');
    const total = 3000;
    const interval = 60;
    let elapsed = 0;
    recordTimerRef.current = setInterval(() => {
      elapsed += interval;
      setRecordProgress(Math.min(100, (elapsed / total) * 100));
      if (elapsed >= total) {
        if (recordTimerRef.current) {
          clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
        setter((prev) => {
          const idx = prev.length + 1;
          return [...prev, { title: `新样本 ${idx}`, time: '00:15', url: generateAudioUrl() }];
        });
        setRecording(false);
        setRecordProgress(0);
        addToast('语音样本已保存', 'success');
      }
    }, interval);
  };

  const handleWizardVoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const title = file.name.replace(/\.[^/.]+$/, '');
    const newSample: VoiceSample = {
      title,
      time: '00:15',
      url: generateAudioUrl(),
    };
    setWizardVoiceSamples((prev) => [...prev, newSample]);
    addToast('语音样本已上传', 'success');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const title = wizardName.trim() || file.name || '数字亲人';
    setWizardPhoto(generateImageDataUrl(title));
    addToast('形象照片已生成', 'success');
  };

  const toggleWizardMemoryScope = (key: string) => {
    setWizardMemoryScopes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const saveNameEdit = () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditingName(false);
      return;
    }
    setRelativesList((prev) => prev.map((r, i) => (i === activeRel ? { ...r, name: trimmed } : r)));
    setEditingName(false);
    addToast('名称已更新', 'success');
  };

  const deleteRelative = (i: number) => {
    const currentLength = relativesList.length;
    setRelativesList((prev) => prev.filter((_, idx) => idx !== i));
    setActiveRel((prev) => {
      if (currentLength <= 1) return 0;
      if (prev === i) return Math.min(i, currentLength - 2);
      if (prev > i) return prev - 1;
      return prev;
    });
    addToast('已删除', 'info');
  };

  const activeRelative = relativesList[activeRel];

  const renderWizardStep = () => {
    if (wizardStep === 1) {
      return (
        <div className="wizard-step-content">
          <label className="wizard-label">称呼</label>
          <input
            type="text"
            className="wizard-input"
            placeholder="如：爷爷"
            value={wizardName}
            onChange={(e) => setWizardName(e.target.value)}
          />
          <label className="wizard-label">性别</label>
          <select className="wizard-select" value={wizardGender} onChange={(e) => setWizardGender(e.target.value)}>
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
          <label className="wizard-label">形象照片</label>
          <div className="wizard-photo" onClick={() => photoInputRef.current?.click()}>
            {wizardPhoto ? (
              <img src={wizardPhoto} alt="形象预览" />
            ) : (
              <>
                <Upload size={28} color="#1B5E4B" />
                <span>点击上传照片，生成形象预览</span>
              </>
            )}
          </div>
          <input type="file" accept="image/*" hidden ref={photoInputRef} onChange={handlePhotoUpload} />
        </div>
      );
    }
    if (wizardStep === 2) {
      return (
        <div className="wizard-step-content">
          <p className="wizard-hint">录制或上传语音样本，用于克隆声音</p>
          {wizardVoiceSamples.length === 0 && <div className="voice-empty">暂无语音样本，请先录制或上传</div>}
          {wizardVoiceSamples.map((v, i) => (
            <div className="voice-row" key={i}>
              <button className={`voice-play ${playingVoice === i ? 'playing' : ''}`} onClick={() => playSample(v, i)}>
                <Play size={12} fill="#1B5E4B" />
              </button>
              <div className="voice-wave-mini">
                {voiceWaves[i % voiceWaves.length].map((h, j) => (
                  <div key={j} className="voice-mini-seg" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="voice-title">{v.title}</div>
              <div className="voice-time">{v.time}</div>
            </div>
          ))}
          {recording && (
            <div className="record-progress">
              <div className="record-progress-bar"><div style={{ width: `${recordProgress}%` }} /></div>
              <span>{Math.ceil(((100 - recordProgress) / 100) * 3)}s</span>
            </div>
          )}
          <div className="wizard-voice-actions">
            <button className="btn btn-outline" onClick={() => recordSample(setWizardVoiceSamples)} disabled={recording}>
              <Mic size={14} /> {recording ? '录制中…' : '录制样本'}
            </button>
            <button className="btn btn-outline" onClick={() => voiceUploadInputRef.current?.click()} disabled={recording}>
              <Upload size={14} /> 上传样本
            </button>
            <input type="file" accept="audio/*" hidden ref={voiceUploadInputRef} onChange={handleWizardVoiceUpload} />
          </div>
        </div>
      );
    }
    return (
      <div className="wizard-step-content">
        <p className="wizard-hint">配置记忆范围与语言风格，完成后将开始训练</p>
        <label className="wizard-label">记忆范围</label>
        <div className="memory-scope-grid">
          {memoryScopeOptions.map((m) => (
            <div
              className={`memory-scope-item ${wizardMemoryScopes.has(m.key) ? 'selected' : ''}`}
              key={m.key}
              onClick={() => toggleWizardMemoryScope(m.key)}
            >
              <CheckIcon checked={wizardMemoryScopes.has(m.key)} />
              <span>{m.label}</span>
            </div>
          ))}
        </div>
        <label className="wizard-label">语言风格</label>
        <div className="language-style-row">
          {languageStyleOptions.map((style) => (
            <button
              className={`language-style-btn ${wizardLanguageStyle === style ? 'active' : ''}`}
              key={style}
              onClick={() => setWizardLanguageStyle(style)}
            >
              {style}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="digital-page">
      <header className="page-header digital-header">
        <h1 className="page-title">数字人</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openWizard}><Plus size={14} /> 创建数字亲人</button>
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

      {relativesList.length === 0 ? (
        <div className="empty-state">
          <Users size={48} color="#9ca3af" />
          <p>暂无数字亲人，请先创建</p>
          <button className="btn btn-primary" onClick={openWizard}><Plus size={14} /> 创建数字亲人</button>
        </div>
      ) : (
        <>
          <div className="tabs">
            {tabs.map((t) => (
              <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>
            ))}
          </div>

          <div className="digital-main">
            <div className="card relatives-card">
              <div className="card-header">
                <h3 className="card-title">我的数字亲人</h3>
                <button className="btn btn-ghost" onClick={openWizard}><Plus size={14} /> 新建</button>
              </div>
              <div className="card-body relatives-body">
                {relativesList.map((r, i) => (
                  <div className={`relative-item ${activeRel === i ? 'active' : ''}`} key={i} onClick={() => setActiveRel(i)}>
                    <Avatar name={r.name} size={46} src={r.photo} />
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

            {activeTab === 'clone' && activeRelative && (
              <div className="card clone-card">
                <div className="card-header">
                  <h3 className="card-title">形象与声音克隆</h3>
                </div>
                <div className="card-body clone-body">
                  <div className="clone-stage">
                    <div className="clone-image real-clone">
                      {activeRelative.photo ? (
                        <img src={activeRelative.photo} alt={activeRelative.name} className="clone-photo" />
                      ) : (
                        <Avatar name={activeRelative.name} size={80} />
                      )}
                      <button className="btn btn-outline" onClick={() => addToast('上传形象照片', 'success')}>上传形象</button>
                    </div>
                    <div className="clone-info">
                      {editingName ? (
                        <div className="clone-name-edit">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveNameEdit(); }}
                            autoFocus
                          />
                          <button onClick={saveNameEdit}>保存</button>
                        </div>
                      ) : (
                        <div className="clone-name">
                          {activeRelative.name} <EditIcon size={14} onClick={() => { setEditName(activeRelative.name); setEditingName(true); }} />
                        </div>
                      )}
                      <div className="clone-row"><span>性别</span><strong>{activeRelative.gender || '男'}</strong></div>
                      <div className="clone-row"><span>年龄</span><strong>78岁（生前）</strong></div>
                      <div className="clone-row"><span>籍贯</span><strong>浙江 · 绍兴</strong></div>
                      <div className="clone-row"><span>职业</span><strong>中学教师</strong></div>
                      <div className="clone-row"><span>性格</span><strong>温和、严谨、乐观</strong></div>
                      <div className="clone-row"><span>创建时间</span><strong>{activeRelative.date}</strong></div>
                    </div>
                  </div>
                  <div className="clone-actions">
                    <button className="btn btn-outline" onClick={playPreview}><Volume2 size={14} /> 语音试听</button>
                    <button className="btn btn-primary" onClick={() => setActiveTab('chat')}><MessageCircle size={14} /> 发起陪伴对话</button>
                    <div className="more-actions-wrap">
                      <button className="icon-btn" onClick={() => setShowMoreActions((v) => !v)}><MoreHorizontal size={18} /></button>
                      {showMoreActions && (
                        <div className="more-actions-menu">
                          <button onClick={() => { const name = window.prompt('新名称', activeRelative.name); if (name) { setRelativesList((prev) => prev.map((r, i) => i === activeRel ? { ...r, name } : r)); addToast('已重命名', 'success'); } setShowMoreActions(false); }}>重命名</button>
                          <button onClick={() => { deleteRelative(activeRel); setShowMoreActions(false); }}>删除</button>
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
                  {chatMessages.length === 0 && <div className="chat-empty">还没有对话，输入消息开始陪伴对话吧</div>}
                  {chatMessages.map((c, i) => (
                    <div className={`chat-record ${c.hasMemory === false ? 'no-memory' : ''}`} key={i}>
                      <Avatar name={c.name} size={36} />
                      <div className="chat-main">
                        <div className="chat-name">{c.name} <span>{c.time}</span></div>
                        {c.question && <div className="chat-question">{c.question}</div>}
                        <div className="chat-answer">{c.answer}</div>
                        {c.source && c.source !== '—' && (
                          <div className="chat-source">来源：{c.source}</div>
                        )}
                        {c.hasMemory === false && (
                          <div className="chat-source no-memory-source">当前回答超出已保存记忆范围</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="chat-input-bar">
                  <input type="text" placeholder="输入消息…" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} />
                  <button className="btn btn-primary" onClick={() => sendChat()}>发送</button>
                </div>
              </div>
            )}

            {activeTab === 'memory' && (
              <div className="card memory-panel">
                <div className="card-header"><h3 className="card-title">记忆注入</h3></div>
                <div className="card-body memory-inject">
                  <p>选择要注入的记忆素材，系统将自动学习并更新数字人的记忆库。</p>
                  <div className="inject-grid">
                    {memoryMaterials.map((m, i) => (
                      <div className={`inject-item ${selectedMaterials.has(m.label) ? 'selected' : ''}`} key={i} onClick={() => toggleMaterial(m.label)}>
                        <m.icon size={22} />
                        <div className="inject-label">{m.label}</div>
                        <div className="inject-count">{m.count}</div>
                      </div>
                    ))}
                  </div>
                  {injected && <div className="inject-success">记忆注入完成，数字人已更新</div>}
                  <button className="btn btn-primary" onClick={startInject} disabled={injecting}>{injecting ? '注入中…' : '开始记忆注入'}</button>
                </div>
              </div>
            )}

            {activeTab === 'chat' ? (
              <div className="card chat-controls-card">
                <div className="card-header">
                  <h3 className="card-title">对话设置</h3>
                </div>
                <div className="card-body chat-controls-body">
                  <div className="control-section">
                    <div className="control-label">当前数字人</div>
                    <div className="control-person">
                      <Avatar name={activeRelative.name} size={40} src={activeRelative.photo} />
                      <div>
                        <div className="control-person-name">{activeRelative.name}</div>
                        <div className="control-person-meta">{activeRelative.languageStyle || '朴实'} · {activeRelative.memoryScopes?.length || 0} 项记忆</div>
                      </div>
                    </div>
                  </div>

                  <div className="control-section">
                    <div className="control-label">回答长度</div>
                    <input
                      type="range"
                      min={30}
                      max={200}
                      value={answerLength}
                      onChange={(e) => setAnswerLength(Number(e.target.value))}
                    />
                    <div className="range-labels"><span>精简</span><span>适中</span><span>详细</span></div>
                  </div>

                  <div className="control-section toggle-section">
                    <div className="control-label">安全边界</div>
                    <button className={`toggle-btn ${safeBoundary ? 'on' : ''}`} onClick={() => setSafeBoundary((v) => !v)}>
                      {safeBoundary ? '已开启' : '已关闭'}
                    </button>
                  </div>

                  <div className="control-section">
                    <div className="control-label">推荐问题</div>
                    <div className="recommended-list">
                      {recommendedQuestions.map((q, i) => (
                        <button className="recommended-item" key={i} onClick={() => askRecommended(q)}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div className="card training-card">
                <div className="card-header">
                  <h3 className="card-title">人格训练参数</h3>
                  {!isMVP && <button className="btn btn-ghost" onClick={() => navigate('/digital-person/training-records')}>训练记录</button>}
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
                    {!isMVP && <button className="btn btn-outline" onClick={() => navigate('/digital-person/training-report')}>训练报告</button>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="digital-bottom">
            <div className="card records-card">
              <div className="card-header">
                <h3 className="card-title">对话记录</h3>
                <button className="btn btn-ghost" onClick={() => setShowAllRecords((v) => !v)}>{showAllRecords ? '收起' : '查看更多'}</button>
              </div>
              <div className="card-body records-body">
                {(showAllRecords ? chatMessages : chatMessages.slice(0, 3)).map((c, i) => (
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
                {voiceSamples.length === 0 && <div className="voice-empty">暂无语音样本，可录制或上传新样本</div>}
                {(showAllVoice ? voiceSamples : voiceSamples.slice(0, 3)).map((v, i) => (
                  <div className="voice-row" key={i}>
                    <button className={`voice-play ${playingVoice === i ? 'playing' : ''}`} onClick={() => playSample(v, i)}><Play size={12} fill="#1B5E4B" /></button>
                    <div className="voice-wave-mini">
                      {voiceWaves[i % voiceWaves.length].map((h, j) => (
                        <div key={j} className="voice-mini-seg" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                    <div className="voice-title">{v.title}</div>
                    <div className="voice-time">{v.time}</div>
                  </div>
                ))}
                <button className="btn btn-outline record-btn" onClick={() => recordSample(setVoiceSamples)} disabled={recording}>{recording ? '录制中…' : '录制新语音样本'}</button>
              </div>
            </div>

            <div className="card inheritance-card">
              <div className="card-header">
                <h3 className="card-title">数字遗产与继承设置</h3>
                {!isMVP && <button className="btn btn-ghost" onClick={() => navigate('/government')}>管理继承方案</button>}
              </div>
              <div className="card-body inheritance-body">
                {inheritanceItems.map((item, i) => (
                  <div className="inherit-row" key={i} onClick={() => !isMVP && navigate('/government')}>
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
        </>
      )}

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

      <Modal
        open={showWizard}
        title="创建数字亲人"
        onClose={closeWizard}
        footer={(
          <div className="wizard-footer">
            {wizardStep > 1 && (
              <button className="btn btn-ghost" onClick={() => setWizardStep((s) => s - 1)}>
                <ArrowLeft size={14} /> 上一步
              </button>
            )}
            {wizardStep < 3 && (
              <button
                className="btn btn-primary"
                onClick={() => setWizardStep((s) => s + 1)}
                disabled={wizardStep === 1 && !wizardName.trim()}
              >
                下一步 <ArrowRight size={14} />
              </button>
            )}
            {wizardStep === 3 && (
              <button className="btn btn-primary" onClick={finishWizard}>
                <Check size={14} /> 完成
              </button>
            )}
          </div>
        )}
      >
        <div className="wizard-steps">
          {['基础信息', '声音克隆', '记忆注入'].map((s, i) => (
            <div key={s} className={`wizard-step ${wizardStep === i + 1 ? 'active' : ''} ${wizardStep > i + 1 ? 'done' : ''}`}>
              <span>{i + 1}</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
        {renderWizardStep()}
      </Modal>

      <div className="digital-footer">
        <span>数字人功能基于AI技术生成，内容仅供参考，不替代真实的人际关系</span>
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

function CheckIcon({ checked }: { checked: boolean }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={checked ? '#1B5E4B' : '#d0d8d4'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {checked ? (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </>
      ) : (
        <circle cx="12" cy="12" r="10" />
      )}
    </svg>
  );
}
