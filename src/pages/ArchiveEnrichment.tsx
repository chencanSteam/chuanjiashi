import { useMemo, useRef, useState } from 'react';
import { Camera, Check, ChevronDown, ChevronUp, Mic, Plus, Users } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { generateImageDataUrl } from '../utils/mediaPlaceholder';
import './ArchiveEnrichment.css';

type ChoiceGroup = { id: string; title: string; options: string[]; multiple?: boolean };
type SavedEnrichment = { id: string; archiveName: string; updatedAt: string; selectedLabels: string[]; people: string[]; style: string };
export type ArchiveEnrichmentProps = {
  embedded?: boolean;
  hideTitle?: boolean;
  onContinue?: () => void;
  onSkip?: () => void;
  stepNumber?: number;
};

const choiceGroups: ChoiceGroup[] = [
  { id: 'era', title: '主要成长年代', options: ['50年代', '60年代', '70年代', '80年代', '90年代', '00年代', '改革开放初期', '乡村建设时期', '城市快速发展期'], multiple: true },
  { id: 'hometown', title: '家乡地域特色', options: ['江南水乡', '北方平原', '山区丘陵', '沿海渔村', '中原农耕', '西南乡土', '工矿城镇', '少数民族民俗'], multiple: true },
  { id: 'change', title: '深刻的时代变化', options: ['计划经济时代', '改革开放浪潮', '市场经济发展', '大规模城镇化', '科技飞速进步', '生活条件大幅改善'], multiple: true },
  { id: 'scene', title: '难忘生活老场景', options: ['老式宅院', '农村土房', '单位家属院', '老城区街巷', '工厂宿舍', '旧校园'], multiple: true },
  { id: 'object', title: '珍藏老物件类型', options: ['老照片', '奖状证书', '老工作证件', '老工具', '纪念礼物', '旧书信'], multiple: true },
  { id: 'principle', title: '一生坚守做人原则', options: ['诚实守信', '踏实肯干', '知恩感恩', '宽容待人', '勤俭持家', '正直担当', '善良厚道', '稳重谦和'], multiple: true },
  { id: 'family-style', title: '优良家风理念', options: ['孝顺长辈', '重视教育', '家庭和睦', '勤俭立业', '待人真诚', '踏实做事', '低调做人', '懂得感恩'], multiple: true },
];

const relationOptions = ['父母', '祖辈', '恩师', '贵人', '前辈', '搭档', '挚友', '配偶', '子女', '领导'];

const supplementMockValues: Record<string, string> = {
  'background-supplement': '改革开放后家乡变化很大，从老街巷到新城区，家里的生活条件一步步改善。',
  'memory-supplement': '父亲留下的旧工具箱一直保存到现在，每次看到它都会想起一起修理收音机的日子。',
  'values-supplement': '最骄傲的是一家人始终互相支持，也希望晚辈记住踏实做事、诚实待人。',
  'style-supplement': '不展开描述家庭成员之间的矛盾和涉及隐私的具体细节。',
};

function enrichmentStorageKey() {
  return `cj_archive_enrichment_confirmed_${localStorage.getItem('cj_current_archive_id') || 'default'}`;
}

function loadSavedEnrichment(): SavedEnrichment | null {
  try {
    const raw = localStorage.getItem(enrichmentStorageKey());
    return raw ? JSON.parse(raw) as SavedEnrichment : null;
  } catch {
    return null;
  }
}

export default function ArchiveEnrichment({ embedded = false, hideTitle = false, onContinue, onSkip, stepNumber = 4 }: ArchiveEnrichmentProps) {
  const { addToast } = useToast();
  const [selected, setSelected] = useState<Record<string, string[]>>({
    era: ['80年代', '改革开放初期'],
    hometown: ['江南水乡', '工矿城镇'],
    change: ['改革开放浪潮', '科技飞速进步'],
    scene: ['老式宅院', '工厂宿舍'],
    object: ['老照片', '老工具', '旧书信'],
    principle: ['踏实肯干', '知恩感恩'],
    'family-style': ['重视教育', '家庭和睦'],
  });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [people, setPeople] = useState([
    { id: 1, name: '王老师', relation: '恩师', story: '在我刚参加工作时给过很多指导。' },
    { id: 2, name: '张师傅', relation: '前辈', story: '带我熟悉车间和设备，让我真正打牢了技术基础。' },
    { id: 3, name: '李晓如', relation: '配偶', story: '在创业和家庭生活中始终给予理解与支持。' },
  ]);
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, number>>({});
  const [style, setStyle] = useState('温情家常');
  const [savedRecord] = useState<SavedEnrichment | null>(() => loadSavedEnrichment());
  const sampleImages = useMemo(() => [
    { title: '家乡老街', src: generateImageDataUrl('江南水乡 · 老街记忆') },
    { title: '车间岁月', src: generateImageDataUrl('工厂宿舍 · 工作岁月') },
    { title: '珍藏老物件', src: generateImageDataUrl('父亲的旧工具箱') },
    { title: '家庭合影', src: generateImageDataUrl('一家人 · 温暖时光') },
    { title: '家风合照', src: generateImageDataUrl('春节团聚 · 家风传承') },
    { title: '成长手稿', src: generateImageDataUrl('泛黄日记 · 人生记录') },
  ], []);
  // 人生档案已经对应单个传主，直接进入多维增补内容，不再展示外层记录列表。
  const [isEditing, setIsEditing] = useState(() => embedded ? !loadSavedEnrichment() : false);
  const toggle = (groupId: string, option: string) => {
    setSelected((prev) => {
      const values = prev[groupId] || [];
      return { ...prev, [groupId]: values.includes(option) ? values.filter((item) => item !== option) : [...values, option] };
    });
  };

  const updatePerson = (id: number, key: 'name' | 'relation' | 'story', value: string) => {
    setPeople((prev) => prev.map((person) => person.id === id ? { ...person, [key]: value } : person));
  };

  const uploadPhoto = (label: string, groupId?: string) => {
    const shouldRestore = window.confirm('是否修复老照片？');
    if (groupId) {
      setUploadedPhotos((prev) => ({ ...prev, [groupId]: (prev[groupId] || 0) + 1 }));
    }
    addToast(shouldRestore ? `${label}已修复并保存（演示）` : `${label}已保存（演示）`, 'success');
  };

  const uploadSupplement = (label: string, groupId: string) => {
    setUploadedPhotos((prev) => ({ ...prev, [groupId]: (prev[groupId] || 0) + 1 }));
    addToast(`${label}已上传（演示）`, 'success');
  };

  const handleComplete = () => {
    const selectedLabels = Object.values(selected).flat();
    localStorage.setItem(enrichmentStorageKey(), JSON.stringify({
      id: 'mock-enrichment',
      archiveName: savedRecord?.archiveName || '张明远',
      updatedAt: '刚刚更新',
      selectedLabels,
      people: people.map((person) => `${person.name} · ${person.relation}`),
      style,
    } satisfies SavedEnrichment));
    setIsEditing(false);
    addToast('多维增补已保存', 'success');
  };

  if (!isEditing) {
    const dimensionGroups = [
      { title: '时代地域背景', items: [{ id: 'era', title: '主要成长年代' }, { id: 'hometown', title: '家乡地域特色' }, { id: 'change', title: '深刻的时代变化' }], images: sampleImages.slice(0, 2) },
      { title: '记忆锚点', items: [{ id: 'scene', title: '难忘生活老场景' }, { id: 'object', title: '珍藏老物件类型' }], images: sampleImages.slice(2, 4) },
      { title: '人生价值观与家风', items: [{ id: 'principle', title: '一生坚守做人原则' }, { id: 'family-style', title: '优良家风理念' }], images: sampleImages.slice(4, 6) },
    ];
    return (
      <div className="archive-enrichment-page">
        {(embedded || !hideTitle) && <header className="page-header archive-enrichment-header">
          <div><h1 className="page-title">{embedded ? `第${stepNumber}步：多维增补` : '多维增补'}</h1></div>
          {embedded && <button className="btn btn-outline" onClick={onSkip}>跳过此步</button>}
        </header>}
        <div className="archive-enrichment-read-view">
          <div className="archive-enrichment-summary-head archive-enrichment-summary-head-actions">
            <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(true)}>编辑信息</button>
          </div>
          {dimensionGroups.map((dimension, index) => (
            <section className="archive-enrichment-read-dimension card" key={dimension.title}>
              <header><span className="archive-enrichment-number">{index === 0 ? '01' : `0${index + 2}`}</span><h2>{dimension.title}</h2></header>
              <div className="archive-enrichment-read-body">
                <div className="archive-enrichment-read-fields">{dimension.items.map((item) => (
                  <div key={item.id}><h3>{item.title}</h3><div className="archive-enrichment-read-tags">{(selected[item.id] || []).map((label) => <span key={label}>{label}</span>)}</div></div>
                ))}</div>
                <div className="archive-enrichment-read-note"><h3>补充说明</h3><p>{supplementMockValues[['background-supplement', 'memory-supplement', 'values-supplement'][index]]}</p></div>
                <div className="archive-enrichment-read-images">{dimension.images.map((image) => <figure key={image.title}><img src={image.src} alt={image.title} /><figcaption>{image.title}</figcaption></figure>)}</div>
              </div>
            </section>
          ))}
          <section className="archive-enrichment-read-dimension archive-enrichment-read-people card">
            <header><span className="archive-enrichment-number">02</span><h2>关键人物关系</h2></header>
            <div className="archive-enrichment-read-body">{people.map((person) => <div className="archive-enrichment-read-person" key={person.id}><strong>{person.name}</strong><span>{person.relation}</span><p>{person.story}</p></div>)}</div>
          </section>
        </div>
        {embedded && <div className="archive-enrichment-embedded-footer"><button className="btn btn-primary" onClick={onContinue}>进入下一步 <ChevronDown size={14} /></button></div>}
      </div>
    );
  }

  return (
    <div className="archive-enrichment-page">
      {(embedded || !hideTitle) && <header className="page-header archive-enrichment-header">
        <div><h1 className="page-title">{embedded ? `第${stepNumber}步：多维增补` : '多维增补'}</h1></div>
        <div className="archive-enrichment-actions">
          {embedded && <button className="btn btn-outline" onClick={onSkip}>跳过此步</button>}
        </div>
      </header>}

      <section className="archive-enrichment-block card">
        <button className="archive-enrichment-block-head" onClick={() => setCollapsed((prev) => ({ ...prev, background: !prev.background }))}><span className="archive-enrichment-number">01</span><span><strong>时代地域背景</strong><small>还原人物成长的年代、地域和时代变化</small></span>{collapsed.background ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
      {!collapsed.background && <div className="archive-enrichment-block-body"><div className="archive-enrichment-choice-grid">{choiceGroups.slice(0, 3).map((group) => <ChoiceSection key={group.id} group={group} values={selected[group.id] || []} onToggle={toggle} onUpload={uploadSupplement} />)}</div><SupplementField placeholder="还有哪些时代背景或家乡记忆想补充？（选填）" label="时代地域补充" groupId="background-supplement" onUpload={uploadSupplement} /></div>}
      </section>

      <section className="archive-enrichment-block card">
        <button className="archive-enrichment-block-head" onClick={() => setCollapsed((prev) => ({ ...prev, people: !prev.people }))}><span className="archive-enrichment-number">02</span><span><strong>关键人物关系</strong><small>记录对你产生过重要影响的人</small></span>{collapsed.people ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
        {!collapsed.people && <div className="archive-enrichment-block-body"><div className="archive-enrichment-people-list">{people.map((person) => <div className="archive-enrichment-person" key={person.id}><Users size={17} /><input value={person.name} onChange={(e) => updatePerson(person.id, 'name', e.target.value)} placeholder="人物姓名" /><select value={person.relation} onChange={(e) => updatePerson(person.id, 'relation', e.target.value)}>{relationOptions.map((item) => <option key={item}>{item}</option>)}</select><input value={person.story} onChange={(e) => updatePerson(person.id, 'story', e.target.value)} placeholder="对我影响或难忘故事" /><button className="archive-enrichment-photo" onClick={() => uploadPhoto('人物照片')}><Camera size={14} /> 图片</button></div>)}</div><button className="btn btn-outline btn-sm" onClick={() => setPeople((prev) => [...prev, { id: Date.now(), name: '', relation: relationOptions[0], story: '' }])}><Plus size={14} /> 添加人物</button></div>}
      </section>

      <section className="archive-enrichment-block card">
        <button className="archive-enrichment-block-head" onClick={() => setCollapsed((prev) => ({ ...prev, memory: !prev.memory }))}><span className="archive-enrichment-number">03</span><span><strong>记忆锚点</strong><small>选择有代表性的生活场景和老物件</small></span>{collapsed.memory ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
      {!collapsed.memory && <div className="archive-enrichment-block-body"><div className="archive-enrichment-choice-grid">{choiceGroups.slice(3, 5).map((group) => <ChoiceSection key={group.id} group={group} values={selected[group.id] || []} onToggle={toggle} onUpload={uploadSupplement} />)}</div><SupplementField placeholder="物件或场景承载的回忆（选填）" label="记忆锚点补充" groupId="memory-supplement" onUpload={uploadSupplement} /></div>}
      </section>

      <section className="archive-enrichment-block card">
        <button className="archive-enrichment-block-head" onClick={() => setCollapsed((prev) => ({ ...prev, values: !prev.values }))}><span className="archive-enrichment-number">04</span><span><strong>人生价值观与家风</strong><small>沉淀一生坚持的原则和想传给后辈的家风</small></span>{collapsed.values ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
      {!collapsed.values && <div className="archive-enrichment-block-body"><div className="archive-enrichment-choice-grid">{choiceGroups.slice(5).map((group) => <ChoiceSection key={group.id} group={group} values={selected[group.id] || []} onToggle={toggle} onUpload={uploadSupplement} />)}</div><SupplementField placeholder="自己一生最骄傲、最无悔的 1-2 件事（选填）" label="价值观与家风补充" groupId="values-supplement" onUpload={uploadSupplement} /></div>}
      </section>

      <section className="archive-enrichment-block card">
        <button className="archive-enrichment-block-head" onClick={() => setCollapsed((prev) => ({ ...prev, style: !prev.style }))}><span className="archive-enrichment-number">05</span><span><strong>成书风格与边界</strong><small>告诉系统希望如何呈现，以及哪些内容需要避开</small></span>{collapsed.style ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
      {!collapsed.style && <div className="archive-enrichment-block-body"><div className="archive-enrichment-style-row"><label>传记文风</label>{['温情家常', '严谨纪实', '简洁大气'].map((item) => <button className={style === item ? 'active' : ''} key={item} onClick={() => setStyle(item)}><Check size={14} />{item}</button>)}</div><div className="archive-enrichment-checks"><label><input type="checkbox" defaultChecked /> 留给后代</label><label><input type="checkbox" /> 自我珍藏</label><label><input type="checkbox" /> 亲友传阅</label></div><div className="archive-enrichment-style-upload"><span>相关照片或手稿（选填）</span><button className="archive-enrichment-photo" onClick={() => uploadPhoto('成书风格素材', 'style')}><Camera size={14} /> 上传图片{uploadedPhotos.style ? '（' + uploadedPhotos.style + '）' : ''}</button></div><SupplementField placeholder="希望 AI 规避、不提及的往事（选填）" label="成书边界补充" groupId="style-supplement" onUpload={uploadSupplement} /></div>}
      </section>

      <div className="archive-enrichment-tip">所有内容均为选填，不填写不影响传记生成。</div>
      {embedded && <div className="archive-enrichment-embedded-footer"><button className="btn btn-primary" onClick={onContinue}>保存并进入下一步 <ChevronDown size={14} /></button></div>}
      {!embedded && <div className="archive-enrichment-embedded-footer"><button className="btn btn-primary" onClick={handleComplete}>完成</button></div>}

    </div>
  );
}

function ChoiceSection({ group, values, onToggle, onUpload }: { group: ChoiceGroup; values: string[]; onToggle: (groupId: string, option: string) => void; onUpload: (label: string, groupId: string) => void }) {
  return <div className="archive-enrichment-choice-section"><h3><span>{group.title}<small>可多选</small></span></h3><div className="archive-enrichment-chips">{group.options.map((option) => <button key={option} className={values.includes(option) ? 'active' : ''} onClick={() => onToggle(group.id, option)}>{values.includes(option) && <Check size={13} />}{option}</button>)}</div><SupplementField className="archive-enrichment-other-field" placeholder="其他补充（选填）" label={`${group.title}其他补充`} groupId={`${group.id}-other`} onUpload={onUpload} /></div>;
}

function SupplementField({ placeholder, label, groupId, onUpload, className = '' }: { placeholder: string; label: string; groupId: string; onUpload?: (label: string, groupId: string) => void; className?: string }) {
  const { addToast } = useToast();
  const [value, setValue] = useState(() => supplementMockValues[groupId] || '');
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const startVoiceInput = () => {
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const speechWindow = window as typeof window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any };
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setValue((prev) => `${prev ? `${prev} ` : ''}这段补充内容让我印象深刻，也值得记录下来。`);
      addToast('当前浏览器不支持语音识别，已填入演示转写内容', 'info');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) setValue((prev) => `${prev ? `${prev} ` : ''}${transcript}`);
    };
    recognition.onend = () => { setRecording(false); recognitionRef.current = null; };
    recognition.onerror = () => { setRecording(false); recognitionRef.current = null; addToast('语音输入未完成，请再试一次', 'error'); };
    recognitionRef.current = recognition;
    setRecording(true);
    recognition.start();
  };

  return <div className={`archive-enrichment-supplement ${className}`}><textarea value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} aria-label={label} /><div className="archive-enrichment-supplement-actions"><button type="button" className="archive-enrichment-supplement-action" onClick={() => onUpload?.(label, groupId)}><Camera size={13} /> 上传图片</button><button type="button" className={`archive-enrichment-supplement-action ${recording ? 'active' : ''}`} onClick={startVoiceInput}><Mic size={13} /> {recording ? '结束输入' : '语音输入'}</button></div></div>;
}
