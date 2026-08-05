import {
  Mic,
  Users,
  ChevronRight,
  ShoppingBag,
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
import { generateInterviewTopics } from '../utils/interviewTopics';
import type { PublicBook } from '../mocks/types';
import './Home.css';

interface TodoItem {
  title: string;
  desc: string;
  count: number;
  path: string;
}

interface ActivityItem {
  user: string;
  action: string;
  time: string;
  type: string;
  ts: number;
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60 * 1000) return '刚刚';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} 小时前`;
  return `${Math.floor(diff / 86400000)} 天前`;
}

function parseChapterTime(updatedAt: string | null): number {
  if (!updatedAt) return 0;
  const ts = new Date(updatedAt).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

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
  createdAt?: string;
}

import { presetLifeTags } from '../data/lifeTags';

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

      const nextActivities: ActivityItem[] = [];
      archives.forEach((a) => {
        const ts = a.createdAt ? new Date(a.createdAt).getTime() : NaN;
        if (!Number.isNaN(ts)) {
          nextActivities.push({ user: '我', action: `创建了「${a.name}」的人生档案`, time: formatRelativeTime(ts), type: '档案创建', ts });
        }
        const chapters = loadJson<ChapterData[]>(`cj_biography_chapters_${a.id}`, []);
        const generated = chapters.filter((c) => c.status !== 'notGenerated' && c.updatedAt);
        if (generated.length > 0) {
          const latest = generated.reduce((m, c) => Math.max(m, parseChapterTime(c.updatedAt)), 0);
          if (latest > 0) {
            nextActivities.push({
              user: '系统',
              action: `已为「${a.name}」生成 ${generated.length} 个传记章节`,
              time: formatRelativeTime(latest),
              type: '传记生成完成',
              ts: latest,
            });
          }
        }
      });
      orders.forEach((o) => {
        const ts = new Date(o.createdAt).getTime();
        if (!Number.isNaN(ts)) {
          nextActivities.push({
            user: '我',
            action: `提交了订单「${o.productName}」（¥${o.amount.toFixed(2)}）`,
            time: formatRelativeTime(ts),
            type: o.status === 'pending_pay' ? '订单待支付' : '订单已支付',
            ts,
          });
        }
      });
      nextActivities.sort((a, b) => b.ts - a.ts);
      setActivities(nextActivities.slice(0, 6));
    });
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

  const platformCases = [
    {
      icon: BookOpen,
      color: '#b8860b',
      bg: 'rgba(184,134,11,0.1)',
      title: '样例传记',
      desc: '《父亲的创业之路》—— AI 采访生成的完整人物传记',
      path: '/biography-shelf',
    },
    {
      icon: Landmark,
      color: '#7c3aed',
      bg: 'rgba(124,58,237,0.1)',
      title: '示例数字馆',
      desc: '时间轴、相册、荣誉一站式呈现的人生数字博物馆',
      path: '/museum',
    },
    {
      icon: Cpu,
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.1)',
      title: '数字人示例',
      desc: '基于生平资料训练的数字人格，随时对话陪伴',
      path: '/digital-person',
    },
  ];

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

      {pendingInvites.length > 0 && (
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
      )}

      {collabArchives.length > 0 && (
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
      )}

      {!isMVP && (<>
      <section className="home-services">
        <div className="service-card" onClick={() => navigate('/store')}>
          <div className="service-icon" style={{ background: 'rgba(184,134,11,0.1)', color: '#b8860b' }}><ShoppingBag size={22} /></div>
          <div className="service-info">
            <h4>传承商城</h4>
            <p>实体书 · 纪念册 · 家风礼盒 · 永久二维码</p>
          </div>
          <ArrowRight size={16} className="service-arrow" />
        </div>
        {!isMVP && (
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
        <div className="service-card" onClick={() => navigate('/family')}>
          <div className="service-icon" style={{ background: 'rgba(217,119,6,0.1)', color: '#d97706' }}><Users size={22} /></div>
          <div className="service-info">
            <h4>家庭空间</h4>
            <p>成员档案 · 相册 · 时间轴</p>
          </div>
          <ArrowRight size={16} className="service-arrow" />
        </div>
        <div className="service-card" onClick={() => navigate('/museum')}>
          <div className="service-icon" style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}><Landmark size={22} /></div>
          <div className="service-info">
            <h4>数字博物馆</h4>
            <p>家风文物 · 家族展品 · 线上展馆</p>
          </div>
          <ArrowRight size={16} className="service-arrow" />
        </div>
        <div className="service-card" onClick={() => navigate('/biography-shelf')}>
          <div className="service-icon" style={{ background: 'rgba(2,132,199,0.1)', color: '#0284c7' }}><LibraryBig size={22} /></div>
          <div className="service-info">
            <h4>公开传记书架</h4>
            <p>名人传记 · 试读 · 付费解锁全本</p>
          </div>
          <ArrowRight size={16} className="service-arrow" />
        </div>
        <div className="service-card" onClick={() => navigate('/group-buy')}>
          <div className="service-icon" style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626' }}><BadgePercent size={22} /></div>
          <div className="service-info">
            <h4>99元拼团</h4>
            <p>好友拼团 · 立享优惠</p>
          </div>
          <ArrowRight size={16} className="service-arrow" />
        </div>
        <div className="service-card" onClick={() => navigate('/biographers')}>
          <div className="service-icon" style={{ background: 'rgba(13,148,136,0.1)', color: '#0d9488' }}><UserSearch size={22} /></div>
          <div className="service-info">
            <h4>找传记师</h4>
            <p>认证传记师 · 一对一传记服务</p>
          </div>
          <ArrowRight size={16} className="service-arrow" />
        </div>
        <div className="service-card" onClick={() => navigate('/partner/apply')}>
          <div className="service-icon" style={{ background: 'rgba(79,70,229,0.1)', color: '#4f46e5' }}><Handshake size={22} /></div>
          <div className="service-info">
            <h4>传记师/服务商入驻</h4>
            <p>入驻认证 · 接单结算 · 合作共赢</p>
          </div>
          <ArrowRight size={16} className="service-arrow" />
        </div>
      </section>

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

      <section className="home-cases">
        <div className="surface-header">
          <h3>平台案例展示</h3>
        </div>
        <div className="home-cases-grid">
          {platformCases.map((c) => (
            <div className="service-card" key={c.title} onClick={() => navigate(c.path)}>
              <div className="service-icon" style={{ background: c.bg, color: c.color }}><c.icon size={22} /></div>
              <div className="service-info">
                <h4>{c.title}</h4>
                <p>{c.desc}</p>
              </div>
              <ArrowRight size={16} className="service-arrow" />
            </div>
          ))}
        </div>
      </section>
      </>)}

      <section className="workspace">
        <div className="surface activity-surface">
          <div className="surface-header">
            <h3>最近动态</h3>
            {!isMVP && <button className="btn btn-ghost" onClick={() => navigate('/family/events')}>查看全部</button>}
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
