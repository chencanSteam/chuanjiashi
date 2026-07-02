import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, BookOpen } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import './BiographyPrint.css';

interface Archive {
  id: string;
  name: string;
  gender?: '男' | '女';
  birthYear?: string;
  origin?: string;
  occupation?: string;
}

interface BookChapter {
  title: string;
  content: string;
}

interface SavedBiography {
  title: string;
  author?: string;
  createdAt?: string;
  chapters?: BookChapter[];
}

function loadCurrentArchive(): Archive | null {
  try {
    const currentId = localStorage.getItem('cj_current_archive_id');
    if (!currentId) return null;
    const raw = localStorage.getItem('cj_archives');
    if (!raw) return null;
    const archives: Archive[] = JSON.parse(raw);
    return archives.find((a) => a.id === currentId) || null;
  } catch {
    return null;
  }
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return fallback;
}

function isHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text.trim());
}

function renderChapterContent(content: string) {
  if (isHtml(content)) {
    return <div className="chapter-html" dangerouslySetInnerHTML={{ __html: content }} />;
  }
  return (
    <div className="chapter-text">
      {content.split('\n').map((line, i) =>
        line.trim() ? <p key={i}>{line}</p> : <br key={i} />
      )}
    </div>
  );
}

export default function BiographyPrint() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const bookRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const archive = useMemo(() => loadCurrentArchive(), []);
  const archiveId = archive?.id || 'default';
  const subjectName = archive?.name || '传主';

  const book = useMemo<SavedBiography>(() => {
    const saved = loadJson<SavedBiography | null>(`cj_biography_${archiveId}`, null);
    if (saved?.chapters && saved.chapters.length > 0) return saved;

    const drafts = loadJson<Array<{ title: string; content: string }>>(`cj_biography_chapters_${archiveId}`, []);
    return {
      title: `${subjectName}传记`,
      author: 'AI 整理',
      createdAt: new Date().toLocaleString('zh-CN'),
      chapters: drafts.map((c) => ({ title: c.title, content: c.content })),
    };
  }, [archiveId, subjectName]);

  const chapters = book.chapters || [];
  const hasContent = chapters.some((c) => c.content.trim());

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!bookRef.current) return;
    try {
      setDownloading(true);
      addToast('正在生成 PDF…', 'info');
      const html2pdf = (await import('html2pdf.js')).default;
      html2pdf()
        .set({
          margin: 0,
          filename: `${book.title || '传记'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(bookRef.current)
        .save()
        .then(() => {
          addToast('PDF 下载完成', 'success');
        })
        .catch(() => {
          addToast('PDF 生成失败，请尝试使用打印功能', 'error');
        })
        .finally(() => setDownloading(false));
    } catch {
      addToast('PDF 生成失败，请尝试使用打印功能', 'error');
      setDownloading(false);
    }
  };

  return (
    <div className="biography-print-page">
      <header className="print-toolbar no-print">
        <button className="btn btn-ghost" onClick={() => navigate('/biography')}>
          <ArrowLeft size={16} /> 返回编辑
        </button>
        <div className="print-toolbar-title">
          <BookOpen size={18} /> 实体书排版预览
        </div>
        <div className="print-toolbar-actions">
          <button className="btn btn-outline" onClick={handlePrint}>
            <Printer size={14} /> 打印 / 另存为 PDF
          </button>
          <button className="btn btn-primary" onClick={handleDownloadPdf} disabled={downloading}>
            <Download size={14} /> {downloading ? '生成中…' : '下载 PDF'}
          </button>
        </div>
      </header>

      {!hasContent ? (
        <div className="print-empty no-print">
          <BookOpen size={48} color="#9ca3af" />
          <h3>暂无传记内容</h3>
          <p>请先在「AI 传记生成」页面生成并保存章节内容。</p>
          <button className="btn btn-primary" onClick={() => navigate('/biography')}>
            去生成传记
          </button>
        </div>
      ) : (
        <div className="book-pages" ref={bookRef}>
          {/* 封面 */}
          <section className="book-page book-cover">
            <div className="cover-decoration" />
            <div className="cover-content">
              <div className="cover-label">家传记忆</div>
              <h1 className="cover-title">{book.title}</h1>
              {archive?.origin && <div className="cover-origin">{archive.origin}</div>}
              <div className="cover-line" />
              <div className="cover-meta">
                <div className="cover-author">整理：{book.author || 'AI 整理'}</div>
                {book.createdAt && <div className="cover-date">{book.createdAt}</div>}
              </div>
            </div>
            <div className="cover-footer">
              传家世 · 数字人生与家风传承平台
            </div>
          </section>

          {/* 版权/扉页 */}
          <section className="book-page book-copyright">
            <div className="copyright-content">
              <h2>{book.title}</h2>
              <p>本传记由 AI 根据采访素材、人生档案与家人提供资料整理而成。</p>
              <p>谨以此书，记录一段人生，传承一份家风。</p>
              <div className="copyright-divider" />
              <p>整理：{book.author || 'AI 整理'}</p>
              {archive?.birthYear && (
                <p>
                  传主：{subjectName}　生于{archive.birthYear}年
                </p>
              )}
              {book.createdAt && <p>成书时间：{book.createdAt}</p>}
            </div>
          </section>

          {/* 目录 */}
          <section className="book-page book-toc">
            <h2 className="toc-title">目　录</h2>
            <ul className="toc-list">
              {chapters.map((chapter, index) => (
                <li key={index} className="toc-item">
                  <span className="toc-chapter">第{index + 1}章　{chapter.title}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 章节 */}
          {chapters.map((chapter, index) => (
            <section className="book-page book-chapter" key={index}>
              <div className="chapter-header">
                <div className="chapter-number">第 {index + 1} 章</div>
                <h2 className="chapter-title">{chapter.title}</h2>
              </div>
              <div className="chapter-body">{renderChapterContent(chapter.content)}</div>
            </section>
          ))}

          {/* 后记/封底 */}
          <section className="book-page book-back">
            <div className="back-content">
              <BookOpen size={32} />
              <p>每一段人生都值得被记录，</p>
              <p>每一份家风都值得被传承。</p>
              <div className="back-line" />
              <p className="back-brand">传家世</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
