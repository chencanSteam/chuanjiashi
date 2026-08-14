import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { loadTimelineEvents } from '../utils/eventSync';
import {
  buildDraftOutline,
  loadOutline,
  saveOutline,
  type BiographyOutline,
} from '../utils/biographyOutline';
import { loadJson } from '../data/aiMock';
import Annotate from '../components/annotation/Annotate';
import './BiographyOutline.css';

interface Archive {
  id: string;
  name: string;
}

function loadCurrentArchive(): Archive | null {
  try {
    const currentId = localStorage.getItem('cj_current_archive_id');
    if (!currentId) return null;
    const archives: Archive[] = loadJson('cj_archives', []);
    return archives.find((a) => a.id === currentId) || null;
  } catch {
    return null;
  }
}

export default function BiographyOutline() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const archive = useMemo(() => loadCurrentArchive(), []);
  const archiveId = archive?.id || 'default';
  const archiveName = archive?.name || '张明远';

  const timelineEvents = useMemo(() => loadTimelineEvents(archiveId), [archiveId]);

  const [outline, setOutline] = useState<BiographyOutline>(() => {
    const saved = loadOutline(archiveId);
    return saved || buildDraftOutline(archiveId);
  });

  /** 确认后又发生修改，则为 true（需重新确认） */
  const [dirty, setDirty] = useState(false);

  const assignedTitles = new Set(outline.chapters.flatMap((c) => c.eventTitles));
  const unassignedEvents = timelineEvents.filter((e) => !assignedTitles.has(e.title));

  const markEdited = (next: BiographyOutline) => {
    setOutline(next);
    setDirty(next.status === 'confirmed');
  };

  const updateChapter = (id: string, patch: Partial<BiographyOutline['chapters'][number]>) => {
    markEdited({
      ...outline,
      chapters: outline.chapters.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const moveChapter = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= outline.chapters.length) return;
    const chapters = [...outline.chapters];
    [chapters[index], chapters[target]] = [chapters[target], chapters[index]];
    markEdited({ ...outline, chapters });
  };

  const removeChapter = (id: string) => {
    markEdited({ ...outline, chapters: outline.chapters.filter((c) => c.id !== id) });
    addToast('章节已删除，关联素材已退回待分配', 'info');
  };

  const addChapter = () => {
    markEdited({
      ...outline,
      chapters: [
        ...outline.chapters.slice(0, -1),
        {
          id: `oc_manual_${Date.now()}`,
          title: '新章节',
          summary: '',
          eventTitles: [],
        },
        outline.chapters[outline.chapters.length - 1],
      ].filter(Boolean) as BiographyOutline['chapters'],
    });
  };

  const assignEvent = (eventTitle: string, chapterId: string) => {
    if (!chapterId) return;
    markEdited({
      ...outline,
      chapters: outline.chapters.map((c) =>
        c.id === chapterId ? { ...c, eventTitles: [...c.eventTitles, eventTitle] } : c
      ),
    });
  };

  const unassignEvent = (chapterId: string, eventTitle: string) => {
    markEdited({
      ...outline,
      chapters: outline.chapters.map((c) =>
        c.id === chapterId
          ? { ...c, eventTitles: c.eventTitles.filter((t) => t !== eventTitle) }
          : c
      ),
    });
  };

  const rebuildDraft = () => {
    if (!window.confirm('AI 将基于当前已确认的时间轴素材重新规划大纲，现有编辑会被覆盖，继续吗？')) return;
    setOutline(buildDraftOutline(archiveId, outline));
    setDirty(true);
    addToast('AI 已重新生成大纲草案，请确认后生效', 'success');
  };

  const confirmOutline = () => {
    if (outline.chapters.some((c) => !c.title.trim())) {
      addToast('存在未命名的章节，请先补全章节名称', 'error');
      return;
    }
    const next: BiographyOutline = {
      ...outline,
      version: outline.version + 1,
      status: 'confirmed',
      updatedAt: new Date().toLocaleString('zh-CN'),
    };
    saveOutline(archiveId, next);
    setOutline(next);
    setDirty(false);
    addToast(`大纲 v${next.version} 已确认，生成传记时将按此结构生成`, 'success');
  };

  return (
    <div className="outline-page">
      <header className="page-header">
        <h1 className="page-title">传记大纲 · {archiveName}</h1>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => navigate('/biography')}>
            <ArrowLeft size={14} /> 返回传记生成
          </button>
          <Annotate id="biography-outline.rebuild" inline>
          <button className="btn btn-outline" onClick={rebuildDraft}>
            <RefreshCw size={14} /> AI 重新规划
          </button>
          </Annotate>
          <Annotate id="biography-outline.confirm" inline>
          <button className="btn btn-primary" onClick={confirmOutline}>
            <CheckCircle2 size={14} /> 确认大纲
          </button>
          </Annotate>
        </div>
      </header>

      <Annotate id="biography-outline.status-bar">
      <div className="outline-status card">
        <div className="outline-status-left">
          {outline.status === 'confirmed' && !dirty ? (
            <span className="outline-badge confirmed"><CheckCircle2 size={13} /> 已确认 · v{outline.version}</span>
          ) : (
            <span className="outline-badge draft"><Circle size={13} /> 草稿{dirty ? '（有未确认的修改）' : ''}{outline.version > 0 ? ` · 当前生效 v${outline.version}` : ''}</span>
          )}
          <span className="outline-meta">更新于 {outline.updatedAt}</span>
        </div>
        <div className="outline-status-right">
          <span>{outline.chapters.length} 个章节</span>
          <span>{timelineEvents.length} 条时间轴素材</span>
          <span className={unassignedEvents.length > 0 ? 'outline-warn' : ''}>
            {unassignedEvents.length} 条待分配
          </span>
        </div>
      </div>
      </Annotate>

      <p className="outline-tip">
        <Sparkles size={14} /> 大纲由 AI 根据已确认的采访素材规划，您可以修改章节名称与主旨、调整顺序、增删章节，并为每章分配素材。<strong>确认后，AI 生成传记将以此结构为准。</strong>
      </p>

      <Annotate id="biography-outline.chapters">
      <div className="outline-chapters">
        {outline.chapters.map((chapter, index) => (
          <div className="card outline-chapter" key={chapter.id}>
            <div className="outline-chapter-head">
              <span className="outline-chapter-no">{String(index + 1).padStart(2, '0')}</span>
              <input
                className="outline-chapter-title"
                value={chapter.title}
                placeholder="章节名称"
                onChange={(e) => updateChapter(chapter.id, { title: e.target.value })}
              />
              <div className="outline-chapter-actions">
                <button className="icon-btn" title="上移" disabled={index === 0} onClick={() => moveChapter(index, -1)}>
                  <ChevronUp size={15} />
                </button>
                <button className="icon-btn" title="下移" disabled={index === outline.chapters.length - 1} onClick={() => moveChapter(index, 1)}>
                  <ChevronDown size={15} />
                </button>
                <button className="icon-btn danger" title="删除章节" onClick={() => removeChapter(chapter.id)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <textarea
              className="outline-chapter-summary"
              value={chapter.summary}
              placeholder="本章主旨（AI 生成正文时作为写作指引）"
              rows={2}
              onChange={(e) => updateChapter(chapter.id, { summary: e.target.value })}
            />
            <div className="outline-chapter-events">
              {chapter.eventTitles.length === 0 && <span className="outline-event-empty">暂无关联素材</span>}
              {chapter.eventTitles.map((title) => (
                <span className="outline-event-chip" key={title}>
                  {title}
                  <button className="chip-x" title="移出本章" onClick={() => unassignEvent(chapter.id, title)}>
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}

        <button className="btn btn-outline outline-add-btn" onClick={addChapter}>
          <Plus size={14} /> 添加章节
        </button>
      </div>
      </Annotate>

      {unassignedEvents.length > 0 && (
        <Annotate id="biography-outline.pool">
        <div className="card outline-pool">
          <div className="card-header">
            <h3 className="card-title">待分配素材（{unassignedEvents.length}）</h3>
          </div>
          <div className="card-body">
            {unassignedEvents.map((e) => (
              <div className="outline-pool-row" key={`${e.year}-${e.title}`}>
                <span className="outline-pool-year">{e.year}</span>
                <span className="outline-pool-title">{e.title}</span>
                <select
                  defaultValue=""
                  onChange={(ev) => {
                    assignEvent(e.title, ev.target.value);
                    ev.target.value = '';
                  }}
                >
                  <option value="" disabled>分配到章节…</option>
                  {outline.chapters.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
        </Annotate>
      )}

      <div className="outline-footer">
        <button className="btn btn-primary" onClick={confirmOutline}>
          <CheckCircle2 size={14} /> 确认大纲
        </button>
        <button
          className="btn btn-outline"
          onClick={() => navigate('/biography')}
        >
          <BookOpen size={14} /> 去生成传记
        </button>
      </div>
    </div>
  );
}
