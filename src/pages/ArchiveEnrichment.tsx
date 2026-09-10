import { useMemo, useState } from 'react';
import { Camera, Check, ChevronDown, ChevronUp, ImagePlus, Plus, Users, Wand2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import Modal from '../components/ui/Modal';
import './ArchiveEnrichment.css';

type ChoiceGroup = { id: string; title: string; options: string[]; multiple?: boolean };
type SavedEnrichment = { id: string; archiveName: string; updatedAt: string; selectedLabels: string[]; people: string[]; style: string };
export type ArchiveEnrichmentProps = {
  embedded?: boolean;
  onContinue?: () => void;
  onSkip?: () => void;
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

// 演示用占位照片：原照片做旧（泛黄 + 划痕），修复后干净明亮
function makeDemoPhoto(label: string, restored: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 260;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const gradient = ctx.createLinearGradient(0, 0, 400, 260);
  if (restored) {
    gradient.addColorStop(0, '#e2f2ea');
    gradient.addColorStop(1, '#bcdccc');
  } else {
    gradient.addColorStop(0, '#ddcda9');
    gradient.addColorStop(1, '#b5a37f');
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 400, 260);
  if (!restored) {
    ctx.strokeStyle = 'rgba(96, 74, 40, 0.4)';
    ctx.lineWidth = 2;
    [[60, 30, 200, 210], [280, 20, 250, 230], [120, 240, 330, 60]].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
  }
  ctx.fillStyle = restored ? '#1B5E4B' : '#6f5a33';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, 200, 135);
  return canvas.toDataURL('image/png');
}

export default function ArchiveEnrichment({ embedded = false, onContinue, onSkip }: ArchiveEnrichmentProps) {
  const { addToast } = useToast();
  const [selected, setSelected] = useState<Record<string, string[]>>({
    era: ['80年代', '改革开放初期'],
    principle: ['踏实肯干', '知恩感恩'],
    'family-style': ['重视教育', '家庭和睦'],
  });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [people, setPeople] = useState([{ id: 1, name: '王老师', relation: '恩师', story: '在我刚参加工作时给过很多指导。' }]);
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, number>>({});
  const [style, setStyle] = useState('温情家常');
  const [savedRecord] = useState<SavedEnrichment | null>(() => loadSavedEnrichment());
  const [isEditing, setIsEditing] = useState(() => embedded ? !loadSavedEnrichment() : false);
  const [memoryPhoto, setMemoryPhoto] = useState<'none' | 'uploaded' | 'restoring' | 'restored'>('none');
  const [restoreOpen, setRestoreOpen] = useState(false);
  const oldPhotoUrl = useMemo(() => makeDemoPhoto('1975年 · 全家福', false), []);
  const restoredPhotoUrl = useMemo(() => makeDemoPhoto('1975年 · 全家福', true), []);

  const startRestore = () => {
    setMemoryPhoto('restoring');
    window.setTimeout(() => {
      setMemoryPhoto('restored');
      addToast('老照片修复完成（演示）', 'success');
    }, 1200);
  };

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

  const startNewBiography = () => {
    setSelected({ era: ['80年代', '改革开放初期'], principle: ['踏实肯干', '知恩感恩'], 'family-style': ['重视教育', '家庭和睦'] });
    setPeople([{ id: Date.now(), name: '', relation: relationOptions[0], story: '' }]);
    setUploadedPhotos({});
    setStyle('温情家常');
    setIsEditing(true);
  };

  if (!isEditing && (!embedded || savedRecord)) {
    const record = savedRecord || {
      id: 'mock-enrichment',
      archiveName: '张明远',
      updatedAt: '尚未确认',
      selectedLabels: ['80年代', '改革开放初期', '重视教育', '家庭和睦'],
      people: ['王老师 · 恩师'],
      style: '温情家常',
    };
    return (
      <div className="archive-enrichment-page">
        <header className="page-header archive-enrichment-header">
          <div><h1 className="page-title">{embedded ? '第四步：多维增补' : '多维增补'}</h1></div>
          {embedded ? <button className="btn btn-outline" onClick={onSkip}>跳过此步</button> : <button className="btn btn-primary" onClick={startNewBiography}><Plus size={14} /> 创建新传记</button>}
        </header>
        <section className="archive-enrichment-list-card card">
          <div className="archive-enrichment-list-head"><div><h2>多维增补列表</h2><p>点击记录进入详情，可继续编辑和补充图片。</p></div><span>共 1 条</span></div>
          <button className="archive-enrichment-list-row" onClick={() => setIsEditing(true)}>
            <span className="archive-enrichment-list-icon"><ImagePlus size={16} /></span>
            <span className="archive-enrichment-list-main"><strong>{record.archiveName}的多维增补</strong><small>最近更新：{record.updatedAt}</small></span>
            <span className="archive-enrichment-list-meta">{record.selectedLabels.length} 项素材 · {record.people.length} 位关键人物 · {record.style}</span>
            <ChevronDown size={17} />
          </button>
        </section>
        {embedded && <div className="archive-enrichment-embedded-footer"><button className="btn btn-primary" onClick={onContinue}>进入下一步 <ChevronDown size={14} /></button></div>}
      </div>
    );
  }

  return (
    <div className="archive-enrichment-page">
      <header className="page-header archive-enrichment-header">
        <div><h1 className="page-title">{embedded ? '第四步：多维增补' : '多维增补'}</h1></div>
        <div className="archive-enrichment-actions">
          {embedded && <button className="btn btn-outline" onClick={onSkip}>跳过此步</button>}
        </div>
      </header>

      <section className="archive-enrichment-block card">
        <button className="archive-enrichment-block-head" onClick={() => setCollapsed((prev) => ({ ...prev, background: !prev.background }))}><span className="archive-enrichment-number">01</span><span><strong>时代地域背景</strong><small>还原人物成长的年代、地域和时代变化</small></span>{collapsed.background ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
      {!collapsed.background && <div className="archive-enrichment-block-body"><div className="archive-enrichment-choice-grid">{choiceGroups.slice(0, 3).map((group) => <ChoiceSection key={group.id} group={group} values={selected[group.id] || []} photoCount={uploadedPhotos[group.id] || 0} onToggle={toggle} onUpload={() => uploadPhoto(group.title + '图片', group.id)} />)}</div><textarea className="archive-enrichment-textarea" placeholder="还有哪些时代背景或家乡记忆想补充？（选填）" /></div>}
      </section>

      <section className="archive-enrichment-block card">
        <button className="archive-enrichment-block-head" onClick={() => setCollapsed((prev) => ({ ...prev, people: !prev.people }))}><span className="archive-enrichment-number">02</span><span><strong>关键人物关系</strong><small>记录对你产生过重要影响的人</small></span>{collapsed.people ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
        {!collapsed.people && <div className="archive-enrichment-block-body"><div className="archive-enrichment-people-list">{people.map((person) => <div className="archive-enrichment-person" key={person.id}><Users size={17} /><input value={person.name} onChange={(e) => updatePerson(person.id, 'name', e.target.value)} placeholder="人物姓名" /><select value={person.relation} onChange={(e) => updatePerson(person.id, 'relation', e.target.value)}>{relationOptions.map((item) => <option key={item}>{item}</option>)}</select><input value={person.story} onChange={(e) => updatePerson(person.id, 'story', e.target.value)} placeholder="对我影响或难忘故事" /><button className="archive-enrichment-photo" onClick={() => uploadPhoto('人物照片')}><Camera size={14} /> 图片</button></div>)}</div><button className="btn btn-outline btn-sm" onClick={() => setPeople((prev) => [...prev, { id: Date.now(), name: '', relation: relationOptions[0], story: '' }])}><Plus size={14} /> 添加人物</button></div>}
      </section>

      <section className="archive-enrichment-block card">
        <button className="archive-enrichment-block-head" onClick={() => setCollapsed((prev) => ({ ...prev, memory: !prev.memory }))}><span className="archive-enrichment-number">03</span><span><strong>记忆锚点</strong><small>选择有代表性的生活场景和老物件</small></span>{collapsed.memory ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
      {!collapsed.memory && <div className="archive-enrichment-block-body"><div className="archive-enrichment-choice-grid">{choiceGroups.slice(3, 5).map((group) => <ChoiceSection key={group.id} group={group} values={selected[group.id] || []} photoCount={uploadedPhotos[group.id] || 0} onToggle={toggle} onUpload={() => uploadPhoto(group.title + '图片', group.id)} />)}</div><div className="archive-enrichment-memory-row"><textarea className="archive-enrichment-textarea" placeholder="物件或场景承载的回忆（选填）" />{memoryPhoto === 'none' ? (
        <button className="archive-enrichment-large-upload" onClick={() => { setMemoryPhoto('uploaded'); setRestoreOpen(true); addToast('老照片已上传（演示）', 'success'); }}><Camera size={18} />上传老照片</button>
      ) : (
        <button className="archive-enrichment-photo-thumb" onClick={() => setRestoreOpen(true)}>
          <img src={memoryPhoto === 'restored' ? restoredPhotoUrl : oldPhotoUrl} alt="老照片" />
          <span className={memoryPhoto === 'restored' ? 'restored' : ''}>{memoryPhoto === 'restored' ? '已修复' : '待修复'}</span>
        </button>
      )}</div></div>}
      </section>

      <section className="archive-enrichment-block card">
        <button className="archive-enrichment-block-head" onClick={() => setCollapsed((prev) => ({ ...prev, values: !prev.values }))}><span className="archive-enrichment-number">04</span><span><strong>人生价值观与家风</strong><small>沉淀一生坚持的原则和想传给后辈的家风</small></span>{collapsed.values ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
      {!collapsed.values && <div className="archive-enrichment-block-body"><div className="archive-enrichment-choice-grid">{choiceGroups.slice(5).map((group) => <ChoiceSection key={group.id} group={group} values={selected[group.id] || []} photoCount={uploadedPhotos[group.id] || 0} onToggle={toggle} onUpload={() => uploadPhoto(group.title + '图片', group.id)} />)}</div><textarea className="archive-enrichment-textarea" placeholder="自己一生最骄傲、最无悔的 1-2 件事（选填）" /></div>}
      </section>

      <section className="archive-enrichment-block card">
        <button className="archive-enrichment-block-head" onClick={() => setCollapsed((prev) => ({ ...prev, style: !prev.style }))}><span className="archive-enrichment-number">05</span><span><strong>成书风格与边界</strong><small>告诉系统希望如何呈现，以及哪些内容需要避开</small></span>{collapsed.style ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
      {!collapsed.style && <div className="archive-enrichment-block-body"><div className="archive-enrichment-style-row"><label>传记文风</label>{['温情家常', '严谨纪实', '简洁大气'].map((item) => <button className={style === item ? 'active' : ''} key={item} onClick={() => setStyle(item)}><Check size={14} />{item}</button>)}</div><div className="archive-enrichment-checks"><label><input type="checkbox" defaultChecked /> 留给后代</label><label><input type="checkbox" /> 自我珍藏</label><label><input type="checkbox" /> 亲友传阅</label></div><div className="archive-enrichment-style-upload"><span>相关照片或手稿（选填）</span><button className="archive-enrichment-photo" onClick={() => uploadPhoto('成书风格素材', 'style')}><Camera size={14} /> 上传图片{uploadedPhotos.style ? '（' + uploadedPhotos.style + '）' : ''}</button></div><textarea className="archive-enrichment-textarea" placeholder="希望 AI 规避、不提及的往事（选填）" /></div>}
      </section>

      <div className="archive-enrichment-tip">所有内容均为选填，不填写不影响传记生成。</div>
      {embedded && <div className="archive-enrichment-embedded-footer"><button className="btn btn-primary" onClick={onContinue}>保存并进入下一步 <ChevronDown size={14} /></button></div>}

      <Modal open={restoreOpen} title="老照片修复" onClose={() => setRestoreOpen(false)}>
        <div className="archive-enrichment-restore">
          <figure className="archive-enrichment-restore-item">
            <img src={oldPhotoUrl} alt="原照片" />
            <figcaption>原照片</figcaption>
          </figure>
          {memoryPhoto === 'restored' ? (
            <figure className="archive-enrichment-restore-item">
              <img src={restoredPhotoUrl} alt="修复后的照片" />
              <figcaption>修复后 <em>已修复</em></figcaption>
            </figure>
          ) : (
            <div className="archive-enrichment-restore-pending">
              <Wand2 size={18} />
              <span>AI 智能修复划痕、褪色与模糊</span>
              <button className="btn btn-primary btn-sm" disabled={memoryPhoto === 'restoring'} onClick={startRestore}>
                {memoryPhoto === 'restoring' ? '修复中…' : '老照片修复'}
              </button>
            </div>
          )}
        </div>
        <div className="archive-enrichment-restore-footer">
          <button className="archive-enrichment-restore-reset" onClick={() => { setMemoryPhoto('none'); setRestoreOpen(false); }}>重新上传</button>
          <button className="btn btn-primary btn-sm" onClick={() => setRestoreOpen(false)}>完成</button>
        </div>
      </Modal>
    </div>
  );
}

function ChoiceSection({ group, values, photoCount, onToggle, onUpload }: { group: ChoiceGroup; values: string[]; photoCount: number; onToggle: (groupId: string, option: string) => void; onUpload: () => void }) {
  return <div className="archive-enrichment-choice-section"><h3><span>{group.title}<small>可多选</small></span><button className="archive-enrichment-section-upload" onClick={onUpload}><Camera size={13} /> 图片{photoCount ? '（' + photoCount + '）' : ''}</button></h3><div className="archive-enrichment-chips">{group.options.map((option) => <button className={values.includes(option) ? 'active' : ''} key={option} onClick={() => onToggle(group.id, option)}>{values.includes(option) && <Check size={13} />}{option}</button>)}</div><input className="archive-enrichment-other" placeholder="其他补充（选填）" /></div>;
}
