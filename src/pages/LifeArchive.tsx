import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Image,
  Users,
  MapPin,
  ChevronRight,
  Edit3,
  FileText,
  Music,
  Play,
  CheckCircle2,
  Baby,
  GraduationCap,
  BookOpen,
  Heart,
  Briefcase,
  Rocket,
  Umbrella,
  Sprout,
  Info,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { useToast } from '../hooks/useToast';
import { generateImageDataUrl, generateVideoPoster, generateAudioUrl } from '../utils/mediaPlaceholder';
import LocationFootprints from './LocationFootprints';
import Achievements from './Achievements';
import './LifeArchive.css';

const tabs = [
  { key: 'timeline', label: '人生时间轴' },
  { key: 'media', label: '多媒体档案库' },
  { key: 'relations', label: '人物关系图谱' },
  { key: 'places', label: '地点足迹' },
  { key: 'achievements', label: '成就与作品' },
  { key: 'privacy', label: '隐私与权限' },
];

const stats = [
  { label: '档案完整度', value: '86%', sub: '4', trend: '8%' },
  { label: '关键事件', value: '128', trend: '12' },
  { label: '多媒体素材', value: '2,345', trend: '236' },
  { label: '人生阶段', value: '7', trend: '-' },
  { label: '授权成员', value: '5', trend: '1' },
];

const statIcons = [Clock, Image, MapPin, Users];

const timelineEvents = [
  { year: '1958', title: '出生', desc: '1958年3月12日出生于江苏苏州', Icon: Baby, color: '#D97706', bg: '#FEF3C7', tags: [{ label: '苏州', color: '#6b7280', bg: '#f3f4f6' }] },
  { year: '1970', title: '求学', desc: '苏州市立实验小学', Icon: GraduationCap, color: '#DB2777', bg: '#FCE7F3', tags: [{ label: '小学', color: '#1B5E4B', bg: 'rgba(27,94,75,0.08)' }] },
  { year: '1976', title: '求学', desc: '苏州市中学', Icon: BookOpen, color: '#7C3AED', bg: '#EDE9FE', tags: [{ label: '中学', color: '#1B5E4B', bg: 'rgba(27,94,75,0.08)' }] },
  { year: '1980', title: '婚姻', desc: '与配偶结婚，开启家庭生活', Icon: Heart, color: '#DC2626', bg: '#FEE2E2', tags: [{ label: '家庭', color: '#D97706', bg: '#FEF3C7' }] },
  { year: '1992', title: '创业', desc: '创立明远机械有限公司', Icon: Rocket, color: '#1B5E4B', bg: 'rgba(27,94,75,0.12)', tags: [{ label: '创业', color: '#1B5E4B', bg: 'rgba(27,94,75,0.08)' }, { label: '转型', color: '#1B5E4B', bg: 'rgba(27,94,75,0.08)' }] },
  { year: '1988', title: '工作', desc: '苏州大学机械工程专业毕业后参加工作', Icon: Briefcase, color: '#2563EB', bg: '#DBEAFE', tags: [{ label: '职业', color: '#2563EB', bg: '#DBEAFE' }] },
  { year: '2020', title: '退休', desc: '正式退休，享受生活', Icon: Umbrella, color: '#059669', bg: '#D1FAE5', tags: [{ label: '退休', color: '#6b7280', bg: '#f3f4f6' }] },
  { year: '2024', title: '当下', desc: '持续学习，传承家风', Icon: Sprout, color: '#059669', bg: '#D1FAE5', tags: [{ label: '当下', color: '#6b7280', bg: '#f3f4f6' }] },
];

const eventDetails: Record<string, { title: string; subtitle: string; content: string; tags: string[] }> = {
  '1958': { title: '出生', subtitle: '出生于江苏苏州', content: '1958年3月12日，张明远出生于江苏苏州一个普通的教师家庭。童年的苏州小巷、评弹声与父亲的教诲，构成了他最早的记忆底色。', tags: ['出生', '苏州', '童年'] },
  '1970': { title: '求学', subtitle: '苏州市立实验小学', content: '在苏州市立实验小学，张明远养成了良好的学习习惯。班主任王老师的影响深远，让他明白了知识改变命运的道理。', tags: ['小学', '求学', '启蒙'] },
  '1976': { title: '求学', subtitle: '苏州市中学', content: '中学时期，张明远对机械产生了浓厚兴趣，常常拆卸家中闹钟和收音机。这段经历为他后来的职业选择埋下了种子。', tags: ['中学', '机械', '兴趣'] },
  '1980': { title: '婚姻', subtitle: '组建家庭', content: '1980年，张明远与相恋多年的李晓如结婚。两人在简朴的婚礼中许下承诺，携手走过了四十余年的风风雨雨。', tags: ['婚姻', '家庭', '责任'] },
  '1988': { title: '工作', subtitle: '进入机械行业', content: '从苏州大学机械工程专业毕业后，张明远进入一家国营机械厂工作。他踏实肯干，很快成为技术骨干，积累了丰富的行业经验。', tags: ['职业', '机械', '成长'] },
  '1992': { title: '创业', subtitle: '创立明远机械有限公司', content: '在国家改革开放的浪潮中，辞去稳定的工作，与两位合作伙伴共同创立明远机械有限公司，专注于精密零部件加工与设备研发。创业初期条件艰苦，但团队齐心协力，逐步打开市场，产品远销海外，为公司奠定了坚实基础。', tags: ['创业初心', '精密制造', '团队协作', '创新突破'] },
  '2020': { title: '退休', subtitle: '享受生活', content: '2020年，张明远正式退休，将公司交给年轻一代打理。他开始有更多时间陪伴家人、整理人生档案，并思考家风传承。', tags: ['退休', '传承', '家庭'] },
  '2024': { title: '当下', subtitle: '持续学习，传承家风', content: '如今，张明远坚持每日读书、练字，并通过「传家世」平台记录人生故事。他希望把正直、担当、勤俭、善良的家风传递给子孙后代。', tags: ['当下', '家风', '传承'] },
};

const mediaItems = [
  { title: '家庭合影', date: '2024-05-01', type: 'image' },
  { title: '公司年会视频', date: '2023-12-20', type: 'video' },
  { title: '个人演讲稿.pdf', date: '2023-06-18', type: 'doc' },
  { title: '家庭旅行', date: '2022-08-15', type: 'image' },
];

const relationNodes = [
  { role: '父亲', name: '张国华', side: 'left', group: 'direct', x: 18, y: 22 },
  { role: '母亲', name: '李秀英', side: 'left', group: 'direct', x: 18, y: 78 },
  { role: '妻子', name: '李晓如', side: 'right', group: 'spouse', x: 82, y: 20 },
  { role: '儿子', name: '张子涵', side: 'right', group: 'child', x: 82, y: 55 },
  { role: '女儿', name: '张雨桐', side: 'right', group: 'child', x: 82, y: 85 },
];

const completeness = [
  { label: '基本信息', done: true },
  { label: '人生时间轴', done: true },
  { label: '多媒体素材', done: true },
  { label: '成就与作品', done: true },
  { label: '隐私与权限设置', done: false },
];

const privacyItems = [
  { label: '基本信息', value: '家人可见' },
  { label: '多媒体档案', value: '家人可见' },
  { label: '人生事件', value: '部分公开' },
  { label: '成就与作品', value: '公开展示' },
  { label: '下载控制', value: '已开启' },
];

const mediaFilters = ['全部', '照片', '视频', '音频', '文档'];

export default function LifeArchive() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('timeline');
  const [selectedYear, setSelectedYear] = useState<string>('1992');
  const [privacyValues, setPrivacyValues] = useState<Record<string, string>>(() => Object.fromEntries(privacyItems.map((p) => [p.label, p.value])));
  const [mediaFilter, setMediaFilter] = useState('全部');
  const [detailTags, setDetailTags] = useState<Record<string, string[]>>(() => Object.fromEntries(Object.entries(eventDetails).map(([year, d]) => [year, d.tags])));
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [preview, setPreview] = useState<{ type: string; title: string } | null>(null);
  const selectedDetail = { ...eventDetails[selectedYear], tags: detailTags[selectedYear] ?? eventDetails[selectedYear].tags };

  const filteredMedia = mediaFilter === '全部'
    ? mediaItems
    : mediaItems.filter((m) => {
        const map: Record<string, string> = { 照片: 'image', 视频: 'video', 音频: 'audio', 文档: 'doc' };
        return m.type === map[mediaFilter];
      });

  const addTag = () => {
    const tag = newTag.trim();
    if (!tag) {
      addToast('请输入标签名称', 'error');
      return;
    }
    setDetailTags((prev) => ({ ...prev, [selectedYear]: [...(prev[selectedYear] ?? []), tag] }));
    setNewTag('');
    setShowTagInput(false);
    addToast('标签已添加', 'success');
  };

  return (
    <div className="archive-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">人生档案</h1>
        </div>
      </header>

      <div className="tabs">
        {tabs.map((t) => (
          <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <div className="archive-stats-row">
        {stats.map((s, i) => {
          const statPaths = ['/archive/completeness', '/archive/events', '/archive/media', '/archive/places', '/archive/members'];
          return (
            <div className="card archive-stat" key={i} onClick={() => navigate(statPaths[i])}>
              <div className="card-body">
                {i === 0 ? (
                  <div className="complete-circle">86%</div>
                ) : (
                  <div className="archive-stat-icon">
                    {(() => {
                      const Icon = statIcons[i - 1];
                      return Icon ? <Icon size={20} color="#1B5E4B" /> : null;
                    })()}
                  </div>
                )}
                <div className="archive-stat-label">{s.label}</div>
                <div className="archive-stat-value">{s.value}</div>
                {s.sub && <div className="archive-stat-sub">{s.sub}</div>}
                {s.trend && <div className="archive-stat-trend">较上月 <ChevronRight size={10} className="trend-up" /> {s.trend}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {activeTab === 'timeline' && (
        <div className="archive-grid">
          <div className="card timeline-card">
            <div className="card-header">
              <h3 className="card-title">人生时间轴</h3>
              <div className="timeline-toggle"><span>关键节点</span><Info size={14} className="timeline-info" /><div className="toggle-switch on" /></div>
            </div>
            <div className="card-body timeline-body">
              {timelineEvents.map((e, i) => {
                const active = e.year === selectedYear;
                return (
                  <div className={`timeline-event ${active ? 'active' : ''}`} key={i} onClick={() => setSelectedYear(e.year)}>
                    <div className="event-icon" style={{ background: e.color, color: '#fff' }}>
                      <e.Icon size={16} />
                    </div>
                    <div className="event-main">
                      <div className="event-head">
                        <div className="event-title-line">
                          <span className="event-year">{e.year}</span>
                          <span className="event-title">{e.title}</span>
                        </div>
                        <div className="event-tags">
                          {e.tags.map((t, idx) => (
                            <span className="event-tag" key={idx} style={{ color: t.color, background: t.bg }}>{t.label}</span>
                          ))}
                        </div>
                      </div>
                      <div className="event-desc">{e.desc}</div>
                    </div>
                    {active && <ChevronRight size={18} className="event-arrow" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card event-detail-card">
            <div className="card-header">
              <h3 className="card-title">人生事件详情 <span className="verified-tag">已验证</span></h3>
              <button className="btn btn-outline" onClick={() => navigate(`/archive/event/${selectedYear}/edit`)}><Edit3 size={14} /> 编辑事件</button>
            </div>
            <div className="card-body event-detail-body">
              <div className="event-detail-head">
                <div>
                  <div className="event-detail-year">{selectedYear}年</div>
                  <div className="event-detail-title">{selectedDetail.title}</div>
                </div>
                <div className="event-detail-subtitle">{selectedDetail.subtitle}</div>
              </div>
              <p className="event-detail-content">{selectedDetail.content}</p>
              <div className="event-tags">
                {selectedDetail.tags.map((t, i) => <span className="event-tag" key={i}>{t}</span>)}
                {showTagInput ? (
                  <span className="tag-input-wrap">
                    <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="标签" onKeyDown={(e) => e.key === 'Enter' && addTag()} autoFocus />
                    <button onClick={addTag}>保存</button>
                    <button onClick={() => { setShowTagInput(false); setNewTag(''); }}>取消</button>
                  </span>
                ) : (
                  <span className="event-tag add" onClick={() => setShowTagInput(true)}>+ 添加标签</span>
                )}
              </div>
              <div className="event-photos">
                {[1,2,3,4].map((n) => (
                  <div className="event-photo" key={n} onClick={() => setPreview({ type: 'image', title: `${selectedYear}年照片 ${n}` })}><Image size={20} /></div>
                ))}
              </div>
              <div className="event-attachments">
                <div className="attach-item" onClick={() => setPreview({ type: 'doc', title: '创业计划书.pdf' })}><FileText size={16} /> 创业计划书.pdf <span>2.3MB</span></div>
                <div className="attach-item" onClick={() => addToast('开始下载：公司注册文件.zip', 'success')}><FileText size={16} /> 公司注册文件.zip <span>5.6MB</span></div>
                <div className="attach-item" onClick={() => setPreview({ type: 'audio', title: '创业访谈.mp3' })}><Music size={16} /> 创业访谈.mp3 <span>08:45</span></div>
                <div className="attach-item" onClick={() => setPreview({ type: 'video', title: '创业纪实视频.mp4' })}><Play size={16} /> 创业纪实视频.mp4 <span>12:36</span></div>
              </div>
            </div>
          </div>

          <div className="archive-side">
            <div className="card profile-card">
              <div className="card-header"><h3 className="card-title">档案概览</h3></div>
              <div className="card-body profile-body">
                <div className="profile-top">
                  <Avatar name="张明远" size={64} />
                  <div>
                    <div className="profile-name">张明远 <span className="gender">男</span></div>
                    <div className="profile-meta">出生地：江苏省苏州市</div>
                    <div className="profile-meta">职业：企业家 / 高级工程师</div>
                    <div className="profile-meta">当前阶段：享受生活，传承家风</div>
                  </div>
                </div>
                <div className="completeness-section">
                  <div className="section-title">完整度检查</div>
                  {completeness.map((c, i) => (
                    <div className="complete-item" key={i}>
                      <span>{c.done ? <CheckCircle2 size={14} color="#1B5E4B" /> : <Clock size={14} color="#9ca3af" />} {c.label}</span>
                      <span className={c.done ? 'done' : 'pending'}>{c.done ? '已完成' : '待完善'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card place-card" onClick={() => navigate('/archive/places')}>
              <div className="card-header"><h3 className="card-title">地点足迹</h3></div>
              <div className="card-body place-body">
                <div className="map-placeholder">中国地图</div>
                <div className="place-list">
                  <span>苏州</span><span>南京</span><span>上海</span><span>深圳</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'media' && (
        <div className="card media-page-card">
          <div className="card-header">
            <h3 className="card-title">多媒体档案库</h3>
            <div className="media-filter">
              {mediaFilters.map((f) => (
                <button className={mediaFilter === f ? 'active' : ''} key={f} onClick={() => setMediaFilter(f)}>{f}</button>
              ))}
            </div>
          </div>
          <div className="card-body media-page-body">
            {filteredMedia.map((m, i) => (
              <div className="media-item" key={i} onClick={() => setPreview({ type: m.type, title: m.title })}>
                <div className="media-thumb">{m.type === 'video' ? <Play size={24} /> : m.type === 'doc' ? <FileText size={24} /> : <Image size={24} />}</div>
                <div className="media-title">{m.title}</div>
                <div className="media-date">{m.date}</div>
              </div>
            ))}
            {filteredMedia.length === 0 && <div className="media-empty">该分类下暂无素材</div>}
          </div>
        </div>
      )}

      {activeTab === 'relations' && (
        <div className="card relation-page-card">
          <div className="card-header relation-header">
            <h3 className="card-title">人物关系图谱</h3>
            <span className="relation-subtitle">点击成员可查看详情</span>
          </div>
          <div className="card-body relation-page-body">
            <div className="relation-graph">
              <svg className="relation-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                {relationNodes.map((r, i) => (
                  <line
                    key={i}
                    x1="50%"
                    y1="50%"
                    x2={`${r.x}%`}
                    y2={`${r.y}%`}
                    className={`relation-line ${r.group}`}
                    strokeLinecap="round"
                  />
                ))}
              </svg>
              {relationNodes.map((r, i) => {
                const mx = (50 + r.x) / 2;
                const my = (50 + r.y) / 2;
                return (
                  <div
                    key={`label-${i}`}
                    className={`relation-label ${r.group}`}
                    style={{ left: `${mx}%`, top: `${my}%` }}
                  >
                    {r.role}
                  </div>
                );
              })}
              <div className="relation-center-node">
                <div className="relation-center-ring">
                  <Avatar name="张明远" size={88} />
                </div>
                <span className="relation-center-name">张明远</span>
                <span className="relation-center-tag">本人</span>
              </div>
              {relationNodes.map((r, i) => (
                <div
                  className={`relation-node ${r.side} ${r.group}`}
                  style={{ left: `${r.x}%`, top: `${r.y}%` }}
                  key={i}
                  onClick={() => navigate(`/family/members/${encodeURIComponent(r.name)}`)}
                >
                  <Avatar name={r.name} size={56} />
                  <span className="relation-node-name">{r.name}</span>
                  <span className="relation-node-role">{r.role}</span>
                </div>
              ))}
            </div>
            <div className="relation-legend">
              <span className="relation-legend-item"><i className="relation-legend-dot direct" />直系亲属</span>
              <span className="relation-legend-item"><i className="relation-legend-dot spouse" />配偶关系</span>
              <span className="relation-legend-item"><i className="relation-legend-dot child" />子女关系</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'privacy' && (
        <div className="card privacy-card">
          <div className="card-header"><h3 className="card-title">隐私与权限</h3></div>
          <div className="card-body privacy-body">
            <div className="privacy-template">
              <span>权限模板：</span>
              <select><option>默认模板（家人可见）</option></select>
            </div>
            {privacyItems.map((p, i) => {
              const current = privacyValues[p.label] ?? p.value;
              const options = p.label === '下载控制' ? ['已开启', '已关闭'] : ['家人可见', '部分公开', '公开展示', '仅自己'];
              return (
                <div className="privacy-row" key={i}>
                  <span>{p.label}</span>
                  <div className="privacy-options">
                    {options.map((opt) => (
                      <button
                        key={opt}
                        className={current === opt ? 'active' : ''}
                        onClick={() => {
                          setPrivacyValues((prev) => ({ ...prev, [p.label]: opt }));
                          addToast(`${p.label} 设为 ${opt}`, 'success');
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'places' && <LocationFootprints />}
      {activeTab === 'achievements' && <Achievements />}

      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>{preview.title}</h4><button className="modal-close" onClick={() => setPreview(null)}>关闭</button></div>
            <div className="modal-body preview-body">
              {preview.type === 'image' && <img className="preview-image" src={generateImageDataUrl(preview.title)} alt={preview.title} />}
              {preview.type === 'video' && <video className="preview-video" controls poster={generateVideoPoster(preview.title)} />}
              {preview.type === 'audio' && <audio className="preview-audio" controls src={generateAudioUrl()} />}
              {preview.type === 'doc' && <div className="preview-doc"><FileText size={48} /></div>}
              <p>正在预览：{preview.title}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
