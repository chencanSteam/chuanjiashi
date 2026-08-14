import { useEffect, useState } from 'react';
import {
  BookOpen,
  Image as ImageIcon,
  ShieldAlert,
  Flag,
  ArchiveX,
  Check,
  X as XIcon,
  RotateCcw,
  Music,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { bookshelfApi } from '../api/bookshelf';
import { contentReviewApi } from '../api/contentReview';
import type { PublicBook, MediaReviewItem, ContentReport } from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import './ContentReview.css';

const tabs = [
  { key: 'books', label: '公开传记审核' },
  { key: 'media', label: '素材审核' },
  { key: 'sensitive', label: '敏感词检测' },
  { key: 'reports', label: '举报管理' },
  { key: 'offshelf', label: '内容下架管理' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

interface SensitiveHit {
  id: string;
  word: string;
  source: string;
  context: string;
  createdAt: string;
}

const mockSensitiveHits: SensitiveHit[] = [
  { id: 'hit_001', word: '敏感词A', source: '传记《山村教师王桂芬》第 3 章', context: '……涉及敏感词A 的段落已被系统标记……', createdAt: '2026-07-19 14:12' },
  { id: 'hit_002', word: '敏感词B', source: '数字馆留言', context: '……留言中出现敏感词B，已拦截展示……', createdAt: '2026-07-18 20:33' },
  { id: 'hit_003', word: '敏感词C', source: '采访回答文本', context: '……采访转写文本命中敏感词C，待人工复核……', createdAt: '2026-07-17 11:05' },
];

export default function ContentReview() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('books');
  const [pendingBooks, setPendingBooks] = useState<PublicBook[]>([]);
  const [offShelfBooks, setOffShelfBooks] = useState<PublicBook[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaReviewItem[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);

  const loadPendingBooks = () => {
    bookshelfApi
      .adminList({ status: 'pending' })
      .then(setPendingBooks)
      .catch(() => setPendingBooks([]));
  };

  const loadOffShelfBooks = () => {
    bookshelfApi
      .adminList({ status: 'off_shelf' })
      .then(setOffShelfBooks)
      .catch(() => setOffShelfBooks([]));
  };

  useEffect(() => {
    if (activeTab === 'books') loadPendingBooks();
    if (activeTab === 'offshelf') loadOffShelfBooks();
    if (activeTab === 'media') {
      contentReviewApi.mediaList().then(setMediaItems).catch(() => setMediaItems([]));
    }
    if (activeTab === 'reports') {
      contentReviewApi.reportList().then(setReports).catch(() => setReports([]));
    }
  }, [activeTab]);

  const handleBookReview = async (book: PublicBook, status: 'approved' | 'rejected') => {
    try {
      await bookshelfApi.review(book.id, status);
      addToast(status === 'approved' ? `「${book.title}」已通过审核` : `「${book.title}」已驳回`, 'success');
      loadPendingBooks();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    }
  };

  const handleRestore = async (book: PublicBook) => {
    try {
      await bookshelfApi.review(book.id, 'approved');
      addToast(`「${book.title}」已恢复上架`, 'success');
      loadOffShelfBooks();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    }
  };

  const handleMediaReview = async (item: MediaReviewItem, status: 'approved' | 'rejected') => {
    try {
      const updated = await contentReviewApi.reviewMedia(item.id, status);
      setMediaItems((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      addToast(status === 'approved' ? '素材已通过' : '素材已驳回', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    }
  };

  const handleReportProcess = async (item: ContentReport) => {
    try {
      const updated = await contentReviewApi.processReport(item.id);
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      addToast('举报已处理', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    }
  };

  return (
    <div className="content-review-page">
      <header className="page-header">
        <h1 className="page-title">内容审核</h1>
      </header>

      <Annotate id="content-review.tabs">
      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      </Annotate>

      {activeTab === 'books' && (
        <Annotate id="content-review.book-review">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><BookOpen size={16} /> 待审核公开传记</h3>
          </div>
          <div className="card-body review-body">
            {pendingBooks.length === 0 ? (
              <div className="review-empty">暂无待审核的公开传记</div>
            ) : (
              pendingBooks.map((book) => (
                <div className="review-book-item" key={book.id}>
                  <div className="review-book-cover">
                    {book.cover ? <img src={book.cover} alt={book.title} /> : <BookOpen size={24} />}
                  </div>
                  <div className="review-book-info">
                    <div className="review-book-title">{book.title}</div>
                    <div className="review-book-meta">
                      作者：{book.author} · 分类：{book.category} · {book.isFree ? '免费公开' : `¥${book.price}`}
                    </div>
                    <div className="review-book-intro">{book.intro}</div>
                    <div className="review-book-time">提交于 {new Date(book.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="review-actions">
                    <button className="btn btn-primary review-action-btn" onClick={() => handleBookReview(book, 'approved')}>
                      <Check size={14} /> 通过
                    </button>
                    <button className="btn btn-outline review-action-btn" onClick={() => handleBookReview(book, 'rejected')}>
                      <XIcon size={14} /> 驳回
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </Annotate>
      )}

      {activeTab === 'media' && (
        <Annotate id="content-review.media-review">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><ImageIcon size={16} /> 图片/音频素材审核</h3>
          </div>
          <div className="card-body review-body">
            {mediaItems.length === 0 ? (
              <div className="review-empty">暂无待审核素材</div>
            ) : (
              <div className="review-media-grid">
                {mediaItems.map((item) => (
                  <div className="review-media-card" key={item.id}>
                    <div className="review-media-thumb">
                      {item.type === 'image' ? <ImageIcon size={32} /> : <Music size={32} />}
                    </div>
                    <div className="review-media-title">{item.title}</div>
                    <div className="review-media-meta">
                      {item.type === 'image' ? '图片' : '音频'} · {item.owner} · {item.createdAt}
                    </div>
                    {item.status === 'pending' ? (
                      <div className="review-media-actions">
                        <button className="btn btn-primary review-action-btn" onClick={() => handleMediaReview(item, 'approved')}>
                          <Check size={14} /> 通过
                        </button>
                        <button className="btn btn-outline review-action-btn" onClick={() => handleMediaReview(item, 'rejected')}>
                          <XIcon size={14} /> 驳回
                        </button>
                      </div>
                    ) : (
                      <span className={`review-status ${item.status}`}>
                        {item.status === 'approved' ? '已通过' : '已驳回'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </Annotate>
      )}

      {activeTab === 'sensitive' && (
        <Annotate id="content-review.sensitive-hits">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><ShieldAlert size={16} /> 敏感词命中记录</h3>
          </div>
          <div className="card-body review-body">
            <div className="review-table">
              <div className="review-row review-header-row">
                <div className="review-cell">敏感词</div>
                <div className="review-cell">命中来源</div>
                <div className="review-cell">上下文</div>
                <div className="review-cell">命中时间</div>
              </div>
              {mockSensitiveHits.map((hit) => (
                <div className="review-row" key={hit.id}>
                  <div className="review-cell">
                    <span className="review-sensitive-word">{hit.word}</span>
                  </div>
                  <div className="review-cell">{hit.source}</div>
                  <div className="review-cell review-context">{hit.context}</div>
                  <div className="review-cell">{hit.createdAt}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </Annotate>
      )}

      {activeTab === 'reports' && (
        <Annotate id="content-review.report-process">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Flag size={16} /> 举报管理</h3>
          </div>
          <div className="card-body review-body">
            <div className="review-table">
              <div className="review-row review-header-row">
                <div className="review-cell">举报人</div>
                <div className="review-cell">被举报内容</div>
                <div className="review-cell">举报原因</div>
                <div className="review-cell">时间</div>
                <div className="review-cell">处理</div>
              </div>
              {reports.map((item) => (
                <div className="review-row" key={item.id}>
                  <div className="review-cell">{item.reporter}</div>
                  <div className="review-cell">{item.target}</div>
                  <div className="review-cell review-context">{item.reason}</div>
                  <div className="review-cell">{item.createdAt}</div>
                  <div className="review-cell">
                    {item.status === 'pending' ? (
                      <button className="btn btn-outline review-action-btn" onClick={() => handleReportProcess(item)}>
                        标记已处理
                      </button>
                    ) : (
                      <span className="review-status approved">已处理</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </Annotate>
      )}

      {activeTab === 'offshelf' && (
        <Annotate id="content-review.offshelf-restore">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><ArchiveX size={16} /> 已下架内容</h3>
          </div>
          <div className="card-body review-body">
            {offShelfBooks.length === 0 ? (
              <div className="review-empty">暂无已下架内容</div>
            ) : (
              offShelfBooks.map((book) => (
                <div className="review-book-item" key={book.id}>
                  <div className="review-book-cover">
                    {book.cover ? <img src={book.cover} alt={book.title} /> : <BookOpen size={24} />}
                  </div>
                  <div className="review-book-info">
                    <div className="review-book-title">{book.title}</div>
                    <div className="review-book-meta">作者：{book.author} · 分类：{book.category}</div>
                    <div className="review-book-intro">{book.intro}</div>
                  </div>
                  <div className="review-actions">
                    <button className="btn btn-outline review-action-btn" onClick={() => handleRestore(book)}>
                      <RotateCcw size={14} /> 恢复上架
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </Annotate>
      )}
    </div>
  );
}
