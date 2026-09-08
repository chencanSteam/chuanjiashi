import { useState } from 'react';
import { Camera, Check, ChevronDown, ChevronUp, ImagePlus, Plus, Save, Users } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import './ArchiveEnrichment.css';

type ChoiceGroup = { id: string; title: string; options: string[]; multiple?: boolean };

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

export default function ArchiveEnrichment() {
  const { addToast } = useToast();
  const [selected, setSelected] = useState<Record<string, string[]>>({
    era: ['80年代', '改革开放初期'],
    principle: ['踏实肯干', '知恩感恩'],
    'family-style': ['重视教育', '家庭和睦'],
  });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [people, setPeople] = useState([{ id: 1, name: '王老师', relation: '恩师', story: '在我刚参加工作时给过很多指导。' }]);
  const [style, setStyle] = useState('温情家常');

  const toggle = (groupId: string, option: string) => {
    setSelected((prev) => {
      const values = prev[groupId] || [];
      return { ...prev, [groupId]: values.includes(option) ? values.filter((item) => item !== option) : [...values, option] };
    });
  };

  const updatePerson = (id: number, key: 'name' | 'relation' | 'story', value: string) => {
    setPeople((prev) => prev.map((person) => person.id === id ? { ...person, [key]: value } : person));
  };

  return (
    <div className="archive-enrichment-page">
      <header className="page-header archive-enrichment-header">
        <div><h1 className="page-title">多维增补</h1><p className="page-subtitle">补充时代、人物、记忆和家风素材，让人生故事更立体。全部内容均为选填。</p></div>
        <button className="btn btn-primary" onClick={() => addToast('增补内容已保存（演示）', 'success')}><Save size={14} /> 保存当前内容</button>
      </header>

      <div className="archive-enrichment-summary card">
        <div className="archive-enrichment-summary-icon"><ImagePlus size={20} /></div>
        <div><strong>八维素材采集</strong><p>已完成基础信息和人生大事件后，可以在这里补充更多细节。勾选越多，内容越丰富。</p></div>
        <span>{Object.values(selected).reduce((sum, items) => sum + items.length, 0)} 项已选择</span>
      </div>

      <section className="archive-enrichment-block card">
        <button className="archive-enrichment-block-head" onClick={() => setCollapsed((prev) => ({ ...prev, background: !prev.background }))}><span className="archive-enrichment-number">01</span><span><strong>时代地域背景</strong><small>还原人物成长的年代、地域和时代变化</small></span>{collapsed.background ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
        {!collapsed.background && <div className="archive-enrichment-block-body"><div className="archive-enrichment-choice-grid">{choiceGroups.slice(0, 3).map((group) => <ChoiceSection key={group.id} group={group} values={selected[group.id] || []} onToggle={toggle} />)}</div><textarea className="archive-enrichment-textarea" placeholder="还有哪些时代背景或家乡记忆想补充？（选填）" /></div>}
      </section>

      <section className="archive-enrichment-block card">
        <button className="archive-enrichment-block-head" onClick={() => setCollapsed((prev) => ({ ...prev, people: !prev.people }))}><span className="archive-enrichment-number">02</span><span><strong>关键人物关系</strong><small>记录对你产生过重要影响的人</small></span>{collapsed.people ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
        {!collapsed.people && <div className="archive-enrichment-block-body"><div className="archive-enrichment-people-list">{people.map((person) => <div className="archive-enrichment-person" key={person.id}><Users size={17} /><input value={person.name} onChange={(e) => updatePerson(person.id, 'name', e.target.value)} placeholder="人物姓名" /><select value={person.relation} onChange={(e) => updatePerson(person.id, 'relation', e.target.value)}>{relationOptions.map((item) => <option key={item}>{item}</option>)}</select><input value={person.story} onChange={(e) => updatePerson(person.id, 'story', e.target.value)} placeholder="对我影响或难忘故事" /><button className="archive-enrichment-photo" onClick={() => addToast('人物照片已加入（演示）', 'success')}><Camera size={14} /> 图片</button></div>)}</div><button className="btn btn-outline btn-sm" onClick={() => setPeople((prev) => [...prev, { id: Date.now(), name: '', relation: relationOptions[0], story: '' }])}><Plus size={14} /> 添加人物</button></div>}
      </section>

      <section className="archive-enrichment-block card">
        <button className="archive-enrichment-block-head" onClick={() => setCollapsed((prev) => ({ ...prev, memory: !prev.memory }))}><span className="archive-enrichment-number">03</span><span><strong>记忆锚点</strong><small>选择有代表性的生活场景和老物件</small></span>{collapsed.memory ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
        {!collapsed.memory && <div className="archive-enrichment-block-body"><div className="archive-enrichment-choice-grid">{choiceGroups.slice(3, 5).map((group) => <ChoiceSection key={group.id} group={group} values={selected[group.id] || []} onToggle={toggle} />)}</div><div className="archive-enrichment-memory-row"><textarea className="archive-enrichment-textarea" placeholder="物件或场景承载的回忆（选填）" /><button className="archive-enrichment-large-upload" onClick={() => addToast('记忆图片已加入（演示）', 'success')}><Camera size={18} />上传老照片</button></div></div>}
      </section>

      <section className="archive-enrichment-block card">
        <button className="archive-enrichment-block-head" onClick={() => setCollapsed((prev) => ({ ...prev, values: !prev.values }))}><span className="archive-enrichment-number">04</span><span><strong>人生价值观与家风</strong><small>沉淀一生坚持的原则和想传给后辈的家风</small></span>{collapsed.values ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
        {!collapsed.values && <div className="archive-enrichment-block-body"><div className="archive-enrichment-choice-grid">{choiceGroups.slice(5).map((group) => <ChoiceSection key={group.id} group={group} values={selected[group.id] || []} onToggle={toggle} />)}</div><textarea className="archive-enrichment-textarea" placeholder="自己一生最骄傲、最无悔的 1-2 件事（选填）" /></div>}
      </section>

      <section className="archive-enrichment-block card">
        <button className="archive-enrichment-block-head" onClick={() => setCollapsed((prev) => ({ ...prev, style: !prev.style }))}><span className="archive-enrichment-number">05</span><span><strong>成书风格与边界</strong><small>告诉系统希望如何呈现，以及哪些内容需要避开</small></span>{collapsed.style ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
        {!collapsed.style && <div className="archive-enrichment-block-body"><div className="archive-enrichment-style-row"><label>传记文风</label>{['温情家常', '严谨纪实', '简洁大气'].map((item) => <button className={style === item ? 'active' : ''} key={item} onClick={() => setStyle(item)}><Check size={14} />{item}</button>)}</div><div className="archive-enrichment-checks"><label><input type="checkbox" defaultChecked /> 留给后代</label><label><input type="checkbox" /> 自我珍藏</label><label><input type="checkbox" /> 亲友传阅</label></div><textarea className="archive-enrichment-textarea" placeholder="希望 AI 规避、不提及的往事（选填）" /></div>}
      </section>

      <div className="archive-enrichment-tip">所有内容均为选填，不填写不影响传记生成。当前页面只做本页信息展示与模拟保存，不自动跳转其他页面。</div>
    </div>
  );
}

function ChoiceSection({ group, values, onToggle }: { group: ChoiceGroup; values: string[]; onToggle: (groupId: string, option: string) => void }) {
  return <div className="archive-enrichment-choice-section"><h3>{group.title}<small>可多选</small></h3><div className="archive-enrichment-chips">{group.options.map((option) => <button className={values.includes(option) ? 'active' : ''} key={option} onClick={() => onToggle(group.id, option)}>{values.includes(option) && <Check size={13} />}{option}</button>)}</div><input className="archive-enrichment-other" placeholder="其他补充（选填）" /></div>;
}
