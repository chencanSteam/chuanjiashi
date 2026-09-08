import {
  Mic,
  Users,
  ChevronRight,
  TreePine,
  Cpu,
  ArrowRight,
  Landmark,
  LibraryBig,
  BadgePercent,
  UserSearch,
  Handshake,
  BookOpen,
  Eye,
  Flame,
  Upload,
  BadgeCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMemo, useEffect, useState } from 'react';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import { useVersion } from '../hooks/useVersion';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { openGuide, shouldShowGuide } from '../components/GuideTour';
import { findCollaboratingArchives, pendingInvitesForPhone, respondCollabInvite } from '../data/interviewCollaboration';
import { familyApi } from '../api/family';
import { bookshelfApi } from '../api/bookshelf';
import { orderApi } from '../api/order';
import { groupBuyApi } from '../api/groupBuy';
import { loadJson, type ChapterData } from '../data/aiMock';
import { loadRecentActivities, type ActivityItem } from '../utils/activities';
import { generateInterviewTopics } from '../utils/interviewTopics';
import type { PublicBook } from '../mocks/types';
import { defaultBiographers } from '../mocks/data/seed';
import Annotate from '../components/annotation/Annotate';
import './Home.css';

interface TodoItem {
  title: string;
  desc: string;
  count: number;
  path: string;
}

const biographyProcess = [
  { label: '信息建档', path: '/archive' },
  { label: '大事梳理', path: '/life-events' },
  { label: '多维增补', path: '/archive-enrichment' },
  { label: '提纲确认', path: '/biography/outline' },
  { label: '智能访谈', path: '/interview' },
  { label: '单篇精修', path: '/polish' },
  { label: '全书合成', path: '/biography' },
  { label: '审稿校对', path: '/biography' },
  { label: '终稿传世', path: '/my-works' },
];

const homePromises = [
  { title: '素材采集', desc: '收录真实人生' },
  { title: '框架搭建', desc: '梳理人生脉络' },
  { title: '多维增补', desc: '还原时代人情' },
  { title: '精修定稿', desc: '成就传世传记' },
];

const featuredBiographers = defaultBiographers
  .filter((biographer) => biographer.status === 'approved' && biographer.intro)
  .slice(0, 4);

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
  birthDate?: string;
  origin: string;
  originDetail?: string;
  industry?: string;
  occupation: string;
  tags?: string[];
  createdAt?: string;
}

import { regions } from '../data/regions';
import { industryOptions, industryOccupations } from '../data/occupations';

function loadArchives(): Archive[] {
  try {
    const raw = localStorage.getItem('cj_archives');
    if (raw) return JSON.parse(raw) as Archive[];
  } catch {
    // ignore
  }
  return [];
}

function saveArchive(archive: Archive) {
  const existing = loadArchives();
  const filtered = existing.filter((a) => a.id !== archive.id);
  localStorage.setItem('cj_archives', JSON.stringify([...filtered, archive]));
  localStorage.setItem('cj_current_archive_id', archive.id);
}

/** 新建档案表单的空初始值 */
const EMPTY_BASIC_FORM = {
  name: '',
  gender: '男' as '男' | '女',
  birthYear: '',
  birthMonth: '',
  birthDay: '',
  originProvince: '',
  originCity: '',
  originDistrict: '',
  originDetail: '',
  industry: '',
  occupation: '',
};

// 出生日期下拉的年份范围：1900 至今
const currentYear = new Date().getFullYear();
const birthYearOptions = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => String(currentYear - i));

/** 该档案是否已有智能采访记录（采访逐字稿非空即视为已采访） */
function hasInterviewSession(archiveId: string): boolean {
  try {
    const raw = localStorage.getItem(`cj_interview_transcript_${archiveId}`);
    if (!raw) return false;
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.length > 0;
  } catch {
    return false;
  }
}

export default function Home() {
  const navigate = useNavigate();
  const { isV1 } = useVersion();
  const { user } = useAuth();
  const archiveExists = useMemo(() => hasArchives(), []);
  // 当前账号被邀请协助的传记（协作者入口，按昵称匹配）
  const [inviteRefresh, setInviteRefresh] = useState(0);
  const collabArchives = useMemo(
    () => (user?.name ? findCollaboratingArchives(user.name) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, inviteRefresh]
  );
  // 待我处理的协作邀请（对方同意后才成为协作者）
  const pendingInvites = useMemo(
    () => (user?.phone ? pendingInvitesForPhone(user.phone) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, inviteRefresh]
  );

  const handleRespondInvite = async (id: string, accept: boolean) => {
    const accepterName = user?.name || '';
    const invite = respondCollabInvite(id, accept, accepterName);
    if (!invite) return;
    // 人物关系邀请：同意后把关系写入对方档案的关系图谱
    if (accept && invite.kind === 'relation') {
      try {
        await familyApi.addOrUpdateMember(invite.archiveId, { name: accepterName, role: invite.relation, gen: '其他' });
        await familyApi.addRelation(invite.archiveId, { from: invite.subjectName, to: accepterName, relation: invite.relation });
      } catch {
        // 写入失败不影响邀请状态
      }
    }
    setInviteRefresh((v) => v + 1);
    addToast(
      accept
        ? invite.kind === 'relation'
          ? `已同意与「${invite.subjectName}」建立「${invite.relation}」关系`
          : `已同意协助《${invite.archiveName} 的传记》，可在采访页选择该传记开始协助`
        : '已拒绝该邀请',
      accept ? 'success' : 'info'
    );
  };

  useEffect(() => {
    if (shouldShowGuide()) {
      const timer = setTimeout(() => openGuide(), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const { addToast } = useToast();
  const [hotBooks, setHotBooks] = useState<PublicBook[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // 待办事项与最近动态：从真实数据源（档案/采访进度/订单/拼团/传记草稿）生成
  useEffect(() => {
    const archives = loadArchives();

    // 采访未完成：已回答题目数少于应答题数即视为档案完整度不足
    const incompleteArchives = archives.filter((a) => {
      const topics = generateInterviewTopics(a, a.id);
      const total = topics.reduce((sum, t) => sum + t.questions.length, 0);
      const answered = Object.keys(loadJson<Record<string, string>>(`cj_interview_answers_${a.id}`, {})).length;
      return total === 0 || answered < total;
    });

    // 传记草稿未完成：已有章节生成但尚未全部完成
    const draftArchives = archives.filter((a) => {
      const chapters = loadJson<ChapterData[]>(`cj_biography_chapters_${a.id}`, []);
      const generated = chapters.filter((c) => c.status !== 'notGenerated').length;
      return generated > 0 && generated < chapters.length;
    });

    Promise.all([
      orderApi.list().catch(() => []),
      groupBuyApi.records().catch(() => []),
    ]).then(([orders, groupRecords]) => {
      const pendingOrders = orders.filter((o) => o.status === 'pending_pay');
      const pendingGroups = groupRecords.filter((r) => r.status === 'pending');

      const nextTodos: TodoItem[] = [];
      if (incompleteArchives.length > 0) {
        nextTodos.push({
          title: '待继续采访',
          desc: `「${incompleteArchives[0].name}」等 ${incompleteArchives.length} 份档案采访未完成`,
          count: incompleteArchives.length,
          path: '/interview',
        });
      }
      if (pendingOrders.length > 0) {
        nextTodos.push({
          title: '待支付订单',
          desc: `「${pendingOrders[0].productName}」等 ${pendingOrders.length} 笔订单待支付`,
          count: pendingOrders.length,
          path: '/my-orders',
        });
      }
      if (pendingGroups.length > 0) {
        nextTodos.push({
          title: '拼团进行中',
          desc: `有 ${pendingGroups.length} 个拼团等待成团，快邀请好友参团`,
          count: pendingGroups.length,
          path: '/group-buy',
        });
      }
      if (draftArchives.length > 0) {
        nextTodos.push({
          title: '传记草稿待完成',
          desc: `《${draftArchives[0].name}传记》等 ${draftArchives.length} 份草稿还有章节未生成`,
          count: draftArchives.length,
          path: '/biography',
        });
      }
      setTodos(nextTodos);
    });
  }, []);

  // 最近动态：与移动端首页共用同一聚合逻辑（utils/activities.ts）
  useEffect(() => {
    loadRecentActivities(6).then(setActivities);
  }, []);

  // 热门传记推荐：从公开书架拉取，按浏览量 + 点赞数排序取前 4 本
  useEffect(() => {
    bookshelfApi
      .list()
      .then((list) => {
        const sorted = [...list]
          .filter((b) => b.status === 'approved')
          .sort((a, b) => b.views + b.likes - (a.views + a.likes))
          .slice(0, 4);
        setHotBooks(sorted);
      })
      .catch(() => setHotBooks([]));
  }, []);

  const [showBasicModal, setShowBasicModal] = useState(false);
  const [showArchivePicker, setShowArchivePicker] = useState(false);
  const [selectedBiographer, setSelectedBiographer] = useState<(typeof featuredBiographers)[number] | null>(null);

  // 开始智能采访：① 已有采访记录 → 直接进采访页；② 无采访但有档案 → 弹窗选择档案；③ 无档案 → 新建档案后开始
  const handleStartInterview = () => {
    const archives = loadArchives();
    const withInterview = archives.filter((a) => hasInterviewSession(a.id));
    if (withInterview.length > 0) {
      const currentId = localStorage.getItem('cj_current_archive_id');
      const target = withInterview.find((a) => a.id === currentId) || withInterview[0];
      localStorage.setItem('cj_current_archive_id', target.id);
      navigate('/interview');
      return;
    }
    if (archives.length > 0) {
      setShowArchivePicker(true);
      return;
    }
    setBasicForm(EMPTY_BASIC_FORM);
    setShowBasicModal(true);
  };

  const handlePickArchive = (archive: Archive) => {
    localStorage.setItem('cj_current_archive_id', archive.id);
    setShowArchivePicker(false);
    navigate('/interview');
  };
  const [basicForm, setBasicForm] = useState({ ...EMPTY_BASIC_FORM });

  const handleSaveBasicInfo = () => {
    if (!basicForm.name.trim()) {
      addToast('请填写姓名', 'error');
      return;
    }
    if (!basicForm.originProvince || !basicForm.originCity || !basicForm.originDistrict) {
      addToast('请选择完整的籍贯（省 / 市 / 区）', 'error');
      return;
    }
    const birthParts = [basicForm.birthYear, basicForm.birthMonth, basicForm.birthDay];
    if (birthParts.some(Boolean) && !birthParts.every(Boolean)) {
      addToast('请完整选择出生日期（年 / 月 / 日）', 'error');
      return;
    }
    const archiveId = localStorage.getItem('cj_current_archive_id') || `archive_${Date.now()}`;
    saveArchive({
      id: archiveId,
      name: basicForm.name.trim(),
      gender: basicForm.gender,
      birthYear: basicForm.birthYear,
      birthDate: basicForm.birthYear ? `${basicForm.birthYear}-${basicForm.birthMonth}-${basicForm.birthDay}` : undefined,
      origin: `${basicForm.originProvince}${basicForm.originCity}${basicForm.originDistrict}`,
      originDetail: basicForm.originDetail.trim() || undefined,
      industry: basicForm.industry || undefined,
      occupation: basicForm.occupation,
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
        <Annotate id="home.empty-hero">
        <section className="home-hero home-hero-empty">
          <div className="hero-copy">
            <h2>开启您的第一份人生传记</h2>
            <p>通过 AI 采访，把人生故事、家风记忆永久保存下来。</p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => navigate('/onboarding')}><Mic size={16} /> 新建传记</button>
              {!isV1 && <button className="btn btn-hero-secondary" onClick={() => navigate('/family')}><Users size={16} /> 进入家庭空间</button>}
            </div>
          </div>
        </section>
        </Annotate>
      )}

      <Annotate id="home.start-interview">
      <section className="home-hero">
        <div className="hero-copy">
          <h2>八维立体录岁月，<br />一人一书传家风</h2>
          <p>从真实素材采集，到人生脉络梳理，陪你把一生写成一本传世传记。</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={handleStartInterview}><Mic size={16} /> 开始智能采访</button>
            <button className="btn btn-hero-secondary" onClick={() => navigate('/polish')}><Upload size={16} /> 已有传记上传</button>
            {!isV1 && <button className="btn btn-hero-secondary" onClick={() => navigate('/family')}><Users size={16} /> 进入家庭空间</button>}
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
      </Annotate>

      <section className="home-process-section">
        <div className="home-section-heading">
          <div>
            <h3>传记生成流程</h3>
          </div>
        </div>
        <div className="home-process-track">
          {biographyProcess.map((stage, index) => (
            <button className="home-process-step" key={stage.label} type="button" onClick={() => navigate(stage.path)} title={`前往${stage.label}`}>
              <div className="home-process-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="home-process-label">{stage.label}</div>
              {index < biographyProcess.length - 1 && <ArrowRight className="home-process-arrow" size={16} />}
            </button>
          ))}
        </div>
      </section>

      <section className="home-promise-section">
        <div className="home-promise-lead">
          <h3>把零散记忆，整理成可以传下去的家风。</h3>
        </div>
        <div className="home-promise-list">
          {homePromises.map((promise, index) => (
            <div className="home-promise-item" key={promise.title}>
              <span>0{index + 1}</span>
              <div>
                <strong>{promise.title}</strong>
                <p>{promise.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="home-biographer-section">
        <div className="home-section-heading home-biographer-heading">
          <div>
            <h3>专业传记师，陪你把故事写深</h3>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate('/biographers')}>查看全部传记师 <ChevronRight size={15} /></button>
        </div>
        <div className="home-biographer-grid">
          {featuredBiographers.map((biographer) => (
            <button
              className="home-biographer-card"
              key={biographer.id}
              type="button"
              onClick={() => setSelectedBiographer(biographer)}
            >
              <Avatar name={biographer.name} src={biographer.avatar} size={64} className="home-biographer-avatar" />
              <div className="home-biographer-copy">
                <div className="home-biographer-name-row">
                  <strong>{biographer.name}</strong>
                  <span>{biographer.city}</span>
                </div>
                <div className="home-biographer-title">{biographer.title || '传记师'}</div>
                <p>{biographer.intro}</p>
              </div>
              <ChevronRight className="home-biographer-arrow" size={18} />
            </button>
          ))}
        </div>
      </section>

      {pendingInvites.length > 0 && (
        <Annotate id="home.collab-invites">
        <section className="home-collab">
          <div className="surface-header">
            <h3><Users size={16} /> 协作邀请</h3>
          </div>
          <div className="home-collab-list">
            {pendingInvites.map((inv) => (
              <div className="service-card" key={inv.id}>
                <div className="service-icon" style={{ background: 'rgba(184,134,11,0.1)', color: '#b8860b' }}><Mic size={22} /></div>
                <div className="service-info">
                  <h4>{inv.archiveName} 的传记</h4>
                  <p>
                    {inv.kind === 'relation'
                      ? `${inv.inviterName} 邀请你与「${inv.subjectName}」建立「${inv.relation}」关系`
                      : inv.scope === 'edit'
                        ? `${inv.inviterName} 邀请你以「${inv.relation}」身份协助修改传记`
                        : `${inv.inviterName} 邀请你以「${inv.relation}」身份协助采访`}
                  </p>
                </div>
                <div className="home-invite-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => handleRespondInvite(inv.id, true)}>同意</button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleRespondInvite(inv.id, false)}>拒绝</button>
                </div>
              </div>
            ))}
          </div>
        </section>
        </Annotate>
      )}

      {collabArchives.length > 0 && (
        <Annotate id="home.collab-archives">
        <section className="home-collab">
          <div className="surface-header">
            <h3><Users size={16} /> 我协助的传记</h3>
          </div>
          <div className="home-collab-list">
            {collabArchives.map((c) => (
              <div
                className="service-card"
                key={c.archiveId}
                onClick={() => {
                  localStorage.setItem('cj_current_archive_id', c.archiveId);
                  navigate('/interview');
                }}
              >
                <div className="service-icon" style={{ background: 'rgba(45,90,74,0.1)', color: '#2d5a4a' }}><Mic size={22} /></div>
                <div className="service-info">
                  <h4>{c.archiveName} 的传记</h4>
                  <p>{c.invited ? `邀请你以「${c.relation}」身份协助采访` : `你以「${c.relation}」身份协助采访`}</p>
                </div>
                <ArrowRight size={16} className="service-arrow" />
              </div>
            ))}
          </div>
        </section>
        </Annotate>
      )}

      <section className="home-services">
        {!isV1 && (
          <>
            <div className="service-card" onClick={() => navigate('/family-hall')}>
              <div className="service-icon" style={{ background: 'rgba(45,90,74,0.1)', color: '#2d5a4a' }}><TreePine size={22} /></div>
              <div className="service-info">
                <h4>AI 家风馆</h4>
                <p>家训族规 · 家风故事 · 纪念册</p>
              </div>
              <ArrowRight size={16} className="service-arrow" />
            </div>
            <div className="service-card" onClick={() => navigate('/digital-person')}>
              <div className="service-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><Cpu size={22} /></div>
              <div className="service-info">
                <h4>数字人生</h4>
                <p>数字陪伴 · 语音互动 · 家族记忆</p>
              </div>
              <ArrowRight size={16} className="service-arrow" />
            </div>
          </>
        )}
        {!isV1 && (
        <div className="service-card" onClick={() => navigate('/family')}>
          <div className="service-icon" style={{ background: 'rgba(217,119,6,0.1)', color: '#d97706' }}><Users size={22} /></div>
          <div className="service-info">
            <h4>家庭空间</h4>
            <p>成员档案 · 相册 · 时间轴</p>
          </div>
          <ArrowRight size={16} className="service-arrow" />
        </div>
        )}
        {!isV1 && (
        <div className="service-card" onClick={() => navigate('/museum')}>
          <div className="service-icon" style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}><Landmark size={22} /></div>
          <div className="service-info">
            <h4>数字博物馆</h4>
            <p>家风文物 · 家族展品 · 线上展馆</p>
          </div>
          <ArrowRight size={16} className="service-arrow" />
        </div>
        )}
        <div className="service-card" onClick={() => navigate('/biography-shelf')}>
          <div className="service-icon" style={{ background: 'rgba(2,132,199,0.1)', color: '#0284c7' }}><LibraryBig size={22} /></div>
          <div className="service-info">
            <h4>公开传记书架</h4>
            <p>名人传记 · 试读 · 付费解锁全本</p>
          </div>
          <ArrowRight size={16} className="service-arrow" />
        </div>
        {!isV1 && (
        <div className="service-card" onClick={() => navigate('/group-buy')}>
          <div className="service-icon" style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626' }}><BadgePercent size={22} /></div>
          <div className="service-info">
            <h4>99元拼团</h4>
            <p>好友拼团 · 立享优惠</p>
          </div>
          <ArrowRight size={16} className="service-arrow" />
        </div>
        )}
        <div className="service-card" onClick={() => navigate('/biographers')}>
          <div className="service-icon" style={{ background: 'rgba(13,148,136,0.1)', color: '#0d9488' }}><UserSearch size={22} /></div>
          <div className="service-info">
            <h4>找传记师</h4>
            <p>认证传记师 · 一对一传记服务</p>
          </div>
          <ArrowRight size={16} className="service-arrow" />
        </div>
        <div className="service-card" onClick={() => navigate('/biographer-apply')}>
          <div className="service-icon" style={{ background: 'rgba(13,148,136,0.1)', color: '#0d9488' }}><BadgeCheck size={22} /></div>
          <div className="service-info">
            <h4>传记师入驻</h4>
            <p>入驻认证 · 在线接单 · 服务结算</p>
          </div>
          <ArrowRight size={16} className="service-arrow" />
        </div>
        <div className="service-card" onClick={() => navigate('/partner/apply')}>
          <div className="service-icon" style={{ background: 'rgba(79,70,229,0.1)', color: '#4f46e5' }}><Handshake size={22} /></div>
          <div className="service-info">
            <h4>合伙人申请</h4>
            <p>区域合伙 · 分润结算 · 合作共赢</p>
          </div>
          <ArrowRight size={16} className="service-arrow" />
        </div>
      </section>

      <Annotate id="home.hot-books">
      <section className="home-hot-books">
        <div className="surface-header">
          <h3><Flame size={16} /> 热门传记推荐</h3>
          <button className="btn btn-ghost" onClick={() => navigate('/biography-shelf')}>查看全部</button>
        </div>
        {hotBooks.length === 0 ? (
          <div className="hot-books-empty">暂无推荐传记，去公开书架看看吧</div>
        ) : (
          <div className="hot-books-grid">
            {hotBooks.map((b) => (
              <div className="hot-book-card" key={b.id} onClick={() => navigate(`/biography-shelf/${b.id}`)}>
                <div className="hot-book-cover">
                  {b.cover ? <img src={b.cover} alt={b.title} /> : <BookOpen size={32} />}
                </div>
                <div className="hot-book-body">
                  <div className="hot-book-title">{b.title}</div>
                  <div className="hot-book-author">{b.author}</div>
                  <div className="hot-book-footer">
                    <span className="hot-book-price">{b.isFree || b.price === 0 ? '免费' : `¥${b.price.toFixed(2)}`}</span>
                    <span className="hot-book-views"><Eye size={12} /> {b.views}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      </Annotate>

      <section className="workspace">
        <Annotate id="home.activities">
        <div className="surface activity-surface">
          <div className="surface-header">
            <h3>最近动态</h3>
            {!isV1 && <button className="btn btn-ghost" onClick={() => navigate('/family/events')}>查看全部</button>}
          </div>
          <div className="activity-list">
            {activities.length === 0 ? (
              <div className="activity-empty">暂无动态</div>
            ) : (
              activities.map((a, i) => (
                <div className="activity-row" key={i}>
                  {a.user === '系统' ? <div className="activity-avatar system">系</div> : <Avatar name={a.user} size={38} />}
                  <div className="activity-main">
                    <div className="activity-title"><strong>{a.user}</strong> {a.action}</div>
                    <div className="activity-meta">{a.type} · {a.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </Annotate>

        <Annotate id="home.todo-list">
        <div className="surface todo-surface">
          <div className="surface-header">
            <h3>待办事项</h3>
            <button className="btn btn-ghost" onClick={() => navigate('/interview')}>查看全部</button>
          </div>
          <div className="todo-list">
            {todos.length === 0 ? (
              <div className="todo-empty">暂无待办事项</div>
            ) : (
              todos.map((t, i) => (
                <div className="todo-row" key={i} onClick={() => t.path && navigate(t.path)}>
                  <div className="todo-main">
                    <div className="todo-title">{t.title}</div>
                    <div className="todo-desc">{t.desc}</div>
                  </div>
                  <div className="todo-count">{t.count}</div>
                  <ChevronRight size={16} className="todo-arrow" />
                </div>
              ))
            )}
          </div>
        </div>
        </Annotate>
      </section>

      <Modal
        open={Boolean(selectedBiographer)}
        title={selectedBiographer ? `${selectedBiographer.name} · 传记师简介` : '传记师简介'}
        onClose={() => setSelectedBiographer(null)}
        footer={
          <div className="basic-info-modal-footer">
            <button className="btn btn-outline" onClick={() => setSelectedBiographer(null)}>关闭</button>
            <button className="btn btn-primary" onClick={() => { setSelectedBiographer(null); navigate('/biographers'); }}>查看传记师详情</button>
          </div>
        }
      >
        {selectedBiographer && (
          <div className="home-biographer-modal">
            <div className="home-biographer-modal-profile">
              <Avatar name={selectedBiographer.name} src={selectedBiographer.avatar} size={76} />
              <div>
                <h4>{selectedBiographer.name}</h4>
                <p>{selectedBiographer.title || '传记师'} · {selectedBiographer.city}</p>
              </div>
            </div>
            <p className="home-biographer-modal-intro">{selectedBiographer.intro}</p>
            <div className="home-biographer-modal-meta">
              <span>从业 {selectedBiographer.experience} 年</span>
              <span>服务 {selectedBiographer.completedOrders || 0} 个家庭</span>
              <span>评分 {selectedBiographer.rating.toFixed(1)}</span>
            </div>
            <div className="home-biographer-modal-tags">
              {(selectedBiographer.specialties || []).map((specialty) => <span key={specialty}>{specialty}</span>)}
            </div>
          </div>
        )}
      </Modal>

      <Annotate id="home.basic-info-modal">
      <Modal
        open={showBasicModal}
        title="新建档案"
        onClose={() => setShowBasicModal(false)}
        footer={
          <div className="basic-info-modal-footer">
            <button className="btn btn-outline" onClick={() => setShowBasicModal(false)}>取消</button>
            <button className="btn btn-primary" onClick={handleSaveBasicInfo}>保存并开始采访</button>
          </div>
        }
      >
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
            <label>出生日期</label>
            <div className="basic-info-date-row">
              <select value={basicForm.birthYear} onChange={(e) => setBasicForm({ ...basicForm, birthYear: e.target.value })}>
                <option value="">年</option>
                {birthYearOptions.map((y) => (
                  <option value={y} key={y}>{y} 年</option>
                ))}
              </select>
              <select value={basicForm.birthMonth} onChange={(e) => setBasicForm({ ...basicForm, birthMonth: e.target.value })}>
                <option value="">月</option>
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                  <option value={m} key={m}>{Number(m)} 月</option>
                ))}
              </select>
              <select value={basicForm.birthDay} onChange={(e) => setBasicForm({ ...basicForm, birthDay: e.target.value })}>
                <option value="">日</option>
                {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                  <option value={d} key={d}>{Number(d)} 日</option>
                ))}
              </select>
            </div>
          </div>
          <div className="basic-info-row">
            <label>籍贯 <span className="basic-info-required">*</span></label>
            <div className="basic-info-date-row">
              <select value={basicForm.originProvince} onChange={(e) => setBasicForm({ ...basicForm, originProvince: e.target.value, originCity: '', originDistrict: '' })}>
                <option value="">省份</option>
                {regions.map((p) => (
                  <option value={p.name} key={p.name}>{p.name}</option>
                ))}
              </select>
              <select value={basicForm.originCity} onChange={(e) => setBasicForm({ ...basicForm, originCity: e.target.value, originDistrict: '' })} disabled={!basicForm.originProvince}>
                <option value="">城市</option>
                {(regions.find((p) => p.name === basicForm.originProvince)?.cities || []).map((c) => (
                  <option value={c.name} key={c.name}>{c.name}</option>
                ))}
              </select>
              <select value={basicForm.originDistrict} onChange={(e) => setBasicForm({ ...basicForm, originDistrict: e.target.value })} disabled={!basicForm.originCity}>
                <option value="">区/县</option>
                {(regions.find((p) => p.name === basicForm.originProvince)?.cities.find((c) => c.name === basicForm.originCity)?.districts || []).map((d) => (
                  <option value={d} key={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="basic-info-row">
            <label>详细地址</label>
            <input
              type="text"
              value={basicForm.originDetail}
              onChange={(e) => setBasicForm({ ...basicForm, originDetail: e.target.value })}
              placeholder="选填，如：平江路 12 号"
            />
          </div>
          <div className="basic-info-row">
            <label>行业</label>
            <select
              value={basicForm.industry}
              onChange={(e) => setBasicForm({ ...basicForm, industry: e.target.value, occupation: '' })}
            >
              <option value="">请选择行业</option>
              {industryOptions.map((i) => (
                <option value={i} key={i}>{i}</option>
              ))}
            </select>
          </div>
          <div className="basic-info-row">
            <label>职业</label>
            <select
              value={basicForm.occupation}
              onChange={(e) => setBasicForm({ ...basicForm, occupation: e.target.value })}
              disabled={!basicForm.industry}
            >
              <option value="">{basicForm.industry ? '请选择职业' : '请先选择行业'}</option>
              {(industryOccupations[basicForm.industry] || []).map((o) => (
                <option value={o} key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
      </Annotate>

      <Annotate id="home.archive-picker">
      <Modal
        open={showArchivePicker}
        title="选择采访档案"
        onClose={() => setShowArchivePicker(false)}
        footer={
          <div className="basic-info-modal-footer">
            <button className="btn btn-outline" onClick={() => setShowArchivePicker(false)}>取消</button>
            <button
              className="btn btn-outline"
              onClick={() => {
                setShowArchivePicker(false);
                setBasicForm({ ...EMPTY_BASIC_FORM });
                setShowBasicModal(true);
              }}
            >
              新建档案
            </button>
          </div>
        }
      >
        <p className="life-tags-hint">选择要为谁开始智能采访，也可以新建一份档案。</p>
        <div className="archive-picker-list">
          {loadArchives().map((a) => (
            <button type="button" className="archive-picker-item" key={a.id} onClick={() => handlePickArchive(a)}>
              <div className="archive-picker-name">{a.name}</div>
              <div className="archive-picker-meta">
                {[a.gender, a.birthYear && `${a.birthYear} 年生`, a.origin, a.occupation].filter(Boolean).join(' · ') || '未完善基础信息'}
              </div>
            </button>
          ))}
        </div>
      </Modal>
      </Annotate>
    </div>
  );
}
