import { useState, type FormEvent } from 'react';
import { Search, BookOpen, CheckCircle, XCircle, AlertCircle, User, Hash, DollarSign, Calendar, FileText, Bookmark, Type, BarChart3 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import Annotate from '../components/annotation/Annotate';
import type { PublicBook, Biography } from '../mocks/types';
import '../components/ui/Modal.css';
import './BookReview.css';

const statusFilterOptions: Array<{ value: PublicBook['status'] | 'all'; label: string }> = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已上架' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'off_shelf', label: '已下架' },
];

const statusMap: Record<PublicBook['status'], { label: string; className: string }> = {
  pending: { label: '待审核', className: 'book-status-pending' },
  approved: { label: '已上架', className: 'book-status-approved' },
  rejected: { label: '已拒绝', className: 'book-status-rejected' },
  off_shelf: { label: '已下架', className: 'book-status-off-shelf' },
};

interface BookFilters {
  keyword: string;
  status: PublicBook['status'] | 'all';
  category: string;
  priceType: 'all' | 'free' | 'paid';
  dateFrom: string;
  dateTo: string;
}

const emptyFilters: BookFilters = { keyword: '', status: 'all', category: 'all', priceType: 'all', dateFrom: '', dateTo: '' };

const mockBooks: PublicBook[] = [
  { id: 'review-001', archiveId: 'archive-001', userId: 'u_demo_001', title: '张明远：一位苏州企业家的六十年', author: '张立群', intro: '从苏州老巷走到创业舞台，记录一个普通中国家庭的奋斗与传承。', category: '企业家', price: 0, isFree: true, status: 'approved', views: 1820, likes: 96, sales: 236, collects: 42, shares: 18, createdAt: '2026-09-08T15:56:57' },
  { id: 'review-002', archiveId: 'archive-002', userId: 'u_demo_002', title: '山村教师王桂芬', author: '王建华', intro: '四十年讲台生涯，用知识点亮山村孩子的未来。', category: '教师', price: 9.9, isFree: false, status: 'approved', views: 860, likes: 54, sales: 45, collects: 12, shares: 8, createdAt: '2026-09-08T14:36:21' },
  { id: 'review-003', archiveId: 'archive-003', userId: 'u_demo_003', title: '医者仁心：李华亭回忆录', author: '李文静', intro: '从赤脚医生到三甲医院专家，五十载悬壶济世的动人故事。', category: '医生', price: 19.9, isFree: false, status: 'pending', views: 0, likes: 0, sales: 0, collects: 6, shares: 0, createdAt: '2026-09-08T13:18:09' },
  { id: 'review-004', archiveId: 'archive-004', userId: 'u_demo_004', title: '我的母亲周秀英', author: '周国强', intro: '一位普通农村母亲养育五个子女的艰辛与慈爱。', category: '家庭', price: 0, isFree: true, status: 'pending', views: 0, likes: 0, sales: 0, collects: 3, shares: 0, createdAt: '2026-09-08T11:42:10' },
  { id: 'review-005', archiveId: 'archive-005', userId: 'u_demo_005', title: '铁血芳华：老兵陈建国', author: '陈志远', intro: '从战火纷飞到和平年代，一位老兵六十年不变的信仰与坚守。', category: '军人', price: 12.9, isFree: false, status: 'off_shelf', views: 1250, likes: 88, sales: 128, collects: 35, shares: 22, createdAt: '2026-09-08T10:21:32' },
  { id: 'review-006', archiveId: 'archive-006', userId: 'u_demo_006', title: '匠心五十年：木匠徐长顺', author: '徐晓东', intro: '一把刨子、一根墨线，老木匠用双手量半个世纪的时光。', category: '工匠', price: 6.9, isFree: false, status: 'rejected', views: 0, likes: 0, sales: 0, collects: 2, shares: 0, createdAt: '2026-09-07T18:02:46' },
];

const mockReviewTimes: Record<string, string> = {
  'review-001': '2026-09-08T16:18:22',
  'review-002': '2026-09-08T15:02:14',
  'review-005': '2026-09-08T11:06:45',
  'review-006': '2026-09-07T19:20:31',
};

function formatReviewTime(book: PublicBook) {
  if (book.status === 'pending') return '待审核';
  const reviewTime = mockReviewTimes[book.id];
  return reviewTime ? new Date(reviewTime).toLocaleString() : '—';
}

function createMockBiography(book: PublicBook): Biography {
  return {
    id: `bio-${book.id}`, archiveId: book.archiveId, title: book.title, style: 'warm', wordCount: 'standard', status: 'final', createdAt: book.createdAt, updatedAt: book.createdAt,
    chapters: [
      { id: `${book.id}-1`, order: 1, title: '故里童年 · 初心萌芽', content: `${book.title}\n${book.intro}\n\n从家庭环境到时代背景，从个人选择到人生转折，每一个细节都承载着岁月的痕迹，也折射出一个普通人的生命体验。`, images: [] },
      { id: `${book.id}-2`, order: 2, title: '求学成长 · 岁月积淀', content: '求学与成长让主人公逐渐形成了自己的性格与信念。那些看似平常的选择，后来都成为人生中重要的坐标。', images: [] },
      { id: `${book.id}-3`, order: 3, title: '家风人生 · 温情生活', content: '家庭始终是这段人生故事的底色。亲人的陪伴、家风的传承，以及对下一代的期许，共同组成了温暖而真实的生活。', images: [] },
    ],
  };
}

export default function BookReview() {
  const { addToast } = useToast();
  const [books, setBooks] = useState<PublicBook[]>(mockBooks);
  const [filters, setFilters] = useState<BookFilters>({ ...emptyFilters });
  const [appliedFilters, setAppliedFilters] = useState<BookFilters>({ ...emptyFilters });
  const [loading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<PublicBook | null>(null);
  const [selectedBiography, setSelectedBiography] = useState<Biography | null>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [bioLoading, setBioLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingBook, setRejectingBook] = useState<PublicBook | null>(null);

  const categories = Array.from(new Set(books.map((book) => book.category))).sort((a, b) => a.localeCompare(b, 'zh-CN'));
  const visibleBooks = books.filter((book) => {
    const matchesStatus = appliedFilters.status === 'all' || book.status === appliedFilters.status;
    const query = appliedFilters.keyword.trim().toLowerCase();
    const matchesKeyword = !query || `${book.title} ${book.author} ${book.userId}`.toLowerCase().includes(query);
    const matchesCategory = appliedFilters.category === 'all' || book.category === appliedFilters.category;
    const matchesPrice = appliedFilters.priceType === 'all' || (appliedFilters.priceType === 'free' ? book.isFree : !book.isFree);
    const submittedDate = book.createdAt.slice(0, 10);
    const matchesDate = (!appliedFilters.dateFrom || submittedDate >= appliedFilters.dateFrom)
      && (!appliedFilters.dateTo || submittedDate <= appliedFilters.dateTo);
    return matchesStatus && matchesKeyword && matchesCategory && matchesPrice && matchesDate;
  });

  const handleQuery = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
      addToast('提交时间的结束日期不能早于开始日期', 'error');
      return;
    }
    setAppliedFilters({ ...filters });
  };

  const resetFilters = () => {
    setFilters({ ...emptyFilters });
    setAppliedFilters({ ...emptyFilters });
  };

  const handleReview = (book: PublicBook, status: PublicBook['status']) => {
    setBooks((current) => current.map((item) => item.id === book.id ? { ...item, status } : item));
    addToast(status === 'approved' ? '已通过并上架' : status === 'rejected' ? '已拒绝上架' : status === 'off_shelf' ? '已下架' : '状态已更新', 'success');
    setRejectingBook(null);
    setRejectReason('');
    setSelectedBook(null);
    setSelectedBiography(null);
  };

  const openDetail = (book: PublicBook) => {
    setSelectedBook(book);
    setActiveChapter(0);
    setBioLoading(true);
    setSelectedBiography(createMockBiography(book));
    setBioLoading(false);
  };

  return (
    <div className="book-review-page">
      <header className="page-header">
        <h1 className="page-title">传记上架审核</h1>
      </header>

      <div className="card book-review-list-card">
        <div className="card-header book-review-list-header">
          <Annotate id="book-review.filters" inline>
          <form className="book-review-filters" onSubmit={handleQuery}>
            <div className="book-review-search">
              <Search size={14} />
              <input
                type="text"
                aria-label="搜索传记标题、作者或用户ID"
                placeholder="搜索标题、作者、用户ID"
                value={filters.keyword}
                onChange={(e) => setFilters((current) => ({ ...current, keyword: e.target.value }))}
              />
            </div>
            <select aria-label="审核状态" value={filters.status} onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value as BookFilters['status'] }))}>
              {statusFilterOptions.map((s) => (
                <option value={s.value} key={s.value}>{s.label}</option>
              ))}
            </select>
            <select aria-label="传记分类" value={filters.category} onChange={(e) => setFilters((current) => ({ ...current, category: e.target.value }))}>
              <option value="all">全部分类</option>
              {categories.map((category) => <option value={category} key={category}>{category}</option>)}
            </select>
            <select aria-label="定价类型" value={filters.priceType} onChange={(e) => setFilters((current) => ({ ...current, priceType: e.target.value as BookFilters['priceType'] }))}>
              <option value="all">全部定价</option>
              <option value="free">免费</option>
              <option value="paid">付费</option>
            </select>
            <label className="book-review-date">提交时间<input type="date" aria-label="提交开始日期" value={filters.dateFrom} onChange={(e) => setFilters((current) => ({ ...current, dateFrom: e.target.value }))} /></label>
            <span className="book-review-date-separator">至</span>
            <input className="book-review-date-input" type="date" aria-label="提交结束日期" value={filters.dateTo} onChange={(e) => setFilters((current) => ({ ...current, dateTo: e.target.value }))} />
            <div className="book-review-filter-actions"><button className="btn btn-primary" type="submit">查询</button><button className="btn btn-outline" type="button" onClick={resetFilters}>重置</button></div>
          </form>
          </Annotate>
        </div>
        <Annotate id="book-review.list">
        <div className="card-body book-review-list-body">
          {loading ? (
            <div className="book-review-empty">加载中…</div>
          ) : visibleBooks.length === 0 ? (
            <div className="book-review-empty">暂无符合条件的申请</div>
          ) : (
            <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>传记信息</th>
                  <th>作者/用户</th>
                  <th>分类</th>
                  <th>定价</th>
                  <th>状态</th>
                  <th>提交时间</th>
                  <th>审核时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
              {visibleBooks.map((book) => (
                <tr key={book.id}>
                  <td className="admin-table-text-left book-review-cell-info">
                    <div className="book-review-title">{book.title}</div>
                    <div className="book-review-intro" title={book.intro}>{book.intro}</div>
                  </td>
                  <td className="admin-table-text-left">
                    <div className="book-review-author"><User size={12} /> {book.author}</div>
                    <div className="book-review-user">{book.userId}</div>
                  </td>
                  <td>{book.category}</td>
                  <td className="book-review-cell-price">
                    {book.isFree ? '免费' : `¥${book.price.toFixed(2)}`}
                  </td>
                  <td>
                    <span className={`book-status ${statusMap[book.status].className}`}>
                      {statusMap[book.status].label}
                    </span>
                  </td>
                  <td className="book-review-cell-time">{new Date(book.createdAt).toLocaleString()}</td>
                  <td className="book-review-cell-time">{formatReviewTime(book)}</td>
                  <td>
                    <button className="admin-table-link" onClick={() => openDetail(book)}>详情</button>
                    {book.status === 'pending' && (
                      <>
                        <button className="admin-table-link" onClick={() => handleReview(book, 'approved')}>通过</button>
                        <button className="admin-table-link danger" onClick={() => setRejectingBook(book)}>拒绝</button>
                      </>
                    )}
                    {book.status === 'approved' && (
                      <button className="admin-table-link danger" onClick={() => handleReview(book, 'off_shelf')}>下架</button>
                    )}
                    {book.status === 'off_shelf' && (
                      <button className="admin-table-link" onClick={() => handleReview(book, 'approved')}>重新上架</button>
                    )}
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
        </Annotate>
      </div>

      {selectedBook && (
        <Annotate id="book-review.detail">
        <div className="modal-overlay book-review-detail-overlay" onClick={() => setSelectedBook(null)}>
          <div className="modal-content book-review-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="book-review-detail-close" onClick={() => setSelectedBook(null)}><XCircle size={18} /></button>

            <div className="book-review-detail-layout">
              <div className="book-review-detail-sidebar">
                <div className="book-review-detail-cover">
                  <div className="book-review-detail-cover-pattern" />
                  <div className="book-review-detail-cover-badge">
                    <Bookmark size={14} /> {statusMap[selectedBook.status].label}传记
                  </div>
                </div>
                <div className="book-review-detail-sidebar-body">
                  <div className="book-review-detail-book-cover" aria-label={`${selectedBook.title}书籍封面`}>
                    {selectedBook.cover ? (
                      <img src={selectedBook.cover} alt={`${selectedBook.title}封面`} />
                    ) : (
                      <>
                        <BookOpen size={34} />
                        <strong>{selectedBook.category}</strong>
                        <span>传家世</span>
                      </>
                    )}
                  </div>
                  <h3 className="book-review-detail-title">{selectedBook.title}</h3>
                  <div className="book-review-detail-subtitle">
                    <span><User size={13} /> {selectedBook.author}</span>
                    <span className="book-review-detail-dot" />
                    <span><Hash size={13} /> {selectedBook.category}</span>
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
                      <span className="book-review-detail-meta-label"><Calendar size={13} /> 提交时间</span>
                      <span className="book-review-detail-meta-value">{new Date(selectedBook.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="book-review-detail-meta-item">
                      <span className="book-review-detail-meta-label"><CheckCircle size={13} /> 审核时间</span>
                      <span className="book-review-detail-meta-value">{formatReviewTime(selectedBook)}</span>
                    </div>
                  </div>

                  <div className="book-review-detail-intro-card">
                    <div className="book-review-detail-intro-label">作品简介</div>
                    <p className="book-review-detail-intro-text">{selectedBook.intro || '暂无简介'}</p>
                  </div>

                  {selectedBook.status === 'rejected' && (
                    <div className="book-review-rejected-note">该传记暂未通过审核，可查看内容后重新提交。</div>
                  )}

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
                      <h4>传记内容预览</h4>
                      <p>查看章节与正文内容，确认书籍具备上架条件</p>
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
        </Annotate>
      )}

      {rejectingBook && (
        <Annotate id="book-review.reject-modal">
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
                <label>拒绝原因</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="请填写拒绝原因，如内容不完整、信息不符合规范等"
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
        </Annotate>
      )}
    </div>
  );
}
