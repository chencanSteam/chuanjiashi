import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Plus, Trash2, Mic, Sparkles, User, FolderOpen, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { archiveApi } from '../api/archive';
import Avatar from '../components/ui/Avatar';
import Annotate from '../components/annotation/Annotate';
import { regions } from '../data/regions';
import { industryOptions, industryOccupations } from '../data/occupations';
import './Onboarding.css';

// 出生日期下拉的年份范围：1900 至今
const currentYear = new Date().getFullYear();
const birthYearOptions = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => String(currentYear - i));

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

/** 档案选择项（合并 mock 档案与旧版 localStorage 档案） */
interface ArchiveOption {
  id: string;
  name: string;
  birthYear: string;
  origin: string;
}

interface LegacyArchive {
  id: string;
  name: string;
  birthYear?: string;
  origin?: string;
}

function loadArchives(): LegacyArchive[] {
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
  const location = useLocation();
  const { addToast } = useToast();
  const { user, setNewUser } = useAuth();

  const [step, setStep] = useState(0);
  const [checkingArchives, setCheckingArchives] = useState(true);
  const [archiveOptions, setArchiveOptions] = useState<ArchiveOption[]>([]);
  const [name, setName] = useState(user?.name || '');
  const [gender, setGender] = useState<'男' | '女'>('男');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [originProvince, setOriginProvince] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [originDistrict, setOriginDistrict] = useState('');
  const [originDetail, setOriginDetail] = useState('');
  const [industry, setIndustry] = useState('');
  const [occupation, setOccupation] = useState('');
  const [stages, setStages] = useState<LifeStage[]>([]);
  const [outline, setOutline] = useState<OutlineGroup[]>([]);

  const origin = `${originProvince}${originCity}${originDistrict}`;
  const basic = { name, occupation, origin, birthYear };

  // 进入页面时加载已有人生档案：有档案则先选择（第 0 步），没有则直接进入新建流程
  useEffect(() => {
    const load = async () => {
      const merged = new Map<string, ArchiveOption>();
      try {
        const list = await archiveApi.list();
        list.forEach((a) => {
          merged.set(a.id, {
            id: a.id,
            name: a.name,
            birthYear: (a.birthDate || '').split('-')[0] || '',
            origin: a.birthPlace || '',
          });
        });
      } catch {
        // 接口失败时仅使用本地旧档案
      }
      loadArchives().forEach((a) => {
        if (!merged.has(a.id)) {
          merged.set(a.id, { id: a.id, name: a.name, birthYear: a.birthYear || '', origin: a.origin || '' });
        }
      });
      const options = Array.from(merged.values());
      setArchiveOptions(options);
      setStep(options.length > 0 ? 0 : 1);
      setCheckingArchives(false);
    };
    load();
  }, []);

  const selectArchive = (option: ArchiveOption) => {
    localStorage.setItem('cj_current_archive_id', option.id);
    setNewUser(false);
    addToast(`已选择「${option.name}」的人生档案`, 'success');
    const returnTo = (location.state as { from?: string } | null)?.from;
    if (returnTo) {
      navigate(returnTo, { replace: true });
    } else if (localStorage.getItem(`cj_biography_${option.id}`) || localStorage.getItem(`cj_biography_chapters_${option.id}`)) {
      navigate('/biography', { replace: true });
    } else {
      navigate('/interview', { replace: true });
    }
  };

  const canGoStep2 = Boolean(name.trim() && originProvince && originCity && originDistrict);

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
        addToast('请填写姓名并选择完整的籍贯（省 / 市 / 区）', 'error');
        return;
      }
      const birthParts = [birthYear, birthMonth, birthDay];
      if (birthParts.some(Boolean) && !birthParts.every(Boolean)) {
        addToast('请完整选择出生日期（年 / 月 / 日）', 'error');
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
    if (step === 1 && archiveOptions.length > 0) setStep(0);
    else if (step > 1) setStep(step - 1);
  };

  const startInterview = async () => {
    try {
      const archive = await archiveApi.create({
        type: 'self',
        name: name.trim(),
        gender: gender === '男' ? 'male' : 'female',
        birthDate: birthYear ? `${birthYear}-${birthMonth}-${birthDay}` : '',
        birthPlace: origin,
        status: 'living',
      });
      // 兼容旧 localStorage 格式，供未迁移页面读取
      const legacyArchive = {
        id: archive.id,
        name: archive.name,
        gender,
        birthYear,
        birthDate: birthYear ? `${birthYear}-${birthMonth}-${birthDay}` : undefined,
        origin,
        originDetail: originDetail.trim() || undefined,
        industry: industry || undefined,
        occupation,
      };
      saveArchive(legacyArchive);
      localStorage.setItem(`cj_interview_outline_${archive.id}`, JSON.stringify(outline));
      setNewUser(false);
      addToast('档案已创建，开始 AI 采访', 'success');
      const returnTo = (location.state as { from?: string } | null)?.from;
      navigate(returnTo || '/interview', { replace: true });
    } catch (err: any) {
      addToast(err.message || '创建档案失败', 'error');
    }
  };

  return (
    <div className="onboarding-page">
      <button type="button" className="onboarding-exit" onClick={() => navigate('/my-works')}>
        <ArrowLeft size={15} /> 返回我的传记
      </button>
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="onboarding-brand">
            <div className="onboarding-logo">传</div>
            <div>
              <h1 className="onboarding-title">欢迎来到传家世</h1>
              <p className="onboarding-subtitle">只需几步，即可用 AI 记录人生故事</p>
            </div>
          </div>
          {step > 0 && (
            <div className="onboarding-steps">
              <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
              <div className="step-line" />
              <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
              <div className="step-line" />
              <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
            </div>
          )}
        </div>

        <div className="onboarding-body">
          {checkingArchives && (
            <div className="onboarding-step">
              <p className="step-desc">正在读取人生档案…</p>
            </div>
          )}

          {!checkingArchives && step === 0 && (
            <div className="onboarding-step">
              <h2><FolderOpen size={20} /> 选择人生档案</h2>
              <p className="step-desc">您已有人生档案，请选择要为谁创作传记，或新建一份档案。</p>
              <div className="archive-select-list">
                {archiveOptions.map((option) => (
                  <button type="button" className="archive-select-card" key={option.id} onClick={() => selectArchive(option)}>
                    <Avatar name={option.name} size={44} />
                    <div className="archive-select-info">
                      <div className="archive-select-name">{option.name}</div>
                      <div className="archive-select-meta">
                        {[option.birthYear && `${option.birthYear} 年生`, option.origin].filter(Boolean).join(' · ') || '人生档案'}
                      </div>
                    </div>
                    <ChevronRight size={16} className="archive-select-arrow" />
                  </button>
                ))}
                <button type="button" className="archive-select-card archive-select-new" onClick={() => setStep(1)}>
                  <div className="archive-select-new-icon"><Plus size={20} /></div>
                  <div className="archive-select-info">
                    <div className="archive-select-name">新建人生档案</div>
                    <div className="archive-select-meta">为另一位家人创建档案</div>
                  </div>
                  <ChevronRight size={16} className="archive-select-arrow" />
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <Annotate id="onboarding.basic-form">
            <div className="onboarding-step">
              <h2><User size={20} /> 第一步：填写基本信息</h2>
              <p className="step-desc">这些信息会用于生成采访提纲和人生档案。</p>
              <div className="form-grid">
                <div className="form-row">
                  <label>姓名 <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="如：张三" />
                </div>
                <div className="form-row">
                  <label>性别</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value as '男' | '女')}>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
                <div className="form-row form-row-full">
                  <label>出生日期</label>
                  <div className="date-select-row">
                    <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)}>
                      <option value="">年</option>
                      {birthYearOptions.map((y) => (
                        <option value={y} key={y}>{y} 年</option>
                      ))}
                    </select>
                    <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}>
                      <option value="">月</option>
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                        <option value={m} key={m}>{Number(m)} 月</option>
                      ))}
                    </select>
                    <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)}>
                      <option value="">日</option>
                      {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                        <option value={d} key={d}>{Number(d)} 日</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row form-row-full">
                  <label>籍贯 <span style={{ color: '#dc2626' }}>*</span></label>
                  <div className="date-select-row">
                    <select value={originProvince} onChange={(e) => { setOriginProvince(e.target.value); setOriginCity(''); setOriginDistrict(''); }}>
                      <option value="">省份</option>
                      {regions.map((p) => (
                        <option value={p.name} key={p.name}>{p.name}</option>
                      ))}
                    </select>
                    <select value={originCity} onChange={(e) => { setOriginCity(e.target.value); setOriginDistrict(''); }} disabled={!originProvince}>
                      <option value="">城市</option>
                      {(regions.find((p) => p.name === originProvince)?.cities || []).map((c) => (
                        <option value={c.name} key={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <select value={originDistrict} onChange={(e) => setOriginDistrict(e.target.value)} disabled={!originCity}>
                      <option value="">区/县</option>
                      {(regions.find((p) => p.name === originProvince)?.cities.find((c) => c.name === originCity)?.districts || []).map((d) => (
                        <option value={d} key={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row form-row-full">
                  <label>详细地址</label>
                  <input type="text" value={originDetail} onChange={(e) => setOriginDetail(e.target.value)} placeholder="选填，如：平江路 12 号" />
                </div>
                <div className="form-row">
                  <label>行业</label>
                  <select value={industry} onChange={(e) => { setIndustry(e.target.value); setOccupation(''); }}>
                    <option value="">请选择行业</option>
                    {industryOptions.map((i) => (
                      <option value={i} key={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label>职业</label>
                  <select value={occupation} onChange={(e) => setOccupation(e.target.value)} disabled={!industry}>
                    <option value="">{industry ? '请选择职业' : '请先选择行业'}</option>
                    {(industryOccupations[industry] || []).map((o) => (
                      <option value={o} key={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            </Annotate>
          )}

          {step === 2 && (
            <Annotate id="onboarding.stages">
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
            </Annotate>
          )}

          {step === 3 && (
            <Annotate id="onboarding.outline">
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
            </Annotate>
          )}
        </div>

        <Annotate id="onboarding.start">
        {step > 0 && (
        <div className="onboarding-footer">
          {(step > 1 || archiveOptions.length > 0) && (
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
        )}
        </Annotate>
      </div>
    </div>
  );
}
