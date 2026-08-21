import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, PenLine, ChevronRight, Plus, BookOpen, UserSearch, PlusCircle } from 'lucide-react';
import { loadStoredEventsForArchive } from '../../utils/timelineSample';
import { generateImageDataUrl } from '../../utils/mediaPlaceholder';
import type { ChapterData } from '../../data/aiMock';
import Annotate from '../../components/annotation/Annotate';
import { loadLegacyArchives, resolveCurrentArchiveId, setCurrentArchiveId } from '../../utils/mobileArchives';
import './MobileHome.css';

interface MediaItem {
  id: string;
  title: string;
  date: string;
  type: 'image' | 'video' | 'audio' | 'doc';
  stage?: string;
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const SERVICES = [
  { title: '传记实体书', desc: '精装典藏 · 传世之作', icon: BookOpen, path: '/store' },
  { title: '传记编写', desc: 'AI 生成 · 记录人生故事', icon: PenLine, path: '/biography' },
  { title: '找传记师', desc: '专业服务 · 一对一记录', icon: UserSearch, path: '/biographers' },
];

export default function MobileHome() {
  const navigate = useNavigate();
  const allArchives = useMemo(() => loadLegacyArchives(), []);
  const archiveId = resolveCurrentArchiveId(allArchives);
  const archive = allArchives.find((item) => item.id === archiveId) || null;

  // 档案关联数据（与 Web 端同一组存储 key）
  const events = useMemo(
    () => (archiveId ? loadStoredEventsForArchive(archiveId).slice().sort((a, b) => Number(a.year) - Number(b.year)) : []),
    [archiveId]
  );
  const media = useMemo(() => loadJson<MediaItem[]>(`cj_media_${archiveId}`, []), [archiveId]);
  const photos = useMemo(() => media.filter((m) => m.type === 'image'), [media]);
  const chapters = useMemo(() => loadJson<ChapterData[]>(`cj_biography_chapters_${archiveId}`, []), [archiveId]);
  const generatedChapters = chapters.filter((c) => c.status !== 'notGenerated').length;

  // 切换档案：写入当前档案 id 后重载，让所有按档案 id 读取的模块同步更新
  const handleSwitchArchive = (id: string) => {
    if (!id || id === archiveId) return;
    setCurrentArchiveId(id);
    window.location.reload();
  };

  if (!archive) {
    return (
      <div className="mobile-home">
        <div className="mh-empty">
          <p>还没有人生档案</p>
          <button className="mh-btn-primary" onClick={() => navigate('/onboarding', { state: { from: '/m' } })}>创建人生档案</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-home">
      {/* 档案头部 */}
      <Annotate id="mobile-home.profile-header">
      <header className="mh-profile" onClick={() => navigate('/m/archive')}>
        <div className="mh-avatar">{archive.name.charAt(0)}</div>
        <div className="mh-profile-info">
          <div className="mh-profile-name" onClick={(e) => e.stopPropagation()}>
            <select
              className="mh-archive-select"
              value={archiveId}
              onChange={(e) => handleSwitchArchive(e.target.value)}
              aria-label="选择人生档案"
            >
              {allArchives.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}的人生档案
                </option>
              ))}
            </select>
            <button className="mh-add-archive" type="button" onClick={() => navigate('/onboarding', { state: { from: '/m' } })} title="创建新的人生档案">
              <PlusCircle size={18} />
            </button>
          </div>
        </div>
      </header>
      </Annotate>

      {/* 今日讲述 */}
      <Annotate id="mobile-home.interview-cta">
      <section className="mh-hero">
        <h2 className="mh-hero-title">今天，继续讲讲你的故事</h2>
        <div className="mh-hero-actions">
          <button className="mh-btn-primary" onClick={() => navigate('/m/interview')}>
            <Mic size={16} /> 开始讲述
          </button>
          <button className="mh-btn-outline" onClick={() => navigate('/m/interview')}>
            <PenLine size={16} /> 文字回答
          </button>
        </div>
      </section>
      </Annotate>

      {/* 我的故事 */}
      <Annotate id="mobile-home.story-list">
      <section className="mh-section">
        <div className="mh-story-scroll">
          {events.slice(0, 4).map((e, i) => (
            <div className="mh-story-card" key={`${e.year}-${i}`} onClick={() => navigate('/m/archive')}>
              <img src={generateImageDataUrl(e.title)} alt={e.title} />
              <div className="mh-story-body">
                <div className="mh-story-year">
                  {e.endYear && e.endYear !== e.year ? `${e.year}-${e.endYear}年` : `${e.year}年`}
                </div>
                <div className="mh-story-title">{e.title}</div>
              </div>
            </div>
          ))}
          <div className="mh-story-more" onClick={() => navigate('/m/archive')}>
            <Plus size={22} />
            <span>更多故事</span>
            <em>待记录</em>
          </div>
        </div>
      </section>
      </Annotate>

      {/* 珍贵记忆 / 我的传记 */}
      <Annotate id="mobile-home.memory-biography">
      <div className="mh-duo">
        <section className="mh-mini-card" onClick={() => navigate('/m/archive')}>
          <div className="mh-mini-head">
            <h3>珍贵记忆</h3>
            <span className="mh-link">全部照片 <ChevronRight size={12} /></span>
          </div>
          <div className="mh-photo-stack">
            {(photos.length > 0 ? photos.slice(0, 3) : [{ id: 'ph', title: '珍贵记忆' } as MediaItem]).map((p, i) => (
              <img key={p.id} src={generateImageDataUrl(p.title)} alt={p.title} style={{ transform: `rotate(${(i - 1) * 6}deg)` }} />
            ))}
          </div>
          <p className="mh-mini-desc">{photos.length} 张照片</p>
        </section>
        <section className="mh-mini-card" onClick={() => navigate('/biography')}>
          <div className="mh-mini-head">
            <h3>我的传记</h3>
            <span className="mh-link">查看详情 <ChevronRight size={12} /></span>
          </div>
          <div className="mh-book-cover">
            <span>《{archive.name}传》</span>
          </div>
          <p className="mh-mini-desc">{generatedChapters} 章</p>
        </section>
      </div>
      </Annotate>

      {/* 传承好物 */}
      <Annotate id="mobile-home.goods">
      <section className="mh-section">
        <div className="mh-section-head">
          <h3>传记服务</h3>
        </div>
        <div className="mh-goods-grid">
          {SERVICES.map((service) => (
            <button
              className="mh-goods-card"
              key={service.title}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                navigate(service.path);
              }}
            >
              <div className="mh-goods-cover"><service.icon size={28} /></div>
              <div className="mh-goods-title">{service.title}</div>
              <div className="mh-goods-desc">{service.desc}</div>
            </button>
          ))}
        </div>
      </section>
      </Annotate>
    </div>
  );
}
