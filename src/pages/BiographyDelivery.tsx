import { useMemo } from 'react';
import { BookOpen, Download, FileText, Film, Headphones, Image, Printer, QrCode, Share2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import {
  getWorkflowArchiveId,
  getWorkflowArchiveName,
  loadReviewStates,
  loadWorkflowChapters,
  stripHtml,
} from '../utils/biographyWorkflow';
import './BiographyWorkflow.css';

export default function BiographyDelivery() {
  const { addToast } = useToast();
  const archiveId = useMemo(() => getWorkflowArchiveId(), []);
  const archiveName = useMemo(() => getWorkflowArchiveName(), []);
  const chapters = useMemo(() => loadWorkflowChapters(archiveId), [archiveId]);
  const reviewStates = useMemo(() => loadReviewStates(archiveId), [archiveId]);
  const reviewedCount = chapters.filter((chapter) => reviewStates[chapter.title]?.status === 'reviewed').length;
  const wordCount = chapters.reduce((sum, chapter) => sum + stripHtml(chapter.content).length, 0);
  const ready = chapters.length > 0 && chapters.every((chapter) => chapter.content.trim() && reviewStates[chapter.title]?.status === 'reviewed');

  const handleAction = (label: string) => {
    addToast(`${label}已生成（当前为演示效果）`, 'success');
  };

  return (
    <div className="workflow-page">
      <header className="page-header workflow-header">
        <div>
          <h1 className="page-title">终稿交付</h1>
          <p className="page-subtitle">《{archiveName}传记》· 预览、导出和制作传世版本</p>
        </div>
        <div className="workflow-actions">
          <span className={`outline-badge ${ready ? 'confirmed' : 'draft'}`}>{ready ? '终稿已确认' : '等待审稿完成'}</span>
        </div>
      </header>

      <section className="workflow-panel">
        <div className="delivery-preview">
          <div className="delivery-cover">
            <small>家传记忆</small>
            <BookOpen size={34} />
            <h2>{archiveName}传记</h2>
            <span>一人一书 · 传家风</span>
          </div>
          <div className="delivery-info">
            <h2>{archiveName}的人生传记</h2>
            <p>全书内容已按章节整理完成，可用于电子阅读、PDF 导出、实体书排版和数字化分享。</p>
            <div className="delivery-stats">
              <div className="delivery-stat"><strong>{chapters.length}</strong><span>章节</span></div>
              <div className="delivery-stat"><strong>{wordCount}</strong><span>字数</span></div>
              <div className="delivery-stat"><strong>{reviewedCount}</strong><span>已校对章节</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="workflow-panel">
        <div className="workflow-panel-header"><h3>交付内容</h3><span>{ready ? '可交付' : '部分内容待完成'}</span></div>
        <div className="delivery-actions">
          <button className="delivery-action" onClick={() => handleAction('PDF 文件')}><Download size={17} /> 导出 PDF</button>
          <button className="delivery-action" onClick={() => handleAction('电子书')}><BookOpen size={17} /> 电子书预览</button>
          <button className="delivery-action" onClick={() => handleAction('打印排版')}><Printer size={17} /> 打印排版</button>
          <button className="delivery-action" onClick={() => handleAction('二维码')}><QrCode size={17} /> 生成二维码</button>
          <button className="delivery-action" onClick={() => handleAction('有声电子书')}><Headphones size={17} /> 有声电子书</button>
          <button className="delivery-action" onClick={() => handleAction('小视频')}><Film size={17} /> 生成小视频</button>
          <button className="delivery-action" onClick={() => handleAction('封面图片')}><Image size={17} /> 导出封面</button>
          <button className="delivery-action" onClick={() => handleAction('分享链接')}><Share2 size={17} /> 分享传记</button>
          <button className="delivery-action" onClick={() => handleAction('目录文件')}><FileText size={17} /> 导出目录</button>
        </div>
      </section>

      <section className="workflow-panel">
        <div className="workflow-panel-header"><h3>终稿目录</h3><span>共 {chapters.length} 章</span></div>
        <div className="workflow-chapter-list">
          {chapters.map((chapter, index) => (
            <div className="workflow-chapter-item" key={`${chapter.title}-${index}`}>
              <span className="workflow-chapter-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="workflow-chapter-title">{chapter.title}</span>
              <span className="workflow-chapter-state reviewed">{reviewStates[chapter.title]?.status === 'reviewed' ? '已校对' : '待校对'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
