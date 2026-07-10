import { useEffect, useMemo, useState } from 'react';
import { Search, BookOpen, CheckCircle, XCircle, Eye, AlertCircle, Clock, User, Hash, DollarSign, Calendar, FileText, Bookmark, Tag, Type, Timer, BarChart3 } from 'lucide-react';
import { bookshelfApi, type BookReviewStatus } from '../api/bookshelf';
import { biographyApi } from '../api/biography';
import { useToast } from '../hooks/useToast';
import Avatar from '../components/ui/Avatar';
import type { PublicBook, Biography } from '../mocks/types';
import '../components/ui/Modal.css';
import './BookReview.css';

const statusFilterOptions: Array<{ value: PublicBook['status'] | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'off_shelf', label: '已下架' },
];

const statusMap: Record<PublicBook['status'], { label: string; className: string }> = {
  pending: { label: '待审核', className: 'book-status-pending' },
  approved: { label: '已通过', className: 'book-status-approved' },
  rejected: { label: '已拒绝', className: 'book-status-rejected' },
  off_shelf: { label: '已下架', className: 'book-status-off-shelf' },
};

export default function BookReview() {
  const { addToast } = useToast();
  const [books, setBooks] = useState<PublicBook[]>([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<PublicBook['status'] | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<PublicBook | null>(null);
  const [selectedBiography, setSelectedBiography] = useState<Biography | null>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [bioLoading, setBioLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingBook, setRejectingBook] = useState<PublicBook | null>(null);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = () => {
    setLoading(true);
    bookshelfApi
      .adminList({ status: statusFilter, keyword })
      .then(setBooks)
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBooks();
  }, [statusFilter, keyword]);

  const stats = useMemo(() => {
    return {
      total: books.length,
      pending: books.filter((b) => b.status === 'pending').length,
      approved: books.filter((b) => b.status === 'approved').length,
      rejected: books.filter((b) => b.status === 'rejected').length,
    };
  }, [books]);

  const handleReview = async (book: PublicBook, status: BookReviewStatus) => {
    try {
      await bookshelfApi.review(book.id, status, rejectReason);
      addToast(status === 'approved' ? '已通过上架' : status === 'rejected' ? '已拒绝上架' : '已下架', 'success');
      setRejectingBook(null);
      setRejectReason('');
      setSelectedBook(null);
      setSelectedBiography(null);
      loadBooks();
    } catch (err: any) {
      addToast(err.message || '操作失败', 'error');
    }
  };

  const openDetail = async (book: PublicBook) => {
    setSelectedBook(book);
    setActiveChapter(0);
    setBioLoading(true);
    try {
      const bio = await biographyApi.get(book.archiveId);
      setSelectedBiography(bio);
    } catch {
      setSelectedBiography(null);
    } finally {
      setBioLoading(false);
    }
  };

  return (
    <div className="book-review-page">
      <header className="page-header">
        <h1 className="page-title">传记上架审核</h1>
      </header>

      <div className="book-review-stats">
        <div className="card book-review-stat">
          <BookOpen size={20} color="#1B5E4B" />
          <div>
            <div className="book-review-stat-value">{stats.total}</div>
            <div className="book-review-stat-label">全部申请</div>
          </div>
        </div>
        <div className="card book-review-stat">
          <Clock size={20} color="#d97706" />
          <div>
            <div className="book-review-stat-value">{stats.pending}</div>
            <div className="book-review-stat-label">待审核</div>
          </div>
        </div>
        <div className="card book-review-stat">
          <CheckCircle size={20} color="#1B5E4B" />
          <div>
            <div className="book-review-stat-value">{stats.approved}</div>
            <div className="book-review-stat-label">已通过</div>
          </div>
        </div>
        <div className="card book-review-stat">
          <XCircle size={20} color="#ef4444" />
          <div>
            <div className="book-review-stat-value">{stats.rejected}</div>
            <div className="book-review-stat-label">已拒绝</div>
          </div>
        </div>
      </div>

      <div className="card book-review-list-card">
        <div className="card-header book-review-list-header">
          <div className="book-review-filters">
            <div className="book-review-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="搜索标题、作者…"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as PublicBook['status'] | 'all')}>
              {statusFilterOptions.map((s) => (
                <option value={s.value} key={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="card-body book-review-list-body">
          {loading ? (
            <div className="book-review-empty">加载中…</div>
          ) : books.length === 0 ? (
            <div className="book-review-empty">暂无符合条件的申请</div>
          ) : (
            <div className="book-review-table">
              <div className="book-review-row book-review-header-row">
                <div className="book-review-cell">传记信息</div>
                <div className="book-review-cell">作者/用户</div>
                <div className="book-review-cell">分类</div>
                <div className="book-review-cell">定价</div>
                <div className="book-review-cell">状态</div>
                <div className="book-review-cell">申请时间</div>
                <div className="book-review-cell">操作</div>
              </div>
              {books.map((book) => (
                <div className="book-review-row" key={book.id}>
                  <div className="book-review-cell book-review-cell-info">
                    <div className="book-review-title">{book.title}</div>
                    <div className="book-review-intro" title={book.intro}>{book.intro}</div>
                  </div>
                  <div className="book-review-cell">
                    <div className="book-review-author"><User size={12} /> {book.author}</div>
                    <div className="book-review-user">{book.userId}</div>
                  </div>
                  <div className="book-review-cell">{book.category}</div>
                  <div className="book-review-cell book-review-cell-price">
                    {book.isFree ? '免费' : `¥${book.price.toFixed(2)}`}
                  </div>
                  <div className="book-review-cell">
                    <span className={`book-status ${statusMap[book.status].className}`}>
                      {statusMap[book.status].label}
                    </span>
                  </div>
                  <div className="book-review-cell book-review-cell-time">{new Date(book.createdAt).toLocaleString()}</div>
                  <div className="book-review-cell book-review-cell-action">
                    <button className="book-review-btn book-review-btn-view" onClick={() => openDetail(book)}>
                      <Eye size={12} /> 详情
                    </button>
                    {book.status === 'pending' && (
                      <>
                        <button className="book-review-btn book-review-btn-approve" onClick={() => handleReview(book, 'approved')}>
                          <CheckCircle size={12} /> 通过
                        </button>
                        <button className="book-review-btn book-review-btn-reject" onClick={() => setRejectingBook(book)}>
                          <XCircle size={12} /> 拒绝
                        </button>
                      </>
                    )}
                    {book.status === 'approved' && (
                      <button className="book-review-btn book-review-btn-off-shelf" onClick={() => handleReview(book, 'off_shelf')}>
                        <AlertCircle size={12} /> 下架
                      </button>
                    )}
                    {book.status === 'off_shelf' && (
                      <button className="book-review-btn book-review-btn-approve" onClick={() => handleReview(book, 'approved')}>
                        <CheckCircle size={12} /> 重新上架
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedBook && (
        <div className="modal-overlay book-review-detail-overlay" onClick={() => setSelectedBook(null)}>
          <div className="modal-content book-review-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="book-review-detail-close" onClick={() => setSelectedBook(null)}><XCircle size={18} /></button>

            <div className="book-review-detail-layout">
              <div className="book-review-detail-sidebar">
                <div className="book-review-detail-cover">
                  <div className="book-review-detail-cover-pattern" />
                  <div className="book-review-detail-cover-badge">
                    <Bookmark size={14} /> 待审核传记
                  </div>
                </div>
                <div className="book-review-detail-sidebar-body">
                  <div className="book-review-detail-avatar">
                    <Avatar name={selectedBook.title.charAt(0)} size={72} />
                  </div>
                  <h3 className="book-review-detail-title">{selectedBook.title}</h3>
                  <div className="book-review-detail-subtitle">
                    <span><User size={13} /> {selectedBook.author}</span>
                    <span className="book-review-detail-dot" />
                    <span><Hash size={13} /> {selectedBook.category}</span>
                  </div>
                  <div className="book-review-detail-tags">
                    <span className={`book-status ${statusMap[selectedBook.status].className}`}>
                      {statusMap[selectedBook.status].label}
                    </span>
                    <span className="book-review-detail-tag">
                      <Tag size={11} /> {selectedBook.category}
                    </span>
                    {selectedBook.isFree ? (
                      <span className="book-review-detail-tag book-review-detail-tag-free">免费公开</span>
                    ) : (
                      <span className="book-review-detail-tag book-review-detail-tag-price">¥{selectedBook.price.toFixed(2)}</span>
                    )}
                  </div>

                  <div className="book-review-detail-stats">
                    <div className="book-review-detail-stat">
                      <Type size={16} />
                      <div>
                        <div className="book-review-detail-stat-value">
                          {selectedBiography
                            ? selectedBiography.chapters.reduce((sum, c) => sum + c.content.replace(/\s/g, '').length, 0).toLocaleString()
                            : '--'}
                        </div>
                        <div className="book-review-detail-stat-label">总字数</div>
                      </div>
                    </div>
                    <div className="book-review-detail-stat">
                      <Bookmark size={16} />
                      <div>
                        <div className="book-review-detail-stat-value">{selectedBiography ? selectedBiography.chapters.length : '--'}</div>
                        <div className="book-review-detail-stat-label">章节数</div>
                      </div>
                    </div>
                    <div className="book-review-detail-stat">
                      <Timer size={16} />
                      <div>
                        <div className="book-review-detail-stat-value">
                          {selectedBiography
                            ? `${Math.max(1, Math.ceil(selectedBiography.chapters.reduce((sum, c) => sum + c.content.replace(/\s/g, '').length, 0) / 300))} 分钟`
                            : '--'}
                        </div>
                        <div className="book-review-detail-stat-label">阅读时长</div>
                      </div>
                    </div>
                  </div>

                  <div className="book-review-detail-meta-list">
                    <div className="book-review-detail-meta-item">
                      <span className="book-review-detail-meta-label"><DollarSign size={13} /> 定价</span>
                      <span className={`book-review-detail-meta-value ${selectedBook.isFree ? '' : 'book-review-detail-price'}`}>
                        {selectedBook.isFree ? '免费公开' : `¥${selectedBook.price.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="book-review-detail-meta-item">
                      <span className="book-review-detail-meta-label"><User size={13} /> 提交用户</span>
                      <span className="book-review-detail-meta-value">{selectedBook.userId}</span>
                    </div>
                    <div className="book-review-detail-meta-item">
                      <span className="book-review-detail-meta-label"><Calendar size={13} /> 申请时间</span>
                      <span className="book-review-detail-meta-value">{new Date(selectedBook.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="book-review-detail-intro-card">
                    <div className="book-review-detail-intro-label">作品简介</div>
                    <p className="book-review-detail-intro-text">{selectedBook.intro || '暂无简介'}</p>
                  </div>

                  <div className="book-review-detail-actions">
                    {selectedBook.status === 'pending' && (
                      <>
                        <button className="btn btn-primary btn-block btn-lg" onClick={() => handleReview(selectedBook, 'approved')}>
                          <CheckCircle size={16} /> 通过上架
                        </button>
                        <button className="btn btn-danger btn-block btn-lg" onClick={() => setRejectingBook(selectedBook)}>
                          <XCircle size={16} /> 拒绝上架
                        </button>
                      </>
                    )}
                    {selectedBook.status === 'approved' && (
                      <button className="btn btn-danger btn-block btn-lg" onClick={() => handleReview(selectedBook, 'off_shelf')}>
                        <AlertCircle size={16} /> 下架
                      </button>
                    )}
                    {selectedBook.status === 'off_shelf' && (
                      <button className="btn btn-primary btn-block btn-lg" onClick={() => handleReview(selectedBook, 'approved')}>
                        <CheckCircle size={16} /> 重新上架
                      </button>
                    )}
                    {selectedBook.status === 'rejected' && (
                      <span className="book-review-detail-rejected-hint">该申请已被拒绝</span>
                    )}
                    <button className="btn btn-outline btn-block" onClick={() => setSelectedBook(null)}>关闭弹窗</button>
                  </div>
                </div>
              </div>

              <div className="book-review-detail-content">
                <div className="book-review-content-header">
                  <div className="book-review-content-header-left">
                    <FileText size={20} />
                    <div>
                      <h4>传记内容审核</h4>
                      <p>请审阅正文内容，确认无误后再执行上架操作</p>
                    </div>
                  </div>
                  {selectedBiography && (
                    <div className="book-review-content-metrics">
                      <span><BarChart3 size={12} /> {selectedBiography.chapters.length} 个章节</span>
                      <span>
                        <Type size={12} />{' '}
                        {selectedBiography.chapters.reduce((sum, c) => sum + c.content.replace(/\s/g, '').length, 0).toLocaleString()} 字
                      </span>
                    </div>
                  )}
                </div>

                {bioLoading ? (
                  <div className="book-review-content-empty">
                    <div className="book-review-content-loading" />
                    <p>正在加载传记内容…</p>
                  </div>
                ) : !selectedBiography ? (
                  <div className="book-review-content-empty">
                    <BookOpen size={48} color="#d1d5db" />
                    <p>该传记暂无生成内容</p>
                    <span className="book-review-content-empty-hint">请提醒作者先完成传记生成后再提交上架</span>
                  </div>
                ) : (
                  <div className="book-review-content-body">
                    <div className="book-review-chapter-tabs">
                      {selectedBiography.chapters.map((chapter, idx) => (
                        <button
                          key={chapter.id}
                          className={`book-review-chapter-tab ${idx === activeChapter ? 'active' : ''}`}
                          onClick={() => setActiveChapter(idx)}
                        >
                          <span className="book-review-chapter-tab-no">{idx + 1}</span>
                          {chapter.title}
                        </button>
                      ))}
                    </div>
                    <div className="book-review-chapter-body">
                      <div className="book-review-chapter-header">
                        <span className="book-review-chapter-no">第 {activeChapter + 1} 章</span>
                        <h5 className="book-review-chapter-title">{selectedBiography.chapters[activeChapter].title}</h5>
                        <span className="book-review-chapter-wordcount">
                          {selectedBiography.chapters[activeChapter].content.replace(/\s/g, '').length.toLocaleString()} 字
                        </span>
                      </div>
                      <div className="book-review-chapter-divider" />
                      <div className="book-review-chapter-text">
                        {(() => {
                          const chapter = selectedBiography.chapters[activeChapter];
                          const lines = chapter.content.split('\n').filter(Boolean);
                          const bodyLines = lines[0] === chapter.title ? lines.slice(1) : lines;
                          return bodyLines.map((paragraph, idx) => <p key={idx}>{paragraph}</p>);
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectingBook && (
        <div className="modal-overlay book-review-reject-overlay" onClick={() => setRejectingBook(null)}>
          <div className="modal-content book-review-reject-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 className="modal-title">拒绝上架</h4>
              <button className="modal-close" onClick={() => setRejectingBook(null)}><XCircle size={16} /></button>
            </div>
            <div className="modal-body">
              <p className="book-review-reject-hint">
                确定拒绝「{rejectingBook.title}」的上架申请吗？
              </p>
              <div className="book-review-reject-field">
                <label>拒绝原因（选填）</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="如内容不符合规范、信息不完整等"
                  rows={3}
                />
              </div>
              <div className="book-review-reject-actions">
                <button className="btn btn-outline" onClick={() => setRejectingBook(null)}>取消</button>
                <button className="btn btn-danger" onClick={() => handleReview(rejectingBook, 'rejected')}>确认拒绝</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
