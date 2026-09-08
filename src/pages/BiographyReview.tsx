import { useMemo, useState } from 'react';
import { Check, CheckCircle2, FileText, ImagePlus, Save, Sparkles, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
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
import type { ChapterData } from '../data/aiMock';
import './BiographyWorkflow.css';

export default function BiographyReview() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const archiveId = useMemo(() => getWorkflowArchiveId(), []);
  const archiveName = useMemo(() => getWorkflowArchiveName(), []);
  const [chapters, setChapters] = useState<ChapterData[]>(() => loadWorkflowChapters(archiveId));
  const [reviewStates, setReviewStates] = useState<Record<string, ChapterReviewState>>(() => loadReviewStates(archiveId));
  const [activeIndex, setActiveIndex] = useState(0);
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
      setReviewStates((prev) => ({ ...prev, [activeChapter.title]: { status: 'reviewing', updatedAt: new Date().toLocaleString('zh-CN') } }));
    }
  };

  const saveCurrent = () => {
    saveWorkflowChapters(archiveId, chapters);
    saveReviewStates(archiveId, reviewStates);
    addToast('审稿修改已保存', 'success');
  };

  const polishParagraph = () => {
    if (!activeChapter?.content.trim()) return;
    updateContent(`${activeChapter.content}\n\n【审稿精修】已对本章段落进行语句调整，保留原意并增强阅读连贯性。`);
    addToast(`「${activeChapter.title}」已完成段落润色`, 'success');
  };

  const markReviewed = () => {
    if (!activeChapter?.content.trim()) {
      addToast('当前章节还没有初稿内容', 'error');
      return;
    }
    setReviewStates((prev) => ({
      ...prev,
      [activeChapter.title]: { status: 'reviewed', updatedAt: new Date().toLocaleString('zh-CN') },
    }));
    addToast(`「${activeChapter.title}」已标记为完成校对`, 'success');
  };

  return (
    <div className="workflow-page">
      <header className="page-header workflow-header">
        <div>
          <h1 className="page-title">全书编辑</h1>
          <p className="page-subtitle">《{archiveName}传记》· 合成初稿、审稿精修和全书确认</p>
        </div>
        <div className="workflow-actions">
          <button className="btn btn-outline" onClick={saveCurrent}><Save size={14} /> 保存修改</button>
          <button className="btn btn-primary" disabled={!allReviewed} onClick={() => { addToast('全书已确认，已进入我的传记', 'success'); navigate('/my-works'); }}><CheckCircle2 size={14} /> 完成全书</button>
        </div>
      </header>

      <section className="workflow-status-bar">
        <div>
          <h2 className="workflow-status-title">全书编辑进度</h2>
          <p className="workflow-status-desc">初稿合成、章节修改和审稿校对都在这里完成，全部章节确认后即可进入我的传记。</p>
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
                  placeholder="请先完成本章初稿，再进行审稿精修。"
                />
                {!allGenerated && (
                  <div className="workflow-warning"><TriangleAlert size={15} /> 还有章节未完成初稿，全部章节生成后才能提交终稿。</div>
                )}
              </div>
              <div className="workflow-toolbar" style={{ padding: '0 24px 24px' }}>
                <button className="btn btn-outline" onClick={polishParagraph} disabled={!activeChapter.content.trim()}><Sparkles size={14} /> 润色段落</button>
                <button className="btn btn-outline" onClick={() => updateContent(`${activeChapter.content}\n\n[图片位置：待插入审稿图片]`)}><ImagePlus size={14} /> 插入图片</button>
                <button className="btn btn-primary" onClick={markReviewed} disabled={!activeChapter.content.trim()}><Check size={14} /> 本章确认完成</button>
              </div>
            </>
          ) : (
            <div className="workflow-empty">暂无章节内容，请先完成章节生成。</div>
          )}
        </section>
      </div>

      <section className="workflow-panel">
        <div className="workflow-panel-header"><h3>审稿检查项</h3><span>全部章节适用</span></div>
        <div className="workflow-checklist">
          {['人物姓名与时间', '章节内容完整', '段落表达顺畅', '图片位置确认', '家风表达准确', '章节状态已保存'].map((item) => (
            <div className="workflow-check-item" key={item}><CheckCircle2 size={16} /> {item}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
