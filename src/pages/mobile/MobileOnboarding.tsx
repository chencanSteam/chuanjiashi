import { useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, FileText, Mic, Plus, Trash2, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { regions } from '../../data/regions';
import { industryOptions, industryOccupations } from '../../data/occupations';
import LifeEvents from '../LifeEvents';
import ArchiveEnrichment from '../ArchiveEnrichment';
import './MobileOnboarding.css';

type Chapter = { title: string; topics: string[] };

const defaultChapters: Chapter[] = [
  { title: '成长与家庭', topics: ['童年记忆中最难忘的画面是什么？', '小时候家里的长辈对您影响最大的一句话是什么？', '学生时代的兴趣爱好是怎样形成的？'] },
  { title: '学习与成长', topics: ['求学期间遇到过哪些改变人生轨迹的老师或同学？', '为什么选择现在的职业方向？'] },
  { title: '工作与事业', topics: ['职业生涯中最重要的转折点是什么？', '工作中最让您自豪的成就是什么？', '您如何看待事业与家庭的平衡？'] },
  { title: '人生转折', topics: ['人生中有哪些关键选择，后来改变了您的方向？', '遇到过哪些困难或低谷，您是怎样走出来的？'] },
  { title: '家庭与亲情', topics: ['您和伴侣相识、相知的经历是怎样的？', '作为父母，您最希望孩子记住什么？', '家人曾经给过您哪些重要的支持？'] },
  { title: '时代与社会', topics: ['您经历过哪些时代变化，对生活影响最大？', '那个年代的人和事，给您留下了什么印象？'] },
  { title: '家风与传承', topics: ['家里一直坚持的家风家训是什么？', '您最想把哪些生活经验传给下一代？'] },
  { title: '人生感悟', topics: ['回顾一生，您最想对晚辈说的话是什么？', '如果用一个词总结自己的人生，您会选择哪个词？'] },
];

const stepNames = ['填写基本信息', '上传已有传记', '人生大事件', '多维增补', '确认传记提纲'];
const birthYears = Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, index) => String(new Date().getFullYear() - index));
export default function MobileOnboarding() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('用户8000');
  const [gender, setGender] = useState('男');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [originProvince, setOriginProvince] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [originDistrict, setOriginDistrict] = useState('');
  const [industry, setIndustry] = useState('');
  const [occupation, setOccupation] = useState('');
  const [fileName, setFileName] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>(defaultChapters);
  const [expanded, setExpanded] = useState<number | null>(0);

  const updateChapter = (index: number, patch: Partial<Chapter>) => {
    setChapters((current) => current.map((chapter, i) => i === index ? { ...chapter, ...patch } : chapter));
  };

  const updateTopic = (chapterIndex: number, topicIndex: number, text: string) => {
    setChapters((current) => current.map((chapter, i) => i === chapterIndex
      ? { ...chapter, topics: chapter.topics.map((topic, j) => j === topicIndex ? text : topic) }
      : chapter));
  };

  const saveAndStart = () => {
    const id = `archive_mobile_${Date.now()}`;
    const origin = `${originProvince}${originCity}${originDistrict}`;
    const archive = { id, name: name.trim() || '用户8000', gender, birthYear, birthDate: birthYear ? `${birthYear}-${birthMonth}-${birthDay}` : undefined, origin, occupation };
    const existing = JSON.parse(localStorage.getItem('cj_archives') || '[]');
    localStorage.setItem('cj_archives', JSON.stringify([...existing, archive]));
    localStorage.setItem('cj_current_archive_id', id);
    localStorage.setItem(`cj_interview_outline_${id}`, JSON.stringify(chapters));
    addToast('档案已创建，开始 AI 智能采访', 'success');
    navigate('/m/interview');
  };

  return (
    <div className="mobile-onboarding">
      <header className="mobile-onboarding-header">
        <button type="button" className="mobile-onboarding-back" onClick={() => navigate('/m')}><ArrowLeft size={17} /> 返回</button>
        <div className="mobile-onboarding-brand"><span>传</span><div><strong>欢迎来到传家世</strong><small>只需几步，即可用 AI 记录人生故事</small></div></div>
        <div className="mobile-onboarding-progress">
          {stepNames.map((name, index) => <div className={`mobile-progress-step${step >= index + 1 ? ' active' : ''}`} key={name}><i>{index + 1}</i><small>{name}</small></div>)}
        </div>
      </header>

      <main className="mobile-onboarding-body">
        {step === 1 && <section className="mobile-onboarding-step">
          <h1>第一步：填写基本信息</h1><p className="mobile-step-desc">这些信息会用于生成采访提纲和人生档案。</p>
          <label>姓名 <em>*</em><input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>性别<select value={gender} onChange={(e) => setGender(e.target.value)}><option>男</option><option>女</option></select></label>
          <label>出生日期<div className="mobile-cascade-row"><select value={birthYear} onChange={(e) => setBirthYear(e.target.value)}><option value="">年</option>{birthYears.map((item) => <option key={item}>{item} 年</option>)}</select><select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}><option value="">月</option>{Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0')).map((item) => <option key={item}>{Number(item)} 月</option>)}</select><select value={birthDay} onChange={(e) => setBirthDay(e.target.value)}><option value="">日</option>{Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, '0')).map((item) => <option key={item}>{Number(item)} 日</option>)}</select></div></label>
          <label>籍贯 <em>*</em><div className="mobile-cascade-row"><select value={originProvince} onChange={(e) => { setOriginProvince(e.target.value); setOriginCity(''); setOriginDistrict(''); }}><option value="">省份</option>{regions.map((item) => <option key={item.name}>{item.name}</option>)}</select><select value={originCity} disabled={!originProvince} onChange={(e) => { setOriginCity(e.target.value); setOriginDistrict(''); }}><option value="">城市</option>{(regions.find((item) => item.name === originProvince)?.cities || []).map((item) => <option key={item.name}>{item.name}</option>)}</select><select value={originDistrict} disabled={!originCity} onChange={(e) => setOriginDistrict(e.target.value)}><option value="">区/县</option>{(regions.find((item) => item.name === originProvince)?.cities.find((item) => item.name === originCity)?.districts || []).map((item) => <option key={item}>{item}</option>)}</select></div></label>
          <label>行业 <em>*</em><select value={industry} onChange={(e) => { setIndustry(e.target.value); setOccupation(''); }}><option value="">请选择行业</option>{industryOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>职业 <em>*</em><select value={occupation} disabled={!industry} onChange={(e) => setOccupation(e.target.value)}><option value="">{industry ? '请选择职业' : '请先选择行业'}</option>{(industryOccupations[industry] || []).map((item) => <option key={item}>{item}</option>)}</select></label>
        </section>}

        {step === 2 && <section className="mobile-onboarding-step">
          <h1>第二步：上传已有传记</h1><p className="mobile-step-desc">已有传记可以直接上传，系统会基于原文继续补充，也可以跳过。</p>
          <div className="mobile-upload-card"><FileText size={24} /><strong>{fileName || '还没有上传传记'}</strong><small>支持 Word、TXT 或 Markdown 文件</small><label className="mobile-upload-button"><Upload size={15} /> {fileName ? '重新上传' : '上传已有传记'}<input type="file" accept=".doc,.docx,.txt,.md" onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} /></label></div>
        </section>}

        {step === 3 && <LifeEvents embedded onContinue={() => setStep(4)} onSkip={() => setStep(4)} />}

        {step === 4 && <ArchiveEnrichment embedded onContinue={() => setStep(5)} onSkip={() => setStep(5)} />}

        {step === 5 && <section className="mobile-onboarding-step"><div className="mobile-outline-heading"><div><h1>第五步：确认传记提纲</h1><p className="mobile-step-desc">系统已根据前面的信息生成八大章节，可修改、删除或新增。</p></div><strong>{chapters.length} 个章节</strong></div><div className="mobile-outline-list">{chapters.map((chapter, index) => <article key={`${chapter.title}-${index}`}><button type="button" className="mobile-outline-title" onClick={() => setExpanded(expanded === index ? null : index)}><b>{String(index + 1).padStart(2, '0')}</b><input value={chapter.title} onChange={(e) => updateChapter(index, { title: e.target.value })} onClick={(e) => e.stopPropagation()} /><span>{expanded === index ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</span><button type="button" className="mobile-outline-delete" onClick={(e) => { e.stopPropagation(); setChapters((current) => current.filter((_, i) => i !== index)); }}><Trash2 size={15} /></button></button>{expanded === index && <div className="mobile-outline-topics">{chapter.topics.map((topic, topicIndex) => <label key={`${topic}-${topicIndex}`}><span>{topicIndex + 1}</span><input value={topic} onChange={(e) => updateTopic(index, topicIndex, e.target.value)} /></label>)}<button type="button" className="mobile-add-topic" onClick={() => updateChapter(index, { topics: [...chapter.topics, '请输入采访主题'] })}><Plus size={14} /> 添加采访主题</button></div>}</article>)}</div><button type="button" className="mobile-add-chapter" onClick={() => setChapters((current) => [...current, { title: '新章节', topics: ['请输入采访主题'] }])}><Plus size={15} /> 新增章节</button></section>}
      </main>

      {step !== 3 && step !== 4 && <footer className="mobile-onboarding-footer">
        <button type="button" className="mobile-secondary-button" onClick={() => step > 1 ? setStep(step - 1) : navigate('/m')}><ArrowLeft size={15} /> 上一步</button>
        {step === 2 && <button type="button" className="mobile-secondary-button" onClick={() => setStep(3)}>跳过此步</button>}
        {step === 3 && <button type="button" className="mobile-secondary-button" onClick={() => setStep(4)}>跳过此步</button>}
        {step === 4 && <button type="button" className="mobile-secondary-button" onClick={() => setStep(5)}>跳过此步</button>}
        {step < 5 ? <button type="button" className="mobile-primary-button" onClick={() => setStep(step + 1)}>下一步 <ArrowRight size={15} /></button> : <button type="button" className="mobile-primary-button" onClick={saveAndStart}><Mic size={15} /> 确认提纲，开始 AI 采访</button>}
      </footer>}
    </div>
  );
}
