import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Bell,
  Shield,
  Users,
  Database,
  HelpCircle,
  Sparkles,
  Mic,
  BookOpen,
  UserCircle2,
  FolderOpen,
  AlertCircle,
  CheckCircle,
  Trash2,
  X,
  Share2,
  Wallet,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Info,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { useAuth } from '../hooks/useAuth';
import { useVersion } from '../hooks/useVersion';
import { useToast } from '../hooks/useToast';
import { quotaApi } from '../api/quota';
import { regions } from '../data/regions';
import type { AIQuota } from '../mocks/types';
import { openGuide } from '../components/GuideTour';
import { commissionApi } from '../api/commission';
import type { CommissionRecord as MockCommissionRecord, WithdrawalRecord as MockWithdrawalRecord } from '../mocks/types';
import type { UserReward, UserWithdrawal } from '../data/userInviteData';
import Annotate from '../components/annotation/Annotate';
import './Settings.css';

const defaultQuota: AIQuota = {
  plan: '标准传记包',
  interviewQuestion: { used: 18, total: 30 },
  followUp: { used: 6, total: 10 },
  biographyGenerate: { used: 1, total: 3 },
  digitalDialog: { used: 12, total: 50 },
  storage: { usedMB: 268, totalMB: 1024 },
};

const sidebarItems = [
  { key: 'account', icon: User, label: '账户信息' },
  { key: 'invite', icon: Share2, label: '我的邀请' },
  { key: 'quota', icon: Sparkles, label: 'AI额度' },
  { key: 'notification', icon: Bell, label: '通知设置' },
  { key: 'privacy', icon: Shield, label: '隐私与安全' },
  { key: 'family', icon: Users, label: '家庭成员' },
  { key: 'storage', icon: Database, label: '存储与备份' },
  { key: 'help', icon: HelpCircle, label: '帮助与反馈' },
];

const familyMembers = [
  { name: '张一帆', role: '户主', phone: '138****1234', email: 'zhang@example.com' },
  { name: '李秀英', role: '配偶', phone: '139****5678', email: 'li@example.com' },
  { name: '张伟', role: '子女', phone: '137****9012', email: 'wei@example.com' },
];

const initialNotifications = [
  { label: 'AI 采访完成提醒', checked: true },
  { label: '传记章节生成通知', checked: true },
  { label: '家庭成员动态提醒', checked: false },
  { label: '纪念日/节日提醒', checked: true },
  { label: '政务办理进度通知', checked: true },
  { label: '系统更新与公告', checked: false },
];

const helpArticles: { label: string; paragraphs: string[] }[] = [
  {
    label: '新手指引：创建第一份人生档案',
    paragraphs: [
      '进入「首页」后，点击「开始智能采访」，先填写档案主人的基础信息：姓名、性别、出生年份、籍贯与职业。这些信息会帮助 AI 生成更贴合的采访问题。',
      '第二步可以为档案主人勾选人生标签，例如「参军入伍」「下海创业」「教书育人」等。标签越准确，采访提纲就越有针对性。',
      '保存基础信息后，系统会自动创建一份人生档案并进入采访页面。你也可以随时在「人生档案馆」中为多位家人分别建档。',
    ],
  },
  {
    label: '如何完成一次 AI 智能采访',
    paragraphs: [
      '采访按主题分章节进行，涵盖童年、求学、工作、家庭、人生感悟等阶段。AI 会逐题提问，您可以用文字或语音回答，语音会自动转写为文字。',
      '回答较短时，AI 会自动追问细节，比如当时的人物、地点和感受。不用担心答得不完整，后续可以随时回到任意问题补充或修改。',
      '采访进度实时保存在本机，中途退出不会丢失。全部主题完成后，系统会自动从采访记录中整理出人生大事时间线，供您确认后写入档案。',
    ],
  },
  {
    label: '传记生成与导出指南',
    paragraphs: [
      '采访完成后，进入「AI 传记生成」页面，选择文风（朴实自然、温情叙事、典雅文言、新闻纪实）和篇幅，即可一键生成全部章节。',
      '每个章节都可以单独重新生成或手动润色，编辑器支持插入照片。修改会实时保存，直到您满意为止。',
      '定稿后可在「数字资产」页导出 PDF 打印稿和 EPUB 电子书，也可以申请精装书制作、生成纪念短视频与码记二维码，并为传记做区块链存证。',
    ],
  },
  {
    label: 'AI 额度与套餐说明',
    paragraphs: [
      '平台按套餐提供 AI 额度，包括采访问题数、延伸提问数、传记生成次数和数字人对话次数。当前用量可在「设置 - AI 额度」中查看。',
      '额度按月或按次计算：采访与对话类额度每月重置，传记生成次数按套餐总量累计。额度不足时，对应功能会提示升级。',
      '如需更多额度，可在「AI 额度」页点击「升级套餐」，选择标准、尊享或家族套餐，支付成功后额度立即生效。',
    ],
  },
  {
    label: '数据备份与隐私安全',
    paragraphs: [
      '您的档案、采访记录与传记数据默认保存在本机浏览器中，平台不会将这些内容用于本服务之外的用途。',
      '建议定期在「设置 - 存储与备份」中点击「立即备份」，系统会将全部数据打包为 JSON 文件下载保存，更换设备时可凭备份文件恢复。',
      '数字馆支持公开、私密、密码和家人共享四种访问权限，可在数字博物馆的「权限设置」中随时调整。涉及敏感话题的对话会被系统自动拦截。',
    ],
  },
];

interface UpgradePlan {
  key: string;
  name: string;
  price: number;
  features: string[];
  quota: {
    interviewQuestion: number;
    followUp: number;
    biographyGenerate: number;
    digitalDialog: number;
    storageMB: number;
  };
}

const upgradePlans: UpgradePlan[] = [
  {
    key: 'standard',
    name: '标准传记包',
    price: 199,
    features: ['AI 采访问题 30 条/月', 'AI 延伸提问 10 条/月', '传记生成 3 次', '数字人对话 50 次/月', '素材存储 1GB'],
    quota: { interviewQuestion: 30, followUp: 10, biographyGenerate: 3, digitalDialog: 50, storageMB: 1024 },
  },
  {
    key: 'premium',
    name: '尊享传记包',
    price: 399,
    features: ['AI 采访问题 100 条/月', 'AI 延伸提问 30 条/月', '传记生成 10 次', '数字人对话 200 次/月', '素材存储 5GB', '优先客服支持'],
    quota: { interviewQuestion: 100, followUp: 30, biographyGenerate: 10, digitalDialog: 200, storageMB: 5120 },
  },
  {
    key: 'family',
    name: '家族传承包',
    price: 899,
    features: ['AI 采访问题不限量', 'AI 延伸提问不限量', '传记生成 30 次', '数字人对话不限量', '素材存储 20GB', '家庭共享 5 名成员', '专属传记顾问'],
    quota: { interviewQuestion: 999, followUp: 999, biographyGenerate: 30, digitalDialog: 999, storageMB: 20480 },
  },
];

export default function Settings() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { section } = useParams<{ section: string }>();
  const { user, updateUser } = useAuth();
  const { isV1 } = useVersion();
  // V1.0 仅开放：账户信息、通知设置、隐私与安全、帮助与反馈（邀请 V1.1、家庭成员 V1.2 等回退到账户信息）
  const v1Sections = ['account', 'notification', 'privacy', 'help'];
  const active =
    sidebarItems.some((item) => item.key === section) && (!isV1 || v1Sections.includes(section ?? ''))
      ? (section ?? 'account')
      : 'account';

  const [notifications, setNotifications] = useState(initialNotifications);
  const [twoFactor, setTwoFactor] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFreq, setBackupFreq] = useState('每天');
  const [account, setAccount] = useState({ nickname: '', realName: '', phone: '', email: '', community: '', neighborhood: '', avatar: '' });

  useEffect(() => {
    if (user) {
      setAccount((prev) => ({
        ...prev,
        nickname: user.name || prev.nickname,
        phone: user.phone || prev.phone,
        community: user.community || '',
        neighborhood: user.neighborhood || '',
      }));
    }
  }, [user]);
  const [members, setMembers] = useState(familyMembers);
  const [showVisibility, setShowVisibility] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [managingMember, setManagingMember] = useState<typeof familyMembers[0] | null>(null);
  const [helpArticle, setHelpArticle] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Record<string, string>>({ 基本信息: '家人可见', 多媒体档案: '家人可见', 人生事件: '部分公开', 成就与作品: '公开展示' });
  const [quota, setQuota] = useState<AIQuota>(defaultQuota);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('premium');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    quotaApi.get().then(setQuota).catch(() => setQuota(defaultQuota));
  }, []);

  // V1.0 下访问未开放的设置分区时，地址栏同步回到账户信息
  useEffect(() => {
    if (isV1 && section && !v1Sections.includes(section)) {
      navigate('/settings/account', { replace: true });
    }
  }, [isV1, section, navigate]);

  const [rewardsRefresh, setRewardsRefresh] = useState(0);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountEdit, setAccountEdit] = useState<{ key: 'realName' | 'phone' | 'email' | 'nickname' | 'community'; label: string; value: string } | null>(null);
  const [addrCascade, setAddrCascade] = useState({ province: '', city: '', district: '' });

  const toggleNotification = (i: number) => {
    setNotifications((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], checked: !next[i].checked };
      addToast(`${next[i].label} 已${next[i].checked ? '开启' : '关闭'}`, 'success');
      return next;
    });
  };

  // 立即备份：导出 localStorage 中 cj_ 前缀（含 cj_mock_）的全部数据为 JSON 文件
  const handleBackup = () => {
    try {
      const data: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith('cj_')) continue;
        const raw = localStorage.getItem(key);
        try {
          data[key] = raw ? JSON.parse(raw) : null;
        } catch {
          data[key] = raw;
        }
      }
      const payload = { app: 'chuanjiashi', exportedAt: new Date().toISOString(), data };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `传家世数据备份_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      addToast(`备份完成，已导出 ${Object.keys(data).length} 项数据`, 'success');
    } catch {
      addToast('备份失败，请重试', 'error');
    }
  };

  // 升级套餐：mock 支付成功后更新额度（同时写回 mock 额度存储，刷新后仍生效）
  const handleUpgrade = () => {
    const plan = upgradePlans.find((p) => p.key === selectedPlan);
    if (!plan || paying) return;
    setPaying(true);
    setTimeout(() => {
      const next: AIQuota = {
        ...quota,
        plan: plan.name,
        interviewQuestion: { ...quota.interviewQuestion, total: plan.quota.interviewQuestion },
        followUp: { ...quota.followUp, total: plan.quota.followUp },
        biographyGenerate: { ...quota.biographyGenerate, total: plan.quota.biographyGenerate },
        digitalDialog: { ...quota.digitalDialog, total: plan.quota.digitalDialog },
        storage: { ...quota.storage, totalMB: plan.quota.storageMB },
      };
      setQuota(next);
      try {
        const rawUser = localStorage.getItem('cj_mock_current_user');
        const userId = rawUser ? (JSON.parse(rawUser) as { id?: string }).id : null;
        if (userId) {
          const rawMap = localStorage.getItem('cj_mock_ai_quota');
          const map = rawMap ? (JSON.parse(rawMap) as Record<string, AIQuota>) : {};
          map[userId] = next;
          localStorage.setItem('cj_mock_ai_quota', JSON.stringify(map));
        }
      } catch {
        // 写入失败时仅更新当前展示
      }
      setPaying(false);
      setShowUpgrade(false);
      addToast(`支付成功，已升级为「${plan.name}」，额度已生效`, 'success');
    }, 900);
  };

  return (
    <div className="settings-page">
      <div className="settings-content">
          {active === 'account' && (
            <Annotate id="settings.account">
            <div className="card settings-card">
              <div className="card-header"><h3 className="card-title">账号与安全</h3></div>
              <div className="card-body settings-account-list">
                <div className="settings-account-row">
                  <div className="settings-account-icon"><User size={18} /></div>
                  <div className="settings-account-main">
                    <div className="settings-account-title">头像与昵称</div>
                    <div className="settings-account-desc">{account.nickname || '未设置昵称'}</div>
                  </div>
                  <div className="settings-account-side settings-account-avatar-side">
                    <Avatar name={account.nickname} size={36} src={account.avatar || undefined} />
                    <button className="settings-account-action" onClick={() => setAccountEdit({ key: 'nickname', label: '昵称', value: account.nickname })}>
                      修改昵称
                    </button>
                    <label className="settings-account-action">
                      更换头像
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            setAccount((a) => ({ ...a, avatar: reader.result as string }));
                            addToast('头像已选择，保存后生效', 'success');
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="settings-account-row">
                  <div className="settings-account-icon"><Shield size={18} /></div>
                  <div className="settings-account-main">
                    <div className="settings-account-title">实名认证</div>
                    <div className="settings-account-desc">{account.realName ? `${account.realName} · 已完成实名认证` : '实名认证后作为账号姓名展示'}</div>
                  </div>
                  <button className="settings-account-action" onClick={() => setAccountEdit({ key: 'realName', label: '真实姓名', value: account.realName })}>
                    {account.realName ? '已认证' : '去认证'} <ChevronRight size={14} />
                  </button>
                </div>

                <div className="settings-account-row">
                  <div className="settings-account-icon"><MessageCircle size={18} /></div>
                  <div className="settings-account-main">
                    <div className="settings-account-title">绑定微信</div>
                    <div className="settings-account-desc">已绑定，可使用微信快捷登录</div>
                  </div>
                  <span className="settings-account-status">已绑定</span>
                </div>

                <div className="settings-account-row">
                  <div className="settings-account-icon"><Phone size={18} /></div>
                  <div className="settings-account-main">
                    <div className="settings-account-title">绑定手机号</div>
                    <div className="settings-account-desc">当前手机号 {account.phone || '未绑定'}</div>
                  </div>
                  <button className="settings-account-action" onClick={() => setAccountEdit({ key: 'phone', label: '手机号码', value: account.phone })}>
                    更换 <ChevronRight size={14} />
                  </button>
                </div>

                <div className="settings-account-row">
                  <div className="settings-account-icon"><Mail size={18} /></div>
                  <div className="settings-account-main">
                    <div className="settings-account-title">电子邮箱</div>
                    <div className="settings-account-desc">{account.email || '未绑定邮箱'}</div>
                  </div>
                  <button className="settings-account-action" onClick={() => setAccountEdit({ key: 'email', label: '电子邮箱', value: account.email })}>
                    {account.email ? '更换' : '绑定'} <ChevronRight size={14} />
                  </button>
                </div>

                <div className="settings-account-row">
                  <div className="settings-account-icon"><MapPin size={18} /></div>
                  <div className="settings-account-main">
                    <div className="settings-account-title">所在社区 / 小区</div>
                    <div className="settings-account-desc">
                      {account.community || account.neighborhood
                        ? `${account.community || '未填写社区'} · ${account.neighborhood || '未填写小区'}`
                        : '填写所在社区与小区，便于社区服务'}
                    </div>
                  </div>
                  <button className="settings-account-action" onClick={() => { setAddrCascade({ province: '', city: '', district: '' }); setAccountEdit({ key: 'community', label: '所在社区 / 小区', value: '' }); }}>
                    修改 <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {accountEdit && (
              <div className="modal-overlay" onClick={() => setAccountEdit(null)}>
                <div className="modal-content settings-account-edit-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h4>{accountEdit.label}</h4>
                    <button className="modal-close" onClick={() => setAccountEdit(null)}><X size={16} /></button>
                  </div>
                  <div className="modal-body">
                    {accountEdit.key === 'community' ? (
                      <>
                        <div className="form-row">
                          <label>所在地区</label>
                          <div className="settings-account-cascade">
                            <select
                              value={addrCascade.province}
                              onChange={(e) => setAddrCascade({ province: e.target.value, city: '', district: '' })}
                            >
                              <option value="">请选择省份</option>
                              {regions.map((p) => (
                                <option value={p.name} key={p.name}>{p.name}</option>
                              ))}
                            </select>
                            <select
                              value={addrCascade.city}
                              onChange={(e) => setAddrCascade((prev) => ({ ...prev, city: e.target.value, district: '' }))}
                              disabled={!addrCascade.province}
                            >
                              <option value="">{addrCascade.province ? '请选择城市' : '请先选择省份'}</option>
                              {(regions.find((p) => p.name === addrCascade.province)?.cities || []).map((c) => (
                                <option value={c.name} key={c.name}>{c.name}</option>
                              ))}
                            </select>
                            <select
                              value={addrCascade.district}
                              onChange={(e) => setAddrCascade((prev) => ({ ...prev, district: e.target.value }))}
                              disabled={!addrCascade.city}
                            >
                              <option value="">{addrCascade.city ? '请选择区/县' : '请先选择城市'}</option>
                              {(regions.find((p) => p.name === addrCascade.province)?.cities.find((c) => c.name === addrCascade.city)?.districts || []).map((d) => (
                                <option value={d} key={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="form-row">
                          <label>所在小区</label>
                          <input
                            type="text"
                            value={account.neighborhood}
                            placeholder="例如：未来科技城社区"
                            onChange={(e) => setAccount((a) => ({ ...a, neighborhood: e.target.value }))}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="form-row">
                        <label>{accountEdit.label}</label>
                        <input
                          type="text"
                          value={accountEdit.value}
                          autoFocus
                          onChange={(e) => setAccountEdit((prev) => prev && { ...prev, value: e.target.value })}
                        />
                      </div>
                    )}
                    <div className="settings-account-edit-actions">
                      <button className="btn btn-outline" onClick={() => setAccountEdit(null)}>取消</button>
                      <button
                        className="btn btn-primary"
                        disabled={savingAccount}
                        onClick={async () => {
                          try {
                            setSavingAccount(true);
                            const next = { ...account };
                            if (accountEdit.key === 'realName') next.realName = accountEdit.value;
                            if (accountEdit.key === 'phone') next.phone = accountEdit.value;
                            if (accountEdit.key === 'email') next.email = accountEdit.value;
                            if (accountEdit.key === 'nickname') next.nickname = accountEdit.value;
                            if (accountEdit.key === 'community') {
                              if (!addrCascade.province || !addrCascade.city || !addrCascade.district) {
                                addToast('请选择完整的省 / 市 / 区', 'error');
                                setSavingAccount(false);
                                return;
                              }
                              next.community = `${addrCascade.province} ${addrCascade.city} ${addrCascade.district}`;
                            }
                            setAccount(next);
                            // 账号姓名优先级：实名姓名 > 昵称 > 默认数字名
                            updateUser({
                              name: next.realName.trim() || next.nickname,
                              community: next.community,
                              neighborhood: next.neighborhood,
                            });
                            addToast('账户信息已保存', 'success');
                            setAccountEdit(null);
                          } catch (err: any) {
                            addToast(err.message || '保存失败', 'error');
                          } finally {
                            setSavingAccount(false);
                          }
                        }}
                      >
                        {savingAccount ? '保存中…' : '保存'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </Annotate>
          )}

          {active === 'notification' && (
            <Annotate id="settings.notification">
            <div className="card settings-card">
              <div className="card-header"><h3 className="card-title">通知设置</h3></div>
              <div className="card-body settings-body">
                {notifications.map((n, i) => (
                  <div className="setting-row" key={i}>
                    <span>{n.label}</span>
                    <div className={`toggle-switch ${n.checked ? 'on' : ''}`} onClick={() => toggleNotification(i)}></div>
                  </div>
                ))}
              </div>
            </div>
            </Annotate>
          )}

          {active === 'privacy' && (
            <Annotate id="settings.privacy">
            <div className="card settings-card">
              <div className="card-header"><h3 className="card-title">隐私与安全</h3></div>
              <div className="card-body settings-body">
                <div className="setting-row"><span>登录方式</span><span style={{ color: '#6b7280', fontSize: 13 }}>短信验证码登录</span></div>
                <div className="setting-row"><span>两步验证</span><div className={`toggle-switch ${twoFactor ? 'on' : ''}`} onClick={() => { setTwoFactor((v) => !v); addToast(`两步验证已${!twoFactor ? '开启' : '关闭'}`, 'success'); }}></div></div>
                <div className="setting-row"><span>家庭成员可见范围</span><button className="btn btn-outline" onClick={() => setShowVisibility(true)}>管理</button></div>
                <div className="danger-zone">
                  <div className="danger-title"><Trash2 size={16} /> 注销账户</div>
                  <p>注销后，您的所有个人数据将被清除，且不可恢复。</p>
                  <button className="btn btn-danger" onClick={() => setShowDelete(true)}>申请注销</button>
                </div>
              </div>
            </div>
            </Annotate>
          )}

          {active === 'family' && (
            <Annotate id="settings.family">
            <div className="card settings-card">
              <div className="card-header"><h3 className="card-title">家庭成员</h3><button className="btn btn-primary" onClick={() => { const name = window.prompt('请输入成员姓名'); if (name) setMembers((prev) => [...prev, { name, role: '成员', phone: '-', email: '-' }]); }}>添加成员</button></div>
              <div className="card-body settings-body">
                {members.map((m, i) => (
                  <div className="family-member-row" key={i} onClick={() => navigate(`/family/members/${encodeURIComponent(m.name)}`)}>
                    <Avatar name={m.name} size={40} />
                    <div className="member-main">
                      <div className="member-name">{m.name}<span className="member-role">{m.role}</span></div>
                      <div className="member-contact">{m.phone} · {m.email}</div>
                    </div>
                    <button className="btn btn-outline" onClick={(e) => { e.stopPropagation(); setManagingMember(m); }}>管理</button>
                  </div>
                ))}
              </div>
            </div>
            </Annotate>
          )}

          {active === 'storage' && (
            <Annotate id="settings.storage">
            <div className="card settings-card">
              <div className="card-header"><h3 className="card-title">存储与备份</h3></div>
              <div className="card-body settings-body">
                <div className="storage-bar">
                  <div className="storage-used" style={{ width: '62%' }}></div>
                </div>
                <div className="storage-info">已使用 6.2 GB / 10 GB</div>
                <div className="setting-row"><span>自动备份</span><div className={`toggle-switch ${autoBackup ? 'on' : ''}`} onClick={() => { setAutoBackup((v) => !v); addToast(`自动备份已${!autoBackup ? '开启' : '关闭'}`, 'success'); }}></div></div>
                <div className="setting-row"><span>备份频率</span><select value={backupFreq} onChange={(e) => { setBackupFreq(e.target.value); addToast(`备份频率：${e.target.value}`, 'info'); }}><option>每天</option><option>每周</option></select></div>
                <button className="btn btn-outline" onClick={handleBackup}>立即备份</button>
              </div>
            </div>
            </Annotate>
          )}

          {active === 'invite' && user && (
            <Annotate id="settings.invite">
              <MyInvite user={user} refresh={rewardsRefresh} onWithdraw={() => setRewardsRefresh((v) => v + 1)} />
            </Annotate>
          )}

          {active === 'quota' && (
            <Annotate id="settings.quota">
            <div className="card settings-card">
              <div className="card-header"><h3 className="card-title"><Sparkles size={16} /> AI 额度</h3></div>
              <div className="card-body settings-body">
                <div className="setting-row">
                  <span>当前套餐</span>
                  <strong>{quota.plan}</strong>
                </div>
                {[
                  { key: 'interviewQuestion', label: 'AI采访问题', icon: Mic },
                  { key: 'followUp', label: 'AI延伸问题', icon: Sparkles },
                  { key: 'biographyGenerate', label: '传记生成', icon: BookOpen },
                  { key: 'digitalDialog', label: '数字人对话', icon: UserCircle2 },
                ].map((item) => {
                  const q = quota[item.key as keyof AIQuota] as { used: number; total: number };
                  const pct = Math.round((q.used / q.total) * 100);
                  return (
                    <div className="setting-row" key={item.key}>
                      <span><item.icon size={14} /> {item.label}</span>
                      <div className="quota-line" style={{ minWidth: 160, gap: 12 }}>
                        <div className="usage-bar">
                          <div className="usage-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span>{q.used} / {q.total}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="setting-row">
                  <span><FolderOpen size={14} /> 素材存储</span>
                  <div className="quota-line" style={{ minWidth: 160, gap: 12 }}>
                    <div className="usage-bar">
                      <div className="usage-fill storage" style={{ width: `${Math.round((quota.storage.usedMB / quota.storage.totalMB) * 100)}%` }} />
                    </div>
                    <span>{quota.storage.usedMB}MB / {quota.storage.totalMB}MB</span>
                  </div>
                </div>
                {(quota.interviewQuestion.used >= quota.interviewQuestion.total || quota.followUp.used >= quota.followUp.total || quota.biographyGenerate.used >= quota.biographyGenerate.total || quota.digitalDialog.used >= quota.digitalDialog.total) && (
                  <div className="quota-alert">
                    <AlertCircle size={14} /> 部分额度已用完，可点击下方按钮升级套餐。
                  </div>
                )}
                <button className="btn btn-primary save-btn" onClick={() => setShowUpgrade(true)}>升级套餐</button>
              </div>
            </div>
            </Annotate>
          )}

          {active === 'help' && (
            <Annotate id="settings.help">
            <div className="card settings-card">
              <div className="card-header"><h3 className="card-title">帮助与反馈</h3></div>
              <div className="card-body settings-body">
                {helpArticles.map((h, i) => (
                  <div className="help-item" key={i} onClick={() => setHelpArticle(h.label)}>
                    <CheckCircle size={16} color="#1B5E4B" /> {h.label}
                  </div>
                ))}
                <button className="btn btn-outline" style={{ marginTop: 16, width: '100%' }} onClick={openGuide}>
                  <HelpCircle size={16} /> 重新观看新手指引
                </button>
                <div className="about-box">
                  <div>传家世 v1.0.0</div>
                  <div className="about-meta">© 2026 传家世科技</div>
                </div>
              </div>
            </div>
            </Annotate>
          )}
        </div>

      {showVisibility && (
        <div className="modal-overlay" onClick={() => setShowVisibility(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>管理可见范围</h4><button className="modal-close" onClick={() => setShowVisibility(false)}><X size={16} /></button></div>
            <div className="modal-body">
              {Object.entries(visibility).map(([label, value]) => (
                <div className="visibility-row" key={label}>
                  <span>{label}</span>
                  <select value={value} onChange={(e) => setVisibility((prev) => ({ ...prev, [label]: e.target.value }))}>
                    <option>仅自己</option>
                    <option>家人可见</option>
                    <option>部分公开</option>
                    <option>公开展示</option>
                  </select>
                </div>
              ))}
              <button className="btn btn-primary" style={{ marginTop: 12, width: '100%' }} onClick={() => { setShowVisibility(false); addToast('可见范围已保存', 'success'); }}>保存</button>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>注销账户</h4><button className="modal-close" onClick={() => setShowDelete(false)}><X size={16} /></button></div>
            <div className="modal-body">
              <p style={{ color: '#6b7280', fontSize: 13 }}>注销后数据不可恢复。请输入「确认注销」以继续。</p>
              <input type="text" className="modal-input" placeholder="确认注销" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
              <button className="btn btn-danger" style={{ width: '100%' }} disabled={deleteConfirm !== '确认注销'} onClick={() => { setShowDelete(false); addToast('账户注销申请已提交', 'error'); }}>确认注销</button>
            </div>
          </div>
        </div>
      )}

      {managingMember && (
        <div className="modal-overlay" onClick={() => setManagingMember(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>管理成员：{managingMember.name}</h4><button className="modal-close" onClick={() => setManagingMember(null)}><X size={16} /></button></div>
            <div className="modal-body">
              <div className="form-row"><label>角色</label><input type="text" value={managingMember.role} onChange={(e) => setMembers((prev) => prev.map((m) => m.name === managingMember.name ? { ...m, role: e.target.value } : m))} /></div>
              <div className="form-row"><label>手机</label><input type="text" value={managingMember.phone} onChange={(e) => setMembers((prev) => prev.map((m) => m.name === managingMember.name ? { ...m, phone: e.target.value } : m))} /></div>
              <div className="form-row"><label>邮箱</label><input type="text" value={managingMember.email} onChange={(e) => setMembers((prev) => prev.map((m) => m.name === managingMember.name ? { ...m, email: e.target.value } : m))} /></div>
              <button className="btn btn-primary" style={{ marginTop: 12, width: '100%' }} onClick={() => { setManagingMember(null); addToast('成员信息已保存', 'success'); }}>保存</button>
            </div>
          </div>
        </div>
      )}

      {helpArticle && (
        <div className="modal-overlay" onClick={() => setHelpArticle(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>{helpArticle}</h4><button className="modal-close" onClick={() => setHelpArticle(null)}><X size={16} /></button></div>
            <div className="modal-body">
              {(helpArticles.find((a) => a.label === helpArticle)?.paragraphs ?? []).map((p, i) => (
                <p key={i} style={{ color: '#4b5563', fontSize: 13, lineHeight: 1.8, margin: '0 0 12px' }}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {showUpgrade && (
        <div className="modal-overlay" onClick={() => !paying && setShowUpgrade(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>升级套餐</h4><button className="modal-close" onClick={() => !paying && setShowUpgrade(false)}><X size={16} /></button></div>
            <div className="modal-body">
              <div className="plan-list">
                {upgradePlans.map((p) => (
                  <div
                    key={p.key}
                    className={`plan-card ${selectedPlan === p.key ? 'active' : ''}`}
                    onClick={() => setSelectedPlan(p.key)}
                  >
                    <div className="plan-card-header">
                      <strong>{p.name}</strong>
                      <span className="plan-card-price">¥{p.price}<em>/年</em></span>
                    </div>
                    <ul className="plan-card-features">
                      {p.features.map((f) => <li key={f}>{f}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" style={{ marginTop: 12, width: '100%' }} disabled={paying} onClick={handleUpgrade}>
                {paying ? '支付中…' : `确认升级并支付 ¥${upgradePlans.find((p) => p.key === selectedPlan)?.price ?? 0}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function mapCommissionToUserReward(r: MockCommissionRecord): UserReward {
  return {
    id: r.id,
    userId: r.userId,
    fromUserId: r.fromUserId || '',
    orderId: r.orderId,
    amount: r.amount,
    reward: r.commission,
    status: r.status as UserReward['status'],
    type: 'invite_reward',
    createdAt: r.createdAt,
    settledAt: r.settledAt,
  };
}

function mapWithdrawalToUserWithdrawal(w: MockWithdrawalRecord): UserWithdrawal {
  return {
    id: w.id,
    userId: w.userId,
    userName: w.partnerName || w.userId,
    amount: w.amount,
    status: w.status as UserWithdrawal['status'],
    createdAt: w.appliedAt,
    processedAt: w.paidAt,
  };
}

function MyInvite({ user, refresh, onWithdraw }: { user: { phone: string; name?: string; inviteCode?: string } | null; refresh: number; onWithdraw: () => void }) {
  const { addToast } = useToast();
  const [amount, setAmount] = useState('');
  const [summary, setSummary] = useState({ total: 0, settled: 0, pending: 0, frozen: 0, inviteCount: 0 });
  const [rewards, setRewards] = useState<UserReward[]>([]);
  const [withdrawals, setWithdrawals] = useState<UserWithdrawal[]>([]);
  const [showRules, setShowRules] = useState(false);

  const directInviteRules = [
    '仅一级邀请关系有效：您直接邀请的好友产生的消费计入佣金，好友再邀请的人不计入您的收益。',
    '佣金比例按品类不同：传记服务类订单与商城实物类订单适用不同比例，以结算页面展示为准。',
    '佣金冻结期为 7 天：订单完成且无退款后，佣金由「冻结中」转为「可提现」。',
    '违规推广将冻结佣金：包括但不限于刷单、虚假交易、诱导退款等行为，一经发现冻结全部佣金并取消推广资格。',
    '被邀请人需通过您的邀请链接或邀请码完成注册，方可建立有效邀请关系。',
  ];

  useEffect(() => {
    if (!user) return;
    commissionApi.summary().then(setSummary).catch(() => {});
    commissionApi
      .list()
      .then((list) => setRewards(list.map(mapCommissionToUserReward)))
      .catch(() => setRewards([]));
    commissionApi
      .withdrawals()
      .then((list) => setWithdrawals(list.map(mapWithdrawalToUserWithdrawal)))
      .catch(() => setWithdrawals([]));
  }, [user, refresh]);

  const stats = useMemo(() => {
    const withdrawn = withdrawals.filter((w) => w.status === 'paid').reduce((s, w) => s + w.amount, 0);
    return {
      total: summary.total,
      balance: summary.settled,
      withdrawn,
      inviteCount: summary.inviteCount,
    };
  }, [summary, withdrawals]);

  if (!user) return null;

  const inviteUrl = `${window.location.origin}${window.location.pathname}#/login?invite=${user.inviteCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(user.inviteCode || '');
    addToast('邀请码已复制', 'success');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    addToast('邀请链接已复制', 'success');
  };

  const handleWithdraw = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      addToast('请输入正确的提现金额', 'error');
      return;
    }
    try {
      await commissionApi.withdraw(value);
      addToast('提现申请已提交', 'success');
      setAmount('');
      onWithdraw();
    } catch (err: any) {
      addToast(err.message || '提现申请失败，余额不足', 'error');
    }
  };

  return (
    <div className="card settings-card">
      <div className="card-header"><h3 className="card-title"><Share2 size={16} /> 我的邀请</h3></div>
      <div className="card-body settings-body">
        <div className="invite-stats">
          <div className="invite-stat"><Wallet size={18} color="#1B5E4B" /><div><div className="invite-stat-value">¥{stats.balance.toFixed(2)}</div><div className="invite-stat-label">可提现</div></div></div>
          <div className="invite-stat"><TrendingUp size={18} color="#2563eb" /><div><div className="invite-stat-value">¥{stats.total.toFixed(2)}</div><div className="invite-stat-label">累计收益</div></div></div>
          <div className="invite-stat"><Users size={18} color="#7c3aed" /><div><div className="invite-stat-value">{stats.inviteCount}</div><div className="invite-stat-label">已邀请</div></div></div>
        </div>

        <div className="invite-code-row">
          <div>
            <div className="invite-code-label">我的邀请码</div>
            <div className="invite-code-value">{user.inviteCode}</div>
          </div>
          <div className="invite-code-actions">
            <button className="btn btn-outline" onClick={copyCode}><Share2 size={14} /> 复制邀请码</button>
            <button className="btn btn-outline" onClick={copyLink}><Share2 size={14} /> 复制链接</button>
          </div>
        </div>

        <div className="invite-rules">
          <button className="invite-rules-toggle" onClick={() => setShowRules((v) => !v)}>
            <Info size={14} /> 一级直推规则说明
            {showRules ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showRules && (
            <ul className="invite-rules-list">
              {directInviteRules.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="invite-withdraw">
          <label>申请提现</label>
          <div className="invite-withdraw-input">
            <input type="number" placeholder="输入提现金额" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button className="btn btn-primary" onClick={handleWithdraw}>提现</button>
          </div>
        </div>

        <div className="invite-records">
          <h4>收益记录</h4>
          {rewards.length === 0 ? (
            <div className="invite-empty">暂无收益记录</div>
          ) : (
            rewards.map((r: UserReward) => (
              <div className="invite-record" key={r.id}>
                <span>来自 {r.fromUserId}</span>
                <span className="invite-record-amount">+¥{r.reward.toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

        <div className="invite-records">
          <h4>提现记录</h4>
          {withdrawals.length === 0 ? (
            <div className="invite-empty">暂无提现记录</div>
          ) : (
            withdrawals.map((w: UserWithdrawal) => (
              <div className="invite-record" key={w.id}>
                <span>¥{w.amount.toFixed(2)}</span>
                <span className={`invite-record-status ${w.status}`}>{w.status === 'pending' ? '审核中' : w.status === 'paid' ? '已打款' : w.status === 'approved' ? '已通过' : '已拒绝'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
