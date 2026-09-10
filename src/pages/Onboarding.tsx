import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Plus, Trash2, Mic, Sparkles, User, FolderOpen, ChevronRight, ChevronUp, ChevronDown, FileText, Upload } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { archiveApi } from '../api/archive';
import Avatar from '../components/ui/Avatar';
import Annotate from '../components/annotation/Annotate';
import { regions } from '../data/regions';
import { industryOptions, industryOccupations } from '../data/occupations';
import { readDocumentText } from '../utils/documentImport';
import LifeEvents from './LifeEvents';
import ArchiveEnrichment from './ArchiveEnrichment';
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

const defaultOutlineItems = ['这一阶段最值得记录的经历是什么？', '当时有哪些重要的人陪伴或影响了您？', '回头看，这段经历带给您最大的收获是什么？'];

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

function generateOutline(basic: { name: string; occupation: string; origin: string; birthYear: string }, stages: LifeStage[], importedText = ''): OutlineGroup[] {
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

  if (importedText.trim()) {
    groups[0] = {
      ...groups[0],
      items: [
        ...groups[0].items,
        { text: '已读取上传传记内容，后续采访将围绕原文中的关键经历继续补充。' },
        { text: `请结合原文内容，补充最希望家人记住的故事：${importedText.replace(/\s+/g, ' ').slice(0, 80)}${importedText.length > 80 ? '…' : ''}` },
      ],
    };
  }

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
    groups.push(
      {
        title: '工作与事业',
        items: [
          { text: `作为一名${basic.occupation}，您职业生涯中最重要的转折点是什么？` },
          { text: '工作中最让您自豪的成就是什么？' },
          { text: '您如何看待事业与家庭的平衡？' },
        ],
      },
      {
        title: '人生转折',
        items: [
          { text: '人生中有哪些关键选择，后来改变了您的方向？' },
          { text: '遇到过哪些困难或低谷，您是怎样走出来的？' },
        ],
      },
      {
        title: '家庭与亲情',
        items: [
          { text: '您和伴侣相识、相知的经历是怎样的？' },
          { text: '作为父母，您最希望孩子记住什么？' },
          { text: '家人曾经给过您哪些重要的支持？' },
        ],
      },
      {
        title: '时代与社会',
        items: [
          { text: '您经历过哪些时代变化，对生活影响最大？' },
          { text: '那个年代的人和事，给您留下了什么印象？' },
        ],
      },
      {
        title: '家风与传承',
        items: [
          { text: '家里一直坚持的家风家训是什么？' },
          { text: '您最想把哪些生活经验传给下一代？' },
        ],
      },
    );
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
  const importInputRef = useRef<HTMLInputElement>(null);
  const uploadMode = (location.state as { mode?: string } | null)?.mode === 'upload';

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
  const [stages] = useState<LifeStage[]>([]);
  const [outline, setOutline] = useState<OutlineGroup[]>([]);
  const [importedText, setImportedText] = useState('');
  const [importedFileName, setImportedFileName] = useState('');
  const [importing, setImporting] = useState(false);

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
      setStep(uploadMode ? 1 : options.length > 0 ? 0 : 1);
      setCheckingArchives(false);
    };
    load();
  }, [uploadMode]);

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

  const next = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  const goToEnrichment = () => {
    setStep(4);
  };

  const goToLifeEvents = () => {
    setStep(3);
  };

  const goToOutline = () => {
    setOutline(generateOutline(basic, stages, importedText));
    setStep(5);
  };

  const updateOutlineGroup = (groupIndex: number, title: string) => {
    setOutline((current) => current.map((group, index) => index === groupIndex ? { ...group, title } : group));
  };

  const updateOutlineItem = (groupIndex: number, itemIndex: number, text: string) => {
    setOutline((current) => current.map((group, index) => index === groupIndex
      ? { ...group, items: group.items.map((item, itemIndexInGroup) => itemIndexInGroup === itemIndex ? { ...item, text } : item) }
      : group));
  };

  const addOutlineItem = (groupIndex: number) => {
    setOutline((current) => current.map((group, index) => index === groupIndex
      ? { ...group, items: [...group.items, { text: '请输入采访话题' }] }
      : group));
  };

  const addOutlineGroup = () => {
    setOutline((current) => [...current, { title: '新章节', items: defaultOutlineItems.map((text) => ({ text })) }]);
  };

  const removeOutlineGroup = (groupIndex: number) => {
    setOutline((current) => current.filter((_, index) => index !== groupIndex));
  };

  const moveOutlineGroup = (groupIndex: number, direction: -1 | 1) => {
    setOutline((current) => {
      const targetIndex = groupIndex + direction;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      [next[groupIndex], next[targetIndex]] = [next[targetIndex], next[groupIndex]];
      return next;
    });
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    try {
      const text = await readDocumentText(file);
      if (!text.trim()) {
        addToast('没有读到传记内容，请重新上传', 'error');
        return;
      }
      setImportedText(text);
      setImportedFileName(file.name);
      addToast('已有传记已加入人生档案素材', 'success');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : '文件暂时无法读取，请上传 .docx 或 .txt 文件', 'error');
    } finally {
      setImporting(false);
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
      if (importedText.trim()) {
        localStorage.setItem(`cj_imported_biography_${archive.id}`, JSON.stringify({
          fileName: importedFileName || '已有传记素材',
          text: importedText,
          updatedAt: new Date().toLocaleString('zh-CN'),
        }));
      }
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
            <div className="onboarding-steps onboarding-steps-five">
              <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
              <div className="step-line" />
              <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
              <div className="step-line" />
              <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
              <div className="step-line" />
              <div className={`step-dot ${step >= 4 ? 'active' : ''}`}>4</div>
              <div className="step-line" />
              <div className={`step-dot ${step >= 5 ? 'active' : ''}`}>5</div>
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
                  <label>出生日期 <span style={{ color: '#dc2626' }}>*</span></label>
                  <div className="date-select-row">
                    <select required value={birthYear} onChange={(e) => setBirthYear(e.target.value)}>
                      <option value="">年</option>
                      {birthYearOptions.map((y) => (
                        <option value={y} key={y}>{y} 年</option>
                      ))}
                    </select>
                    <select required value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}>
                      <option value="">月</option>
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                        <option value={m} key={m}>{Number(m)} 月</option>
                      ))}
                    </select>
                    <select required value={birthDay} onChange={(e) => setBirthDay(e.target.value)}>
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
                  <label>行业 <span style={{ color: '#dc2626' }}>*</span></label>
                  <select required value={industry} onChange={(e) => { setIndustry(e.target.value); setOccupation(''); }}>
                    <option value="">请选择行业</option>
                    {industryOptions.map((i) => (
                      <option value={i} key={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label>职业 <span style={{ color: '#dc2626' }}>*</span></label>
                  <select required value={occupation} onChange={(e) => setOccupation(e.target.value)} disabled={!industry}>
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
            <div className="onboarding-step onboarding-upload-step">
              <h2><FileText size={20} /> 第二步：上传已有传记</h2>
              <p className="step-desc">上传已有文字资料，系统会将它作为人生档案素材，并在后续提纲中继续补充。没有资料也可以跳过。</p>
              <div className="onboarding-import-card">
                <div className="onboarding-import-heading">
                  <div className="onboarding-import-icon"><FileText size={18} /></div>
                  <div>
                    <strong>已有传记资料</strong>
                    <p>支持 Word、TXT 或 Markdown 文件，上传后可在传记提纲中看到相关素材。</p>
                  </div>
                </div>
                <input
                  ref={importInputRef}
                  className="onboarding-import-input"
                  type="file"
                  accept=".docx,.txt,.md"
                  onChange={(e) => handleImportFile(e.target.files?.[0])}
                />
                {importedFileName ? (
                  <div className="onboarding-import-file">
                    <FileText size={15} />
                    <span>{importedFileName}</span>
                    <button type="button" onClick={() => { setImportedText(''); setImportedFileName(''); }}>移除</button>
                  </div>
                ) : (
                  <button type="button" className="btn btn-outline onboarding-import-button" onClick={() => importInputRef.current?.click()} disabled={importing}>
                    <Upload size={14} /> {importing ? '读取中…' : '上传已有传记'}
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 3 && <LifeEvents embedded onContinue={goToEnrichment} onSkip={goToEnrichment} />}

          {step === 4 && <ArchiveEnrichment embedded onContinue={goToOutline} onSkip={goToOutline} />}

          {step === 5 && (
            <Annotate id="onboarding.outline">
            <div className="onboarding-step outline-step">
              <div className="outline-heading">
                <div>
                  <div className="outline-eyebrow"><Sparkles size={14} /> 采访前的最后确认</div>
                  <h2>第五步：确认传记提纲</h2>
                  <p className="step-desc">这是整本传记的写作骨架。确认后，AI 会按章节顺序逐章采访，不跳题、不跑题。</p>
                </div>
                <button type="button" className="btn btn-outline" onClick={addOutlineGroup}><Plus size={14} /> 新增章节</button>
              </div>

              <div className="outline-overview">
                <div><strong>{outline.length}</strong><span>个章节</span></div>
                <div><strong>{outline.reduce((total, group) => total + group.items.length, 0)}</strong><span>个采访话题</span></div>
                <p>内容来自基础信息、人生大事件和多维增补，可按需调整。</p>
              </div>

              <div className="outline-editor">
                {outline.map((group, gi) => (
                  <section className="outline-editor-group" key={`${group.title}-${gi}`}>
                    <div className="outline-editor-head">
                      <span className="outline-order">{String(gi + 1).padStart(2, '0')}</span>
                      <input aria-label={`第${gi + 1}章名称`} value={group.title} onChange={(event) => updateOutlineGroup(gi, event.target.value)} />
                      <div className="outline-group-actions">
                        <button type="button" aria-label="上移章节" onClick={() => moveOutlineGroup(gi, -1)} disabled={gi === 0}><ChevronUp size={15} /></button>
                        <button type="button" aria-label="下移章节" onClick={() => moveOutlineGroup(gi, 1)} disabled={gi === outline.length - 1}><ChevronDown size={15} /></button>
                        <button type="button" className="outline-delete" aria-label="删除章节" onClick={() => removeOutlineGroup(gi)} disabled={outline.length <= 1}><Trash2 size={15} /></button>
                      </div>
                    </div>
                    <div className="outline-topic-list">
                      <div className="outline-topic-label">本章采访话题</div>
                      {group.items.map((item, ii) => (
                        <div className="outline-topic-row" key={`${item.text}-${ii}`}>
                          <span>{ii + 1}</span>
                          <input aria-label={`${group.title}第${ii + 1}个采访主题`} value={item.text} onChange={(event) => updateOutlineItem(gi, ii, event.target.value)} />
                        </div>
                      ))}
                      <button type="button" className="outline-add-topic" onClick={() => addOutlineItem(gi)}>+ 添加采访话题</button>
                    </div>
                  </section>
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
          {step === 1 ? (
            <button className="btn btn-primary" onClick={next}>
              下一步 <ArrowRight size={14} />
            </button>
          ) : step === 2 ? (
            <div className="onboarding-footer-actions">
              <button className="btn btn-outline" onClick={goToLifeEvents}>跳过此步</button>
              <button className="btn btn-primary" onClick={goToLifeEvents}>
                下一步 <ArrowRight size={14} />
              </button>
            </div>
          ) : step === 5 ? (
            <button className="btn btn-primary" onClick={startInterview}>
              确认提纲，开始 AI 采访 <Mic size={14} />
            </button>
          ) : null}
        </div>
        )}
        </Annotate>
      </div>
    </div>
  );
}
