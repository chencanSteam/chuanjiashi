import { useMemo, useState } from 'react';
import { CheckCircle2, FileText, ImagePlus, Save, Sparkles, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import {
  getWorkflowArchiveId,
  getWorkflowArchiveName,
  loadWorkflowChapters,
  saveWorkflowChapters,
  stripHtml,
} from '../utils/biographyWorkflow';
import type { ChapterData } from '../data/aiMock';
import './BiographyWorkflow.css';

export default function BiographyDraft() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const archiveId = useMemo(() => getWorkflowArchiveId(), []);
  const archiveName = useMemo(() => getWorkflowArchiveName(), []);
  const [chapters, setChapters] = useState<ChapterData[]>(() => loadWorkflowChapters(archiveId));
  const [activeIndex, setActiveIndex] = useState(0);
  const activeChapter = chapters[activeIndex];
  const completedCount = chapters.filter((chapter) => chapter.status !== 'notGenerated' && chapter.content.trim()).length;
  const allCompleted = chapters.length > 0 && completedCount === chapters.length;

  const updateActiveContent = (content: string) => {
    setChapters((prev) => prev.map((chapter, index) => index === activeIndex
      ? { ...chapter, content, status: chapter.status === 'notGenerated' ? 'edited' : chapter.status }
      : chapter));
  };

  const saveDraft = () => {
    saveWorkflowChapters(archiveId, chapters);
    addToast('初稿已保存', 'success');
  };

  const polishCurrent = () => {
    if (!activeChapter?.content.trim()) {
      addToast('当前章节还没有内容', 'info');
      return;
    }
    updateActiveContent(`${activeChapter.content}\n\n【初稿润色】本章内容已完成初步整理，叙事线索和情感细节更加连贯。`);
    addToast(`「${activeChapter.title}」已完成初步润色`, 'success');
  };

  const insertImage = () => {
    if (!activeChapter) return;
    updateActiveContent(`${activeChapter.content}\n\n[图片位置：待插入本章相关照片]`);
    addToast('已插入图片位置', 'success');
  };

  return (
    <div className="workflow-page">
      <header className="page-header workflow-header">
        <div>
          <h1 className="page-title">合成初稿</h1>
          <p className="page-subtitle">《{archiveName}传记》· 将已完成章节整理为一本完整初稿</p>
        </div>
        <div className="workflow-actions">
          <button className="btn btn-outline" onClick={polishCurrent}><Sparkles size={14} /> 润色本稿</button>
          <button className="btn btn-primary" onClick={saveDraft}><Save size={14} /> 保存本稿</button>
          <button className="btn btn-primary" disabled={!allCompleted} onClick={() => { saveDraft(); navigate('/biography/review'); }}><CheckCircle2 size={14} /> 进入审稿精修</button>
        </div>
      </header>

      <section className="workflow-status-bar">
        <div>
          <h2 className="workflow-status-title">章节合成进度</h2>
          <p className="workflow-status-desc">每章可以独立修改和保存，全部章节完成后即可形成完整初稿。</p>
        </div>
        <div className="workflow-status-count">{completedCount} / {chapters.length} 章</div>
      </section>

      <div className="workflow-layout">
        <aside className="workflow-panel">
          <div className="workflow-panel-header">
            <h3>章节目录</h3>
            <span>{chapters.length} 章</span>
          </div>
          <div className="workflow-chapter-list">
            {chapters.map((chapter, index) => {
              const done = chapter.status !== 'notGenerated' && chapter.content.trim();
              return (
                <button className={`workflow-chapter-item ${activeIndex === index ? 'active' : ''}`} key={`${chapter.title}-${index}`} onClick={() => setActiveIndex(index)} type="button">
                  <span className="workflow-chapter-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="workflow-chapter-title">{chapter.title}</span>
                  <span className={`workflow-chapter-state ${done ? 'done' : ''}`}>{done ? '已完成' : '待处理'}</span>
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
                  <span>素材 {activeChapter.materials || 0} 条</span>
                  <span>{activeChapter.updatedAt ? `更新于 ${activeChapter.updatedAt}` : '尚未生成'}</span>
                </div>
                <textarea
                  className="workflow-editor-textarea"
                  value={stripHtml(activeChapter.content)}
                  onChange={(event) => updateActiveContent(event.target.value)}
                  placeholder="本章内容将在章节生成后展示，也可以直接补充文字。"
                />
                {!allCompleted && (
                  <div className="workflow-warning"><TriangleAlert size={15} /> 还有 {chapters.length - completedCount} 个章节未完成，全部完成后才能进入全书审稿。</div>
                )}
              </div>
              <div className="workflow-toolbar" style={{ padding: '0 24px 24px' }}>
                <button className="btn btn-outline" onClick={insertImage}><ImagePlus size={14} /> 插入图片位置</button>
                <button className="btn btn-outline" onClick={saveDraft}><Save size={14} /> 保存本章</button>
                {allCompleted && <span style={{ color: 'var(--primary)', fontSize: 12 }}><CheckCircle2 size={14} /> 全部章节已完成，可进入审稿精修</span>}
              </div>
            </>
          ) : (
            <div className="workflow-empty">暂无章节，请先完成传记提纲。</div>
          )}
        </section>
      </div>
    </div>
  );
}
