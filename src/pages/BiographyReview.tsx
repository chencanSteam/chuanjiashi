import { useEffect, useMemo, useState } from 'react';
import { Check, CheckCircle2, FileText, ImagePlus, PenLine, RefreshCw, Save, Trash2, TriangleAlert, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import Modal from '../components/ui/Modal';
import {
  getWorkflowArchiveId,
  getWorkflowArchiveName,
  loadReviewStates,
  loadWorkflowChapters,
  saveReviewStates,
  saveWorkflowChapters,
  stripHtml,
  type ChapterReviewState,
} from '../utils/biographyWorkflow';
import { loadJson, saveJson, type ChapterData } from '../data/aiMock';
import './BiographyWorkflow.css';

interface ReviewVersion {
  id: string;
  versionNumber: number;
  label: string;
  createdAt: string;
  chapters: ChapterData[];
  /** 与传记生成页共用版本存储，保留文风字段 */
  style?: string;
}

export default function BiographyReview() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const archiveId = useMemo(() => getWorkflowArchiveId(), []);
  const archiveName = useMemo(() => getWorkflowArchiveName(), []);
  const [chapters, setChapters] = useState<ChapterData[]>(() => loadWorkflowChapters(archiveId));
  const [reviewStates, setReviewStates] = useState<Record<string, ChapterReviewState>>(() => loadReviewStates(archiveId));
  const [activeIndex, setActiveIndex] = useState(0);
  const [versions, setVersions] = useState<ReviewVersion[]>(() => loadJson<ReviewVersion[]>(`cj_biography_versions_${archiveId}`, []));
  const [versionLabel, setVersionLabel] = useState('');
  const [saveVersionOpen, setSaveVersionOpen] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

  useEffect(() => {
    saveJson(`cj_biography_versions_${archiveId}`, versions);
  }, [versions, archiveId]);

  const saveVersion = () => {
    const versionNumber = versions.reduce((max, version) => Math.max(max, version.versionNumber), 0) + 1;
    const version: ReviewVersion = {
      id: `bv_${Date.now()}_${versionNumber}`,
      versionNumber,
      label: versionLabel.trim(),
      createdAt: new Date().toISOString(),
      chapters: chapters.map((chapter) => ({ ...chapter })),
      style: loadJson<string>(`cj_biography_style_${archiveId}`, 'warm'),
    };
    setVersions((prev) => [...prev, version]);
    setActiveVersionId(version.id);
    setVersionLabel('');
    setSaveVersionOpen(false);
    addToast(`已保存为 V${versionNumber}${version.label ? ` · ${version.label}` : ''}`, 'success');
  };

  const restoreVersion = (version: ReviewVersion) => {
    const name = `V${version.versionNumber}${version.label ? ` · ${version.label}` : ''}`;
    if (!window.confirm(`切换到“${name}”会覆盖当前未保存的修改，是否继续？`)) return;
    setChapters(version.chapters.map((chapter) => ({ ...chapter })));
    setActiveIndex(0);
    setActiveVersionId(version.id);
    setShowVersions(false);
    addToast(`已切换到 ${name}，可继续校审`, 'success');
  };

  const deleteVersion = (version: ReviewVersion) => {
    if (!window.confirm(`确定删除“V${version.versionNumber}”吗？历史版本删除后无法恢复。`)) return;
    setVersions((prev) => prev.filter((item) => item.id !== version.id));
    if (activeVersionId === version.id) setActiveVersionId(null);
    addToast('历史版本已删除', 'success');
  };
  const activeChapter = chapters[activeIndex];
  const generatedCount = chapters.filter((chapter) => chapter.status !== 'notGenerated' && chapter.content.trim()).length;
  const reviewedCount = chapters.filter((chapter) => reviewStates[chapter.title]?.status === 'reviewed').length;
  const allGenerated = chapters.length > 0 && generatedCount === chapters.length;
  const allReviewed = allGenerated && reviewedCount === chapters.length;

  const updateContent = (content: string) => {
    setChapters((prev) => prev.map((chapter, index) => index === activeIndex
      ? { ...chapter, content, status: 'edited', updatedAt: new Date().toLocaleString('zh-CN') }
      : chapter));
    if (activeChapter) {
      const nextStates = { ...reviewStates, [activeChapter.title]: { status: 'reviewing' as const, updatedAt: new Date().toLocaleString('zh-CN') } };
      setReviewStates(nextStates);
      saveReviewStates(archiveId, nextStates);
    }
  };

  const saveCurrent = () => {
    saveWorkflowChapters(archiveId, chapters);
    saveReviewStates(archiveId, reviewStates);
    addToast('审稿修改已保存', 'success');
  };

  const polishParagraph = () => {
    if (!activeChapter?.content.trim()) return;
    updateContent(`${activeChapter.content}\n\n【AI 校审说明】已完成事实核对提示、语句润色与机械感调整，保留传主本人语言风格。`);
    addToast(`「${activeChapter.title}」已完成校对打磨：纠错、润色、去除机械感，保留本人语言风格`, 'success');
  };

  const markReviewed = () => {
    if (!activeChapter?.content.trim()) {
      addToast('当前章节还没有初稿内容', 'error');
      return;
    }
    const nextStates = {
      ...reviewStates,
      [activeChapter.title]: { status: 'reviewed' as const, updatedAt: new Date().toLocaleString('zh-CN') },
    };
    setReviewStates(nextStates);
    saveReviewStates(archiveId, nextStates);
    addToast(`「${activeChapter.title}」已标记为完成校对`, 'success');
  };

  const confirmFinal = () => {
    saveWorkflowChapters(archiveId, chapters);
    saveReviewStates(archiveId, reviewStates);
    localStorage.setItem(`cj_biography_${archiveId}`, JSON.stringify({
      title: `${archiveName}传记`,
      author: 'AI 整理',
      createdAt: new Date().toLocaleString('zh-CN'),
      completedAt: new Date().toISOString(),
      status: 'final',
      chapters: chapters.map((chapter) => ({ title: chapter.title, content: chapter.content })),
    }));
    addToast('终稿已确认，可在「我的传记」查看终稿与提炼简稿', 'success');
    navigate('/my-works');
  };

  return (
    <div className="workflow-page">
      <header className="page-header workflow-header">
        <div>
          <h1 className="page-title">校审稿</h1>
          <p className="page-subtitle">《{archiveName}传记》· 逐字校对纠错、优化语句、补充细节、去除机械感，打磨至温润、庄重、有温度</p>
        </div>
        <div className="workflow-actions">
          <button className="btn btn-outline" onClick={() => addToast('已生成校审稿补充邀请，可分享给家人朋友共同完善', 'success')}><UserPlus size={14} /> 邀请补充</button>
          <button className="btn btn-outline" onClick={() => setShowVersions(true)}><RefreshCw size={14} /> 历史版本{versions.length ? ` (${versions.length})` : ''}</button>
          <button className="btn btn-outline" onClick={() => setSaveVersionOpen(true)}><Save size={14} /> 保存版本</button>
          <button className="btn btn-outline" onClick={saveCurrent}><Save size={14} /> 保存修改</button>
          <button className="btn btn-primary" disabled={!allReviewed} onClick={confirmFinal}><CheckCircle2 size={14} /> 确认终稿</button>
        </div>
      </header>

      <section className="workflow-status-bar">
        <div>
          <h2 className="workflow-status-title">校审稿进度</h2>
          <p className="workflow-status-desc">AI 已完成全文校对与打磨，请逐章核对事实（人名、时间、地点），全部章节确认后即可生成终稿。</p>
        </div>
        <div className="workflow-status-count">{reviewedCount} / {chapters.length} 章</div>
      </section>

      <div className="workflow-layout">
        <aside className="workflow-panel">
          <div className="workflow-panel-header">
            <h3>章节编辑目录</h3>
            <span>{reviewedCount} 章已确认</span>
          </div>
          <div className="workflow-chapter-list">
            {chapters.map((chapter, index) => {
              const reviewed = reviewStates[chapter.title]?.status === 'reviewed';
              const hasContent = chapter.status !== 'notGenerated' && chapter.content.trim();
              return (
                <button className={`workflow-chapter-item ${activeIndex === index ? 'active' : ''}`} key={`${chapter.title}-${index}`} onClick={() => setActiveIndex(index)} type="button">
                  <span className="workflow-chapter-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="workflow-chapter-title">{chapter.title}</span>
                  <span className={`workflow-chapter-state ${reviewed ? 'reviewed' : hasContent ? 'done' : ''}`}>{reviewed ? '已校对' : hasContent ? '待校对' : '无内容'}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="workflow-panel workflow-editor">
          {activeChapter ? (
            <>
              <div className="workflow-editor-body">
                <h2 className="workflow-editor-title">{activeChapter.title}</h2>
                <div className="workflow-editor-meta">
                  <span><FileText size={13} /> {stripHtml(activeChapter.content).length || 0} 字</span>
                  <span>{reviewStates[activeChapter.title]?.status === 'reviewed' ? '本章已校对' : '本章待校对'}</span>
                </div>
                <textarea
                  className="workflow-editor-textarea"
                  value={stripHtml(activeChapter.content)}
                  onChange={(event) => updateContent(event.target.value)}
                  placeholder="请先合成初稿，再进行校审。"
                />
                {!allGenerated && (
                  <div className="workflow-warning"><TriangleAlert size={15} /> 还有章节未完成初稿，全部章节生成后才能提交终稿。</div>
                )}
              </div>
              <div className="workflow-toolbar" style={{ padding: '0 24px 24px' }}>
                <button className="btn btn-outline" onClick={polishParagraph} disabled={!activeChapter.content.trim()}><PenLine size={14} /> AI 校审本章</button>
                <button className="btn btn-outline" onClick={() => updateContent(`${activeChapter.content}\n\n[图片位置：待插入审稿图片]`)}><ImagePlus size={14} /> 插入图片</button>
                <button className="btn btn-primary" onClick={markReviewed} disabled={!activeChapter.content.trim()}><Check size={14} /> 本章确认完成</button>
              </div>
            </>
          ) : (
            <div className="workflow-empty">暂无章节内容，请先完成章节生成。</div>
          )}
        </section>
      </div>

      <Modal open={saveVersionOpen} title="保存当前版本" onClose={() => setSaveVersionOpen(false)} footer={
        <div className="version-modal-actions">
          <button className="btn btn-outline" onClick={() => setSaveVersionOpen(false)}>取消</button>
          <button className="btn btn-primary" onClick={saveVersion}>保存版本</button>
        </div>
      }>
        <div className="version-save-form">
          <label htmlFor="review-version-label">版本名称（可选）</label>
          <input id="review-version-label" value={versionLabel} onChange={(event) => setVersionLabel(event.target.value)} placeholder="如：完成校审第一轮、补充童年细节（可不填）" autoFocus />
          <p>系统将自动按顺序命名为 V{versions.length + 1}，也可以补充本次版本描述。将保存当前全部 {chapters.length} 个章节。</p>
        </div>
      </Modal>

      <Modal open={showVersions} title="历史版本" onClose={() => setShowVersions(false)}>
        <div className="biography-version-list">
          {versions.length === 0 ? (
            <div className="biography-version-empty"><RefreshCw size={30} /><p>还没有保存过版本</p><span>点击“保存版本”创建第一个可回溯版本。</span></div>
          ) : versions.slice().reverse().map((version) => (
            <div className={`biography-version-item ${activeVersionId === version.id ? 'active' : ''}`} key={version.id}>
              <div className="biography-version-main">
                <div className="biography-version-title"><strong>V{version.versionNumber}</strong>{version.label && <span>{version.label}</span>}{activeVersionId === version.id && <em>当前版本</em>}</div>
                <small>{new Date(version.createdAt).toLocaleString('zh-CN')} · {version.chapters.length} 章</small>
              </div>
              <div className="biography-version-actions">
                <button className="btn btn-outline btn-sm" onClick={() => restoreVersion(version)}>继续编辑</button>
                <button className="icon-btn" title="删除版本" onClick={() => deleteVersion(version)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
