import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Plus, Trash2, Mic, Sparkles, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import './Onboarding.css';

interface LifeStage {
  id: string;
  startYear: string;
  endYear: string;
  title: string;
  desc: string;
}

interface OutlineItem {
  text: string;
}

interface OutlineGroup {
  title: string;
  items: OutlineItem[];
}

function loadArchives(): unknown[] {
  try {
    const raw = localStorage.getItem('cj_archives');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function saveArchive(archive: { id: string; name: string; gender: '男' | '女'; birthYear: string; origin: string; occupation: string }) {
  const existing = loadArchives();
  localStorage.setItem('cj_archives', JSON.stringify([...existing, archive]));
  localStorage.setItem('cj_current_archive_id', archive.id);
}

function generateOutline(basic: { name: string; occupation: string; origin: string; birthYear: string }, stages: LifeStage[]): OutlineGroup[] {
  const groups: OutlineGroup[] = [
    {
      title: '成长与家庭',
      items: [
        { text: `${basic.name}出生在${basic.origin}，童年记忆中最难忘的画面是什么？` },
        { text: '小时候家里的长辈对您影响最大的一句话是什么？' },
        { text: '学生时代的兴趣爱好是怎样形成的？' },
      ],
    },
    {
      title: '学习与成长',
      items: [
        { text: '求学期间遇到过哪些改变人生轨迹的老师或同学？' },
        { text: '为什么选择现在的职业方向？' },
      ],
    },
  ];

  if (stages.length > 0) {
    stages.forEach((stage) => {
      groups.push({
        title: `${stage.startYear}-${stage.endYear} ${stage.title}`,
        items: [
          { text: `在${stage.title}阶段，您印象最深的一件事是什么？` },
          { text: stage.desc ? `关于“${stage.desc}”，能详细讲讲吗？` : '这一阶段您最大的收获或挑战是什么？' },
          { text: '当时身边有哪些重要的人陪伴或支持您？' },
        ],
      });
    });
  } else {
    groups.push({
      title: '工作与事业',
      items: [
        { text: `作为一名${basic.occupation}，您职业生涯中最重要的转折点是什么？` },
        { text: '工作中最让您自豪的成就是什么？' },
        { text: '您如何看待事业与家庭的平衡？' },
      ],
    });
  }

  groups.push({
    title: '人生感悟',
    items: [
      { text: '回顾一生，您最想对晚辈说的话是什么？' },
      { text: '您心中的家风家训是什么？' },
      { text: '如果用一个词总结自己的人生，您会选择哪个词？' },
    ],
  });

  return groups;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user, setNewUser } = useAuth();

  const [step, setStep] = useState(1);
  const [name, setName] = useState(user?.name || '');
  const [gender, setGender] = useState<'男' | '女'>('男');
  const [birthYear, setBirthYear] = useState('');
  const [origin, setOrigin] = useState('');
  const [occupation, setOccupation] = useState('');
  const [stages, setStages] = useState<LifeStage[]>([]);
  const [outline, setOutline] = useState<OutlineGroup[]>([]);

  const basic = { name, occupation, origin, birthYear };

  const canGoStep2 = name.trim() && birthYear.trim();

  const addStage = () => {
    setStages((prev) => [
      ...prev,
      { id: Date.now().toString(), startYear: '', endYear: '', title: '', desc: '' },
    ]);
  };

  const updateStage = (id: string, field: keyof LifeStage, value: string) => {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const removeStage = (id: string) => {
    setStages((prev) => prev.filter((s) => s.id !== id));
  };

  const next = () => {
    if (step === 1) {
      if (!canGoStep2) {
        addToast('请填写姓名和出生年份', 'error');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const nextOutline = generateOutline(basic, stages);
      setOutline(nextOutline);
      setStep(3);
    }
  };

  const back = () => {
    if (step > 1) setStep(step - 1);
  };

  const startInterview = () => {
    const archiveId = Date.now().toString();
    const archive = {
      id: archiveId,
      name: name.trim(),
      gender,
      birthYear: birthYear.trim(),
      origin: origin.trim(),
      occupation: occupation.trim(),
    };
    saveArchive(archive);
    localStorage.setItem(`cj_interview_outline_${archiveId}`, JSON.stringify(outline));
    setNewUser(false);
    addToast('档案已创建，开始 AI 采访', 'success');
    navigate('/interview', { replace: true });
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="onboarding-brand">
            <div className="onboarding-logo">传</div>
            <div>
              <h1 className="onboarding-title">欢迎来到传家世</h1>
              <p className="onboarding-subtitle">只需几步，即可用 AI 记录人生故事</p>
            </div>
          </div>
          <div className="onboarding-steps">
            <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className="step-line" />
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
            <div className="step-line" />
            <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
          </div>
        </div>

        <div className="onboarding-body">
          {step === 1 && (
            <div className="onboarding-step">
              <h2><User size={20} /> 第一步：填写基本信息</h2>
              <p className="step-desc">这些信息会用于生成采访提纲和人生档案。</p>
              <div className="form-grid">
                <div className="form-row">
                  <label>姓名</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="如：张三" />
                </div>
                <div className="form-row">
                  <label>性别</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value as '男' | '女')}>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
                <div className="form-row">
                  <label>出生年份</label>
                  <input type="text" value={birthYear} onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="如：1958" />
                </div>
                <div className="form-row">
                  <label>籍贯</label>
                  <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="如：江苏苏州" />
                </div>
                <div className="form-row form-row-full">
                  <label>职业</label>
                  <input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="如：教师、工程师、企业家" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-step">
              <h2><Sparkles size={20} /> 第二步：添加人生阶段</h2>
              <p className="step-desc">您经历的关键阶段会帮助 AI 生成更贴合的采访问题。</p>
              <div className="stages-list">
                {stages.map((stage) => (
                  <div className="stage-row" key={stage.id}>
                    <div className="stage-years">
                      <input type="text" placeholder="起" value={stage.startYear} onChange={(e) => updateStage(stage.id, 'startYear', e.target.value.replace(/\D/g, '').slice(0, 4))} />
                      <span>-</span>
                      <input type="text" placeholder="止" value={stage.endYear} onChange={(e) => updateStage(stage.id, 'endYear', e.target.value.replace(/\D/g, '').slice(0, 4))} />
                    </div>
                    <input type="text" placeholder="阶段名称，如：求学、工作、创业" value={stage.title} onChange={(e) => updateStage(stage.id, 'title', e.target.value)} />
                    <input type="text" placeholder="补充说明（选填）" value={stage.desc} onChange={(e) => updateStage(stage.id, 'desc', e.target.value)} />
                    <button className="icon-btn" onClick={() => removeStage(stage.id)} title="移除">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button className="btn btn-outline add-stage-btn" onClick={addStage}>
                <Plus size={14} /> 添加一个人生阶段
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="onboarding-step">
              <h2><Mic size={20} /> 第三步：采访提纲</h2>
              <p className="step-desc">AI 已根据您提供的信息生成采访提纲，您可以在采访中随时调整。</p>
              <div className="outline-preview">
                {outline.map((group, gi) => (
                  <div className="outline-group" key={gi}>
                    <div className="outline-group-title">{group.title}</div>
                    <ul className="outline-items">
                      {group.items.map((item, ii) => (
                        <li key={ii}>{item.text}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="onboarding-footer">
          {step > 1 && (
            <button className="btn btn-outline" onClick={back}>
              <ArrowLeft size={14} /> 上一步
            </button>
          )}
          {step < 3 ? (
            <button className="btn btn-primary" onClick={next}>
              下一步 <ArrowRight size={14} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={startInterview}>
              开始 AI 采访 <Mic size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
