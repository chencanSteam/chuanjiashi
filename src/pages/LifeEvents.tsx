import { useMemo, useState } from 'react';
import { Camera, Check, ChevronDown, ChevronUp, Clock3, Plus, Save, Upload } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import './LifeEvents.css';

type EventItem = { id: string; label: string };
type EventGroup = { id: string; title: string; desc: string; items: EventItem[] };

const eventGroups: EventGroup[] = [
  { id: 'childhood', title: '童年少年', desc: '家庭环境、成长经历和最早影响你的人。', items: [
    { id: 'rural', label: '农村成长经历' }, { id: 'siblings', label: '多兄弟姐妹家庭' }, { id: 'early-mature', label: '年少懂事吃苦' }, { id: 'family-style', label: '家庭家风熏陶' },
  ] },
  { id: 'study', title: '求学成长', desc: '学校、老师、同学和成长中的重要转折。', items: [
    { id: 'study-hard', label: '刻苦求学经历' }, { id: 'class-leader', label: '在校担任班干部' }, { id: 'award', label: '获得荣誉奖励' }, { id: 'transfer', label: '转学异地求学' }, { id: 'hard-study', label: '求学艰苦磨砺' },
  ] },
  { id: 'career-start', title: '择业从业', desc: '第一次工作、职业选择和人生方向。', items: [
    { id: 'first-career', label: '初次择业重要选择' }, { id: 'stable-job', label: '进入稳定单位或企业' }, { id: 'start-business', label: '自主创业打拼' }, { id: 'migrant-work', label: '外出务工奋斗' }, { id: 'career-change', label: '转行跨界经历' },
  ] },
  { id: 'career-deep', title: '事业深耕', desc: '长期积累、团队协作和职业成就。', items: [
    { id: 'deep-work', label: '长期坚守岗位深耕' }, { id: 'team', label: '带领团队干事' }, { id: 'career-honor', label: '获得职业荣誉' }, { id: 'challenge', label: '攻克重大工作难题' }, { id: 'business-result', label: '创业收获成果' },
  ] },
  { id: 'hardship', title: '人生风雨磨砺', desc: '困难、低谷、压力和重新站起来的时刻。', items: [
    { id: 'low-point', label: '经历人生低谷' }, { id: 'career-setback', label: '遭遇事业挫折' }, { id: 'family-pressure', label: '家庭压力考验' }, { id: 'away-struggle', label: '异地打拼不易' }, { id: 'breakthrough', label: '咬牙坚持破局' },
  ] },
  { id: 'family', title: '家庭人生', desc: '成家、育儿、亲情和家风传承。', items: [
    { id: 'marriage', label: '成家立业' }, { id: 'children', label: '养育子女' }, { id: 'filial', label: '赡养尽孝' }, { id: 'harmony', label: '家庭和睦经营' }, { id: 'support', label: '亲友互助扶持' },
  ] },
  { id: 'harvest', title: '收获沉淀', desc: '退休生活、人生感悟和想留给后辈的话。', items: [
    { id: 'stable', label: '事业稳定圆满' }, { id: 'retire', label: '退休安稳生活' }, { id: 'grandchildren', label: '儿孙成长成才' }, { id: 'open-minded', label: '人生通透释怀' },
  ] },
];

export default function LifeEvents() {
  const { addToast } = useToast();
  const [selected, setSelected] = useState<Record<string, boolean>>({
    'family-style': true,
    'stable-job': true,
    'children': true,
  });
  const [details, setDetails] = useState<Record<string, string>>({
    'family-style': '父母重视做人要正直、做事要踏实，这份家风一直影响着我。',
    'stable-job': '毕业后进入机械厂，从技术员开始一步步积累经验。',
    children: '和妻子一起陪伴孩子成长，把诚实、责任和感恩教给下一代。',
  });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [customEvents, setCustomEvents] = useState([{ id: 'custom-1', title: '', year: '', desc: '' }]);

  const total = eventGroups.reduce((sum, group) => sum + group.items.length, 0);
  const selectedCount = Object.values(selected).filter(Boolean).length;
  const progress = useMemo(() => Math.round((selectedCount / total) * 100), [selectedCount, total]);

  const toggleEvent = (id: string) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  const updateDetail = (id: string, value: string) => setDetails((prev) => ({ ...prev, [id]: value }));
  const uploadPhoto = () => addToast('图片已加入本条人生事件（演示）', 'success');
  const updateCustom = (id: string, key: 'title' | 'year' | 'desc', value: string) => {
    setCustomEvents((items) => items.map((item) => item.id === id ? { ...item, [key]: value } : item));
  };

  return (
    <div className="life-events-page">
      <header className="page-header life-events-header">
        <div>
          <h1 className="page-title">人生大事件</h1>
          <p className="page-subtitle">勾选重要经历，搭建属于你的时间轴骨架。选填补充，不影响后续使用。</p>
        </div>
        <div className="life-events-actions">
          <button className="btn btn-outline" onClick={() => addToast('草稿已保存（演示）', 'success')}><Save size={14} /> 保存草稿</button>
          <button className="btn btn-primary" onClick={() => addToast('已记录当前选择（演示）', 'success')}><Check size={14} /> 保存当前内容</button>
        </div>
      </header>

      <section className="life-events-progress card">
        <div className="life-events-progress-head"><div><strong>人生经历采集进度</strong><span>已选择 {selectedCount} / {total} 项</span></div><b>{progress}%</b></div>
        <div className="life-events-progress-track"><span style={{ width: `${progress}%` }} /></div>
        <p>可以只勾选，不填写文字；愿意补充的内容会成为 AI 采访的重点。</p>
      </section>

      <div className="life-events-groups">
        {eventGroups.map((group) => {
          const groupSelected = group.items.filter((item) => selected[item.id]).length;
          const isCollapsed = collapsed[group.id];
          return (
            <section className="life-events-group card" key={group.id}>
              <button className="life-events-group-head" onClick={() => setCollapsed((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}>
                <span className="life-events-group-index">{String(eventGroups.indexOf(group) + 1).padStart(2, '0')}</span>
                <span className="life-events-group-title"><strong>{group.title}</strong><small>{group.desc}</small></span>
                <span className="life-events-group-count">已选 {groupSelected} 项 {isCollapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}</span>
              </button>
              {!isCollapsed && <div className="life-events-group-body">
                <div className="life-events-options">
                  {group.items.map((item) => {
                    const active = !!selected[item.id];
                    return <div className={`life-events-option ${active ? 'active' : ''}`} key={item.id}>
                      <label><input type="checkbox" checked={active} onChange={() => toggleEvent(item.id)} /><span>{item.label}</span></label>
                      {active && <div className="life-events-detail"><textarea value={details[item.id] || ''} onChange={(e) => updateDetail(item.id, e.target.value)} placeholder="简单写一两句话即可，选填" /><button className="life-events-upload" onClick={uploadPhoto}><Camera size={14} /> 上传老照片</button></div>}
                    </div>;
                  })}
                </div>
                <input className="life-events-other" placeholder="其他补充（选填）" />
              </div>}
            </section>
          );
        })}
      </div>

      <section className="life-events-custom card">
        <div className="life-events-section-title"><div><h2>自定义重大事件</h2><p>没有被上面覆盖的经历，可以自己新增。</p></div><button className="btn btn-outline btn-sm" onClick={() => setCustomEvents((items) => [...items, { id: `custom-${Date.now()}`, title: '', year: '', desc: '' }])}><Plus size={14} /> 新增一件人生大事</button></div>
        <div className="life-events-custom-list">
          {customEvents.map((item, index) => <div className="life-events-custom-row" key={item.id}>
            <span className="life-events-custom-no">{index + 1}</span>
            <input value={item.title} onChange={(e) => updateCustom(item.id, 'title', e.target.value)} placeholder="事件名称" />
            <input value={item.year} onChange={(e) => updateCustom(item.id, 'year', e.target.value)} placeholder="发生年份" />
            <input value={item.desc} onChange={(e) => updateCustom(item.id, 'desc', e.target.value)} placeholder="一句话概括经历" />
            <button className="life-events-upload" onClick={uploadPhoto}><Upload size={14} /> 图片</button>
          </div>)}
        </div>
      </section>

      <div className="life-events-footer-tip"><Clock3 size={15} /> 所有补充内容均为选填，不填写不会阻断页面使用；勾选越准确，后续采访展示越贴合。</div>
    </div>
  );
}
