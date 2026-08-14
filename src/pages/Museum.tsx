import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Landmark,
  Eye,
  Users,
  Heart,
  Flame,
  Flower2,
  Clock,
  BookOpen,
  Image as ImageIcon,
  Award,
  ScrollText,
  Video,
  MessageCircle,
  Share2,
  QrCode,
  Copy,
  Lock,
  Send,
  UserCircle2,
} from 'lucide-react';
import { museumApi, type MuseumData, type MuseumStats } from '../api/museum';
import { archiveApi } from '../api/archive';
import { biographyApi } from '../api/biography';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import Modal from '../components/ui/Modal';
import Annotate from '../components/annotation/Annotate';
import type { MuseumMessage, Archive } from '../mocks/types';
import './Museum.css';

type TabKey = 'timeline' | 'biography' | 'album' | 'honors' | 'motto' | 'video' | 'companion';

const TABS: { key: TabKey; label: string; icon: typeof Clock }[] = [
  { key: 'timeline', label: '时间轴', icon: Clock },
  { key: 'biography', label: '完整传记', icon: BookOpen },
  { key: 'album', label: '相册', icon: ImageIcon },
  { key: 'honors', label: '荣誉', icon: Award },
  { key: 'motto', label: '家风家训', icon: ScrollText },
  { key: 'video', label: '纪念视频', icon: Video },
  { key: 'companion', label: '数字人对话', icon: MessageCircle },
];

/** 生成与内容相关的占位二维码图案 */
const qrCells = (seed: string) => {
  const cells: boolean[] = [];
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < 21 * 21; i += 1) {
    h = (h * 1103515245 + 12345 + i) >>> 0;
    cells.push((h & 0x10000) !== 0);
  }
  return cells;
};

const formatYear = (date?: string) => (date ? new Date(date).getFullYear() : null);

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

/** 传记衍生内容（家风总结/金句/寄语），来自 biographyApi.derivatives */
interface BiographyDerivatives {
  quotes: string[];
  familyMotto: string;
  messageToDescendants: string;
}

/** 数字资产页纪念视频生成状态（localStorage 标记） */
function isMemorialVideoReady(): boolean {
  try {
    return localStorage.getItem('cj_memorial_video_status') === 'done';
  } catch {
    return false;
  }
}

export default function Museum() {
  const { archiveId: paramId } = useParams<{ archiveId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [fallbackId, setFallbackId] = useState('');
  const archiveId = paramId || fallbackId;
  const [archive, setArchive] = useState<Archive | null>(null);
  const [data, setData] = useState<MuseumData | null>(null);
  const [stats, setStats] = useState<MuseumStats | null>(null);
  const [messages, setMessages] = useState<MuseumMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('timeline');
  const [messageInput, setMessageInput] = useState('');
  const [posting, setPosting] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'private' | 'password' | 'family'>('public');
  const [password, setPassword] = useState('');
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [familyInviteInput, setFamilyInviteInput] = useState('');
  const [familyInvites, setFamilyInvites] = useState<string[]>([]);
  const [derivatives, setDerivatives] = useState<BiographyDerivatives | null>(null);

  // 未带参数时默认取第一个档案馆；本人无档案时展示演示数字博物馆
  useEffect(() => {
    if (paramId) return;
    archiveApi
      .list()
      .then((list) => {
        if (list && list.length > 0) setFallbackId(list[0].id);
        else setFallbackId('demo');
      })
      .catch(() => setLoading(false));
  }, [paramId]);

  const loadData = useCallback(() => {
    if (!archiveId) return;
    Promise.all([
      museumApi.get(archiveId),
      museumApi.stats(archiveId),
      museumApi.messages(archiveId),
      archiveApi.get(archiveId).catch(() => null),
    ])
      .then(([d, s, m, a]) => {
        setData(d);
        setStats(s);
        setMessages(m || []);
        setArchive(a);
        setVisibility(d.museum.visibility);
        setPassword(d.museum.password || '');
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [archiveId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 家风家训 tab：传记已生成时拉取传记衍生内容（家风总结/金句/寄语）
  useEffect(() => {
    if (tab !== 'motto' || !archiveId || !data?.biography) return;
    biographyApi
      .derivatives(archiveId)
      .then((d) => setDerivatives(d as BiographyDerivatives))
      .catch(() => setDerivatives({ quotes: [], familyMotto: '', messageToDescendants: '' }));
  }, [tab, archiveId, data?.biography]);

  const maxDailyViews = useMemo(
    () => Math.max(1, ...(stats?.daily.map((d) => d.views) || [1])),
    [stats]
  );

  const shareLink = data
    ? `${window.location.origin}${window.location.pathname}#/museum/${data.museum.archiveId}`
    : '';

  const handleInteract = async (kind: 'like' | 'candle' | 'flower') => {
    if (!data) return;
    try {
      const apiFn = kind === 'like' ? museumApi.like : kind === 'candle' ? museumApi.candle : museumApi.flower;
      const museum = await apiFn(data.museum.archiveId);
      setData({ ...data, museum });
      setStats((prev) =>
        prev
          ? {
              ...prev,
              likes: museum.likes,
              candles: museum.candles,
              flowers: museum.flowers,
            }
          : prev
      );
      addToast(kind === 'like' ? '点赞成功' : kind === 'candle' ? '已点亮一支蜡烛' : '已献上一束花', 'success');
    } catch (err) {
      addToast(errorMessage(err, '操作失败'), 'error');
    }
  };

  const handlePostMessage = async () => {
    if (!user) {
      addToast('请先登录', 'error');
      return;
    }
    if (!data || !messageInput.trim()) return;
    try {
      setPosting(true);
      const message = await museumApi.postMessage(data.museum.archiveId, messageInput.trim());
      setMessages((prev) => [message, ...prev]);
      setMessageInput('');
      addToast('留言成功', 'success');
    } catch (err) {
      addToast(errorMessage(err, '留言失败'), 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      addToast('分享链接已复制到剪贴板', 'success');
    } catch {
      addToast('复制失败，请手动复制', 'error');
    }
  };

  const handleSaveVisibility = async () => {
    if (!data) return;
    if (visibility === 'password' && !password.trim()) {
      addToast('请设置访问密码', 'error');
      return;
    }
    try {
      setSavingVisibility(true);
      const museum = await museumApi.update(data.museum.archiveId, {
        visibility,
        password: visibility === 'password' ? password.trim() : undefined,
      });
      setData({ ...data, museum });
      addToast('权限设置已保存', 'success');
    } catch (err) {
      addToast(errorMessage(err, '保存失败'), 'error');
    } finally {
      setSavingVisibility(false);
    }
  };

  if (loading) {
    return (
      <div className="museum-page">
        <div className="museum-loading">加载中…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="museum-page">
        <div className="museum-empty">
          <Landmark size={48} color="#d1d5db" />
          <p>数字博物馆不存在或未开通</p>
        </div>
      </div>
    );
  }

  const { museum } = data;
  const birthYear = formatYear(archive?.birthDate);
  const deathYear = formatYear(archive?.deathDate);

  return (
    <div className="museum-page">
      <div className="museum-hero">
        <div className="museum-cover">
          {museum.cover ? <img src={museum.cover} alt={museum.title} /> : <Landmark size={64} />}
        </div>
        <div className="museum-hero-info">
          <h1>{archive?.name || museum.title}</h1>
          {(birthYear || deathYear) && (
            <div className="museum-years">
              {birthYear ?? '？'} — {deathYear ?? '至今'}
            </div>
          )}
          <p className="museum-intro">{archive?.bio || museum.intro}</p>
          <Annotate id="museum.interactions" inline>
          <div className="museum-hero-actions">
            <button className="btn btn-outline" onClick={() => handleInteract('like')}>
              <Heart size={14} /> {museum.likes}
            </button>
            <button className="btn btn-outline" onClick={() => handleInteract('flower')}>
              <Flower2 size={14} /> 献花 {museum.flowers}
            </button>
            <button className="btn btn-outline" onClick={() => handleInteract('candle')}>
              <Flame size={14} /> 点烛 {museum.candles}
            </button>
          </div>
          </Annotate>
        </div>
      </div>

      {stats && (
        <Annotate id="museum.stats">
        <div className="museum-stats">
          <div className="museum-stat-card">
            <div className="museum-stat-num"><Eye size={16} /> {stats.views}</div>
            <div className="museum-stat-label">总访问量</div>
          </div>
          <div className="museum-stat-card">
            <div className="museum-stat-num"><Users size={16} /> {stats.visitors}</div>
            <div className="museum-stat-label">访客人数</div>
          </div>
          <div className="museum-stat-card">
            <div className="museum-stat-num"><Heart size={16} /> {stats.likes}</div>
            <div className="museum-stat-label">获赞</div>
          </div>
          <div className="museum-stat-card museum-stat-trend">
            <div className="museum-stat-label" style={{ marginBottom: 8 }}>近 7 日访问趋势</div>
            <div className="museum-trend-bars">
              {stats.daily.map((d) => (
                <div className="museum-trend-bar" key={d.date} title={`${d.date}：${d.views} 次访问`}>
                  <div
                    className="museum-trend-bar-fill"
                    style={{ height: `${Math.round((d.views / maxDailyViews) * 100)}%` }}
                  />
                  <span>{d.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </Annotate>
      )}

      <Annotate id="museum.tabs" inline>
      <div className="museum-tabs">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`museum-tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>
      </Annotate>

      <div className="museum-tab-content">
        {tab === 'timeline' && (
          data.timeline.length === 0 ? (
            <div className="museum-tab-empty">暂无时间轴事件</div>
          ) : (
            <div className="museum-timeline">
              {data.timeline.map((e) => (
                <div className="museum-timeline-item" key={e.id}>
                  <div className="museum-timeline-year">{e.year}</div>
                  <div className="museum-timeline-body">
                    <h4>{e.title}</h4>
                    <p>{e.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'biography' && (
          !data.biography ? (
            <div className="museum-tab-empty">传记尚未生成</div>
          ) : (
            <div className="museum-biography">
              <h3>{data.biography.title}</h3>
              {data.biography.chapters.map((c) => (
                <div className="museum-chapter" key={c.id}>
                  <h4>{c.title}</h4>
                  <p>{c.content}</p>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'album' && (
          data.images.length === 0 ? (
            <div className="museum-tab-empty">暂无照片</div>
          ) : (
            <div className="museum-album">
              {data.images.map((url, i) => (
                <div className="museum-photo" key={i}>
                  <img src={url} alt={`照片 ${i + 1}`} />
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'honors' && (
          data.honors.length === 0 ? (
            <div className="museum-tab-empty">暂无荣誉资料</div>
          ) : (
            <div className="museum-honors">
              {data.honors.map((h) => (
                <div className="museum-honor-card" key={h.id}>
                  <Award size={24} />
                  <h4>{h.title || '荣誉'}</h4>
                  {h.description && <p>{h.description}</p>}
                  {h.shootTime && <span>{new Date(h.shootTime).toLocaleDateString()}</span>}
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'motto' && (
          !data.biography ? (
            <div className="museum-motto">
              <ScrollText size={32} />
              <p>完成 AI 采访并生成传记后，将自动生成本馆的家风总结与家训。</p>
              <button className="btn btn-primary" onClick={() => navigate('/interview')}>
                去完成 AI 采访
              </button>
            </div>
          ) : !derivatives ? (
            <div className="museum-tab-empty">家风内容加载中…</div>
          ) : (
            <div className="museum-motto">
              <ScrollText size={32} />
              <blockquote>{derivatives?.familyMotto || '忠厚传家久，诗书继世长。'}</blockquote>
              {derivatives && derivatives.quotes.length > 0 && (
                <div className="museum-motto-section">
                  <h4>人生金句</h4>
                  <ul>
                    {derivatives.quotes.map((q, i) => (
                      <li key={i}>「{q}」</li>
                    ))}
                  </ul>
                </div>
              )}
              {derivatives?.messageToDescendants && (
                <div className="museum-motto-section">
                  <h4>写给后人的话</h4>
                  <p>{derivatives.messageToDescendants}</p>
                </div>
              )}
            </div>
          )
        )}

        {tab === 'video' && (
          isMemorialVideoReady() ? (
            <div className="museum-video-placeholder">
              <Video size={40} />
              <h4>纪念视频已生成</h4>
              <p>60 秒纪念短视频已在数字资产页生成完成，可前往查看与下载。</p>
              <button className="btn btn-primary" onClick={() => navigate('/digital-assets')}>
                前往数字资产页
              </button>
            </div>
          ) : (
            <div className="museum-video-placeholder">
              <Video size={40} />
              <h4>纪念视频</h4>
              <p>还没有生成纪念视频。前往数字资产页，精选照片与人生节点即可自动生成 60 秒纪念短片，完成后将在此展示。</p>
              <button className="btn btn-primary" onClick={() => navigate('/digital-assets')}>
                去生成纪念视频
              </button>
            </div>
          )
        )}

        {tab === 'companion' && (
          <div className="museum-companion">
            <UserCircle2 size={40} />
            <h4>与数字人对话</h4>
            <p>基于传记与采访素材训练的数字人格，随时与「他/她」聊聊。</p>
            <button className="btn btn-primary" onClick={() => navigate('/digital-companion')}>
              <MessageCircle size={14} /> 进入对话
            </button>
          </div>
        )}
      </div>

      <Annotate id="museum.messages">
      <div className="museum-section">
        <h3><MessageCircle size={16} /> 思念留言</h3>
        <div className="museum-message-form">
          <textarea
            rows={2}
            placeholder="写下你的思念与祝福…"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
          />
          <button className="btn btn-primary" disabled={posting || !messageInput.trim()} onClick={handlePostMessage}>
            <Send size={14} /> {posting ? '发表中…' : '发表留言'}
          </button>
        </div>
        {messages.length === 0 ? (
          <div className="museum-tab-empty">暂无留言</div>
        ) : (
          <div className="museum-messages">
            {messages.map((m) => (
              <div className="museum-message" key={m.id}>
                <div className="museum-message-avatar">{m.userNickname.slice(0, 1)}</div>
                <div className="museum-message-body">
                  <div className="museum-message-header">
                    <strong>{m.userNickname}</strong>
                    <span>{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  <p>{m.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </Annotate>

      <Annotate id="museum.share">
      <div className="museum-section">
        <h3><Share2 size={16} /> 分享数字馆</h3>
        <div className="museum-share">
          <div className="museum-share-link">{shareLink}</div>
          <div className="museum-share-actions">
            <button className="btn btn-outline" onClick={handleCopy}>
              <Copy size={14} /> 复制链接
            </button>
            <button className="btn btn-outline" onClick={() => setShowQr(true)}>
              <QrCode size={14} /> 二维码
            </button>
          </div>
        </div>
      </div>
      </Annotate>

      <Annotate id="museum.visibility">
      <div className="museum-section">
        <h3><Lock size={16} /> 权限设置</h3>
        <div className="museum-visibility">
          {(['public', 'private', 'password', 'family'] as const).map((v) => (
            <button
              key={v}
              className={`museum-visibility-option ${visibility === v ? 'active' : ''}`}
              onClick={() => setVisibility(v)}
            >
              {v === 'public' ? '公开访问' : v === 'private' ? '私密（仅家人）' : v === 'password' ? '密码访问' : '家人共享'}
            </button>
          ))}
        </div>
        {visibility === 'password' && (
          <div className="form-row museum-password-row">
            <label>访问密码</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="设置访问密码"
            />
          </div>
        )}
        {visibility === 'family' && (
          <div className="museum-family-share">
            <p className="museum-family-tip">
              <Users size={14} /> 仅受邀家人可访问
            </p>
            <div className="museum-family-invite">
              <input
                type="text"
                value={familyInviteInput}
                onChange={(e) => setFamilyInviteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const name = familyInviteInput.trim();
                    if (!name) return;
                    setFamilyInvites((prev) => [...prev, name]);
                    setFamilyInviteInput('');
                    addToast(`已向「${name}」发送家人邀请（演示）`, 'success');
                  }
                }}
                placeholder="输入家人姓名或手机号邀请"
              />
              <button
                className="btn btn-outline"
                onClick={() => {
                  const name = familyInviteInput.trim();
                  if (!name) {
                    addToast('请输入家人姓名或手机号', 'error');
                    return;
                  }
                  setFamilyInvites((prev) => [...prev, name]);
                  setFamilyInviteInput('');
                  addToast(`已向「${name}」发送家人邀请（演示）`, 'success');
                }}
              >
                邀请
              </button>
            </div>
            {familyInvites.length > 0 && (
              <div className="museum-family-invited">
                已邀请：{familyInvites.join('、')}
              </div>
            )}
          </div>
        )}
        <p className="museum-visibility-tip">
          {visibility === 'family'
            ? '家人共享模式下仅受邀家人可访问，受邀家人可共同维护数字馆内容。'
            : '私密模式下仅受邀家人可访问；家人可通过家庭空间共享链接共同维护数字馆内容。'}
        </p>
        <button className="btn btn-primary" disabled={savingVisibility} onClick={handleSaveVisibility}>
          {savingVisibility ? '保存中…' : '保存设置'}
        </button>
      </div>
      </Annotate>

      <Modal open={showQr} title="扫码访问数字馆" onClose={() => setShowQr(false)}>
        <div className="museum-qr">
          <svg viewBox="0 0 21 21" className="museum-qr-svg">
            <rect width="21" height="21" fill="#fff" />
            {qrCells(shareLink).map((filled, i) =>
              filled ? (
                <rect
                  key={i}
                  x={i % 21}
                  y={Math.floor(i / 21)}
                  width="1"
                  height="1"
                  fill="#1f2937"
                />
              ) : null
            )}
          </svg>
          <p>使用微信扫一扫，访问「{archive?.name || museum.title}」的人生数字博物馆</p>
        </div>
      </Modal>
    </div>
  );
}
