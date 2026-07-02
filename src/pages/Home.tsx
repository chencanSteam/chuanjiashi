import {
  Mic,
  Users,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMemo, useEffect, useState } from 'react';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import { useVersion } from '../hooks/useVersion';
import { useToast } from '../hooks/useToast';
import { openGuide, shouldShowGuide } from '../components/GuideTour';
import './Home.css';

const todos = [
  { title: '待继续访谈', desc: '《父亲的创业之路》访谈未完成', count: 1, path: '/interview' },
  { title: '待生成传记', desc: '有 1 份访谈素材可生成传记', count: 1, path: '/biography' },
  { title: '待完善档案', desc: '有 2 份家庭成员档案待补充', count: 2, path: '/archive' },
];

const activities = [
  { user: '我', action: '完成了《父亲的创业之路》访谈', time: '2 小时前', type: '访谈时长 45 分钟' },
  { user: '妻子', action: '上传了 12 张家庭照片到相册', time: '5 小时前', type: '家庭相册' },
  { user: '系统', action: '为照片《1980年全家福》进行了AI修复', time: '1 天前', type: '图像修复完成' },
  { user: '父亲', action: '的故事《难忘的知青岁月》已生成传记', time: '2 天前', type: '传记生成完成' },
];

function hasArchives(): boolean {
  try {
    const raw = localStorage.getItem('cj_archives');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

interface Archive {
  id: string;
  name: string;
  gender?: '男' | '女';
  birthYear: string;
  origin: string;
  occupation: string;
  tags?: string[];
}

const presetLifeTags = [
  '求学深造',
  '参军入伍',
  '出国留学',
  '下海创业',
  '调岗转行',
  '结婚生子',
  '养育子女',
  '退休生活',
  '疾病康复',
  '书法绘画',
  '音乐戏曲',
  '旅游摄影',
  '钓鱼养花',
  '体育运动',
  '宗教信仰',
  '家乡迁徙',
];

function loadArchives(): Archive[] {
  try {
    const raw = localStorage.getItem('cj_archives');
    if (raw) return JSON.parse(raw) as Archive[];
  } catch {
    // ignore
  }
  return [];
}

function loadCurrentArchive(): Archive | null {
  const archives = loadArchives();
  const currentId = localStorage.getItem('cj_current_archive_id');
  if (!currentId) return null;
  return archives.find((a) => a.id === currentId) || null;
}

function saveArchive(archive: Archive) {
  const existing = loadArchives();
  const filtered = existing.filter((a) => a.id !== archive.id);
  localStorage.setItem('cj_archives', JSON.stringify([...filtered, archive]));
  localStorage.setItem('cj_current_archive_id', archive.id);
}

export default function Home() {
  const navigate = useNavigate();
  const { isMVP } = useVersion();
  const archiveExists = useMemo(() => hasArchives(), []);

  useEffect(() => {
    if (shouldShowGuide()) {
      const timer = setTimeout(() => openGuide(), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const { addToast } = useToast();
  const [showBasicModal, setShowBasicModal] = useState(false);
  const [basicStep, setBasicStep] = useState<1 | 2>(1);
  const [basicForm, setBasicForm] = useState({
    name: '',
    gender: '男' as '男' | '女',
    birthYear: '',
    origin: '',
    occupation: '',
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  const handleStartInterview = () => {
    const archive = loadCurrentArchive();
    setBasicForm({
      name: archive?.name || '',
      gender: archive?.gender || '男',
      birthYear: archive?.birthYear || '',
      origin: archive?.origin || '',
      occupation: archive?.occupation || '',
    });
    setSelectedTags(archive?.tags || []);
    setCustomTag('');
    setBasicStep(1);
    setShowBasicModal(true);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const tag = customTag.trim();
    if (!tag) return;
    if (!selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
    setCustomTag('');
  };

  const handleSaveBasicInfo = () => {
    if (!basicForm.name.trim() || !basicForm.birthYear.trim()) {
      addToast('请填写姓名和出生年份', 'error');
      return;
    }
    const archiveId = localStorage.getItem('cj_current_archive_id') || `archive_${Date.now()}`;
    saveArchive({
      id: archiveId,
      name: basicForm.name.trim(),
      gender: basicForm.gender,
      birthYear: basicForm.birthYear.trim(),
      origin: basicForm.origin.trim(),
      occupation: basicForm.occupation.trim(),
      tags: selectedTags,
    });
    setShowBasicModal(false);
    addToast('基础信息已保存，开始 AI 采访', 'success');
    navigate('/interview');
  };


  return (
    <div className="home-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">首页</h1>
          <p className="page-subtitle">记录人生故事，传承家风温度</p>
        </div>
      </header>

      {!archiveExists && (
        <section className="home-hero home-hero-empty">
          <div className="hero-copy">
            <h2>开启您的第一份人生传记</h2>
            <p>通过 AI 采访，把人生故事、家风记忆永久保存下来。</p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => navigate('/onboarding')}><Mic size={16} /> 新建传记</button>
              {!isMVP && <button className="btn btn-hero-secondary" onClick={() => navigate('/family')}><Users size={16} /> 进入家庭空间</button>}
            </div>
          </div>
        </section>
      )}

      <section className="home-hero">
        <div className="hero-copy">
          <h2>用 AI 记录人生故事，<br />传承家风温度</h2>
          <p>AI数字人生 · 家庭记忆沉淀 · 家风传承 · 数字陪伴</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={handleStartInterview}><Mic size={16} /> 开始智能采访</button>
            {!isMVP && <button className="btn btn-hero-secondary" onClick={() => navigate('/family')}><Users size={16} /> 进入家庭空间</button>}
          </div>
        </div>
        <div className="hero-visual" aria-hidden>
          <svg viewBox="0 0 560 320" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FDF8EE" />
                <stop offset="100%" stopColor="#F8F6F2" />
              </linearGradient>
              <linearGradient id="mt1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DBEBE4" />
                <stop offset="100%" stopColor="#F0F7F4" />
              </linearGradient>
              <linearGradient id="mt2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B7D7CB" />
                <stop offset="100%" stopColor="#DBEBE4" />
              </linearGradient>
              <linearGradient id="mt3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3D7A64" />
                <stop offset="100%" stopColor="#2D5A4A" />
              </linearGradient>
              <linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4A84B" />
                <stop offset="100%" stopColor="#B8860B" />
              </linearGradient>
              <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                <feOffset dx="0" dy="2" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.1" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect width="560" height="320" fill="url(#sky)" />
            
            {/* 太阳 */}
            <circle cx="460" cy="80" r="35" fill="url(#sunGrad)" opacity="0.3" />
            <circle cx="460" cy="80" r="25" fill="url(#sunGrad)" opacity="0.5" />
            
            {/* 远山 - 三层递进，营造深远感 */}
            <path d="M0,320 L0,210 Q70,160 140,200 T280,180 T420,210 T560,190 L560,320 Z" fill="url(#mt1)" opacity="0.5" />
            <path d="M0,320 L0,240 Q100,190 200,230 T400,210 T560,240 L560,320 Z" fill="url(#mt2)" opacity="0.6" />
            <path d="M0,320 L0,280 Q120,240 240,275 T480,260 T560,280 L560,320 Z" fill="url(#mt3)" opacity="0.75" />
            
            {/* 云纹装饰 */}
            <g opacity="0.4" fill="#fff">
              <ellipse cx="120" cy="100" rx="40" ry="12" />
              <ellipse cx="140" cy="95" rx="30" ry="10" />
              <ellipse cx="320" cy="70" rx="50" ry="14" />
              <ellipse cx="350" cy="65" rx="35" ry="11" />
            </g>
            
            {/* 传统建筑 - 亭台 */}
            <g transform="translate(360, 200)" opacity="0.9" filter="url(#softShadow)">
              {/* 屋顶 */}
              <path d="M-10,30 L30,-5 L70,30 Z" fill="#2D5A4A" />
              <path d="M0,30 L30,5 L60,30 Z" fill="#3D7A64" />
              {/* 屋檐装饰 */}
              <rect x="-5" y="28" width="70" height="4" fill="#B8860B" opacity="0.8" />
              {/* 柱子 */}
              <rect x="5" y="32" width="6" height="30" fill="#2D5A4A" />
              <rect x="49" y="32" width="6" height="30" fill="#2D5A4A" />
              {/* 基座 */}
              <rect x="0" y="60" width="60" height="8" fill="#1E4035" rx="1" />
            </g>
            
            {/* 松树 - 迎客松风格 */}
            <g transform="translate(160, 230)" opacity="0.9">
              <path d="M12,50 L12,20" stroke="#2D5A4A" strokeWidth="4" fill="none" strokeLinecap="round" />
              {/* 松枝 */}
              <path d="M12,25 Q-5,15 -15,20" stroke="#2D5A4A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M12,30 Q30,20 40,25" stroke="#2D5A4A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M12,20 Q0,8 12,5 Q24,8 12,20" fill="#3D7A64" />
              <path d="M-10,18 Q-18,12 -10,10 Q-2,12 -10,18" fill="#3D7A64" />
              <path d="M35,22 Q42,16 35,14 Q28,16 35,22" fill="#3D7A64" />
            </g>
            
            {/* 第二棵松树 */}
            <g transform="translate(220, 240)" opacity="0.85">
              <path d="M10,45 L10,18" stroke="#2D5A4A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M10,22 Q-3,14 -12,18" stroke="#2D5A4A" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M10,28 Q25,20 35,24" stroke="#2D5A4A" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M10,18 Q0,8 10,5 Q20,8 10,18" fill="#3D7A64" />
              <path d="M-8,16 Q-15,10 -8,8 Q-1,10 -8,16" fill="#3D7A64" />
              <path d="M30,21 Q38,15 30,13 Q22,15 30,21" fill="#3D7A64" />
            </g>
            
            {/* 飞鸟 */}
            <g fill="none" stroke="#2D5A4A" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
              <path d="M280,120 Q290,110 300,120 Q310,110 320,120" />
              <path d="M340,100 Q348,92 356,100 Q364,92 372,100" />
              <path d="M200,140 Q206,134 212,140 Q218,134 224,140" />
            </g>
            
            {/* 水面波纹 */}
            <g opacity="0.3" stroke="#2D5A4A" strokeWidth="1" fill="none">
              <path d="M50,300 Q100,295 150,300" />
              <path d="M400,305 Q450,300 500,305" />
            </g>
          </svg>
        </div>
      </section>

      <section className="workspace">
        <div className="surface activity-surface">
          <div className="surface-header">
            <h3>最近动态</h3>
            {!isMVP && <button className="btn btn-ghost" onClick={() => navigate('/family/events')}>查看全部</button>}
          </div>
          <div className="activity-list">
            {activities.map((a, i) => (
              <div className="activity-row" key={i}>
                {a.user === '系统' ? <div className="activity-avatar system">系</div> : <Avatar name={a.user} size={38} />}
                <div className="activity-main">
                  <div className="activity-title"><strong>{a.user}</strong> {a.action}</div>
                  <div className="activity-meta">{a.type} · {a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface todo-surface">
          <div className="surface-header">
            <h3>待办事项</h3>
            <button className="btn btn-ghost" onClick={() => navigate('/interview')}>查看全部</button>
          </div>
          <div className="todo-list">
            {todos.map((t, i) => (
              <div className="todo-row" key={i} onClick={() => t.path && navigate(t.path)}>
                <div className="todo-main">
                  <div className="todo-title">{t.title}</div>
                  <div className="todo-desc">{t.desc}</div>
                </div>
                <div className="todo-count">{t.count}</div>
                <ChevronRight size={16} className="todo-arrow" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <Modal
        open={showBasicModal}
        title={basicStep === 1 ? '完善基础信息' : '选择人生标签'}
        onClose={() => setShowBasicModal(false)}
        footer={
          <div className="basic-info-modal-footer">
            {basicStep === 2 && (
              <button className="btn btn-outline" onClick={() => setBasicStep(1)}>上一步</button>
            )}
            <button className="btn btn-outline" onClick={() => setShowBasicModal(false)}>取消</button>
            {basicStep === 1 ? (
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (!basicForm.name.trim() || !basicForm.birthYear.trim()) {
                    addToast('请填写姓名和出生年份', 'error');
                    return;
                  }
                  setBasicStep(2);
                }}
              >
                下一步
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSaveBasicInfo}>保存并开始采访</button>
            )}
          </div>
        }
      >
        {basicStep === 1 ? (
          <div className="basic-info-form">
            <div className="basic-info-row">
              <label>姓名 <span className="basic-info-required">*</span></label>
              <input
                type="text"
                value={basicForm.name}
                onChange={(e) => setBasicForm({ ...basicForm, name: e.target.value })}
                placeholder="请输入姓名"
              />
            </div>
            <div className="basic-info-row">
              <label>性别</label>
              <select
                value={basicForm.gender}
                onChange={(e) => setBasicForm({ ...basicForm, gender: e.target.value as '男' | '女' })}
              >
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
            <div className="basic-info-row">
              <label>出生年份 <span className="basic-info-required">*</span></label>
              <input
                type="text"
                value={basicForm.birthYear}
                onChange={(e) => setBasicForm({ ...basicForm, birthYear: e.target.value })}
                placeholder="如：1958"
              />
            </div>
            <div className="basic-info-row">
              <label>籍贯</label>
              <input
                type="text"
                value={basicForm.origin}
                onChange={(e) => setBasicForm({ ...basicForm, origin: e.target.value })}
                placeholder="如：江苏省苏州市"
              />
            </div>
            <div className="basic-info-row">
              <label>职业</label>
              <input
                type="text"
                value={basicForm.occupation}
                onChange={(e) => setBasicForm({ ...basicForm, occupation: e.target.value })}
                placeholder="如：教师"
              />
            </div>
          </div>
        ) : (
          <div className="basic-info-form">
            <p className="life-tags-hint">勾选符合的人生经历，AI 会根据这些标签生成更贴合的采访问题。</p>
            <div className="life-tags">
              {presetLifeTags.map((tag) => (
                <button
                  key={tag}
                  className={`life-tag ${selectedTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}
                  type="button"
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="custom-tag-row">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
                placeholder="输入自定义标签，按回车添加"
              />
              <button className="btn btn-outline" onClick={addCustomTag}>添加</button>
            </div>
            {selectedTags.length > 0 && (
              <div className="selected-tags">
                <span>已选择：</span>
                {selectedTags.map((tag) => (
                  <span className="selected-tag" key={tag}>
                    {tag}
                    <button onClick={() => toggleTag(tag)} type="button">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
