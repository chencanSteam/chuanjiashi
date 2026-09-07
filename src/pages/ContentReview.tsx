import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import {
  BookOpen,
  Image as ImageIcon,
  X as XIcon,
  Music,
  CreditCard,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { bookshelfApi } from '../api/bookshelf';
import { contentReviewApi } from '../api/contentReview';
import { orderApi, type AdminOrder } from '../api/order';
import type { PublicBook, MediaReviewItem } from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import './ContentReview.css';

const sections = [
  { key: 'books', label: '传记内容审核' },
  { key: 'media', label: '素材审核' },
  { key: 'refunds', label: '退款审核' },
] as const;

type SectionKey = (typeof sections)[number]['key'];

const bookStatusMap: Record<PublicBook['status'], { label: string; className: string }> = {
  pending: { label: '待审核', className: 'review-status pending' },
  approved: { label: '已通过 · 已上架', className: 'review-status approved' },
  rejected: { label: '已拒绝', className: 'review-status rejected' },
  off_shelf: { label: '已下架', className: 'review-status offshelf' },
};

const refundStatusMap = {
  pending: { label: '待审核', className: 'review-status pending' },
  rejected: { label: '已驳回', className: 'review-status rejected' },
  completed: { label: '已完成', className: 'review-status approved' },
} as const;

type RefundStatusKey = keyof typeof refundStatusMap;

const orderTypeLabels: Record<AdminOrder['type'], string> = {
  biography: '传记服务',
  digital_person: '数字人',
  video: '视频',
  qrcode: '二维码',
  book: '实体书',
  biographer_service: '传记师服务',
  group_buy: '团购',
  derivative: '衍生品',
};

export default function ContentReview() {
  const { addToast } = useToast();
  const { section } = useParams<{ section: string }>();
  const activeTab = section as SectionKey;
  const sectionValid = sections.some((s) => s.key === section);
  const [books, setBooks] = useState<PublicBook[]>([]);
  const [bookStatusFilter, setBookStatusFilter] = useState<'all' | PublicBook['status']>('all');
  const [mediaItems, setMediaItems] = useState<MediaReviewItem[]>([]);
  const [refundOrders, setRefundOrders] = useState<AdminOrder[]>([]);
  const [refundFilter, setRefundFilter] = useState<'all' | RefundStatusKey>('all');
  const [refundRejectOrder, setRefundRejectOrder] = useState<AdminOrder | null>(null);
  const [refundRejectionReason, setRefundRejectionReason] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  const loadBooks = () => {
    bookshelfApi
      .adminList({ status: 'all' })
      .then((list) => setBooks(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
      .catch(() => setBooks([]));
  };

  const loadRefunds = () => {
    orderApi
      .adminList()
      .then((list) =>
        setRefundOrders(
          list
            .filter((o) => o.refundRequest)
            .sort((a, b) => (b.refundRequest!.createdAt || '').localeCompare(a.refundRequest!.createdAt || '')),
        ),
      )
      .catch(() => setRefundOrders([]));
  };

  useEffect(() => {
    if (!sectionValid) return;
    if (activeTab === 'books') loadBooks();
    if (activeTab === 'media') {
      contentReviewApi.mediaList().then(setMediaItems).catch(() => setMediaItems([]));
    }
    if (activeTab === 'refunds') loadRefunds();
  }, [activeTab, sectionValid]);

  const handleBookReview = async (book: PublicBook, status: 'approved' | 'rejected') => {
    try {
      await bookshelfApi.review(book.id, status);
      addToast(status === 'approved' ? `「${book.title}」已通过审核` : `「${book.title}」已拒绝`, 'success');
      loadBooks();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    }
  };

  const handleOffShelf = async (book: PublicBook) => {
    try {
      await bookshelfApi.review(book.id, 'off_shelf');
      addToast(`「${book.title}」已下架`, 'success');
      loadBooks();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    }
  };

  const handleRestore = async (book: PublicBook) => {
    try {
      await bookshelfApi.review(book.id, 'approved');
      addToast(`「${book.title}」已恢复上架`, 'success');
      loadBooks();
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

  const handleApproveRefund = async (order: AdminOrder) => {
    if (!window.confirm(`审核通过后将完成退款 ¥${order.amount.toLocaleString()}，是否继续？`)) return;
    try {
      setRefundSubmitting(true);
      await orderApi.adminApproveRefund(order.id);
      addToast('退款审核通过，退款已完成', 'success');
      loadRefunds();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '退款审核失败', 'error');
    } finally {
      setRefundSubmitting(false);
    }
  };

  const handleRejectRefund = async () => {
    if (!refundRejectOrder) return;
    if (!refundRejectionReason.trim()) {
      addToast('请填写驳回原因', 'error');
      return;
    }
    try {
      setRefundSubmitting(true);
      await orderApi.adminRejectRefund(refundRejectOrder.id, refundRejectionReason.trim());
      addToast('退款申请已驳回', 'success');
      setRefundRejectOrder(null);
      setRefundRejectionReason('');
      loadRefunds();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    } finally {
      setRefundSubmitting(false);
    }
  };

  const filteredBooks = bookStatusFilter === 'all' ? books : books.filter((b) => b.status === bookStatusFilter);
  const filteredRefunds = refundFilter === 'all' ? refundOrders : refundOrders.filter((o) => (o.refundRequest?.status || 'pending') === refundFilter);

  if (!sectionValid) {
    return <Navigate to="/admin/content-review/books" replace />;
  }

  return (
    <div className="content-review-page">
      <header className="page-header">
        <h1 className="page-title">{sections.find((s) => s.key === activeTab)?.label || '内容审核'}</h1>
      </header>

      {activeTab === 'books' && (
        <Annotate id="content-review.book-review">
        <div className="card">
          <div className="card-header review-books-header">
            <h3 className="card-title"><BookOpen size={16} /> 用户上传的传记内容</h3>
            <select value={bookStatusFilter} onChange={(e) => setBookStatusFilter(e.target.value as typeof bookStatusFilter)}>
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
              <option value="off_shelf">已下架</option>
            </select>
          </div>
          <div className="card-body review-body">
            {filteredBooks.length === 0 ? (
              <div className="admin-table-empty">暂无内容</div>
            ) : (
              <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>书名</th>
                    <th>提交用户</th>
                    <th>署名</th>
                    <th>分类</th>
                    <th>价格</th>
                    <th>提交时间</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                {filteredBooks.map((book) => (
                  <tr key={book.id}>
                    <td className="admin-table-text-left">
                      <div className="review-book-cell">
                        <div className="review-book-cover">
                          {book.cover ? <img src={book.cover} alt={book.title} /> : <BookOpen size={20} />}
                        </div>
                        <div className="review-book-cell-info">
                          <div className="review-book-title">{book.title}</div>
                          <div className="review-book-intro">{book.intro}</div>
                        </div>
                      </div>
                    </td>
                    <td>{book.userId}</td>
                    <td>{book.author}</td>
                    <td>{book.category}</td>
                    <td>{book.isFree ? '免费公开' : `¥${book.price}`}</td>
                    <td>{new Date(book.createdAt).toLocaleString()}</td>
                    <td><span className={bookStatusMap[book.status].className}>{bookStatusMap[book.status].label}</span></td>
                    <td>
                      {book.status === 'pending' && (
                        <>
                          <button className="admin-table-link" onClick={() => handleBookReview(book, 'approved')}>通过</button>
                          <button className="admin-table-link danger" onClick={() => handleBookReview(book, 'rejected')}>拒绝</button>
                        </>
                      )}
                      {book.status === 'approved' && (
                        <button className="admin-table-link" onClick={() => handleOffShelf(book)}>下架</button>
                      )}
                      {book.status === 'off_shelf' && (
                        <button className="admin-table-link" onClick={() => handleRestore(book)}>恢复上架</button>
                      )}
                      {book.status === 'rejected' && (
                        <span className="admin-table-muted">已拒绝</span>
                      )}
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
              </div>
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
              <div className="admin-table-empty">暂无待审核素材</div>
            ) : (
              <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>类型</th>
                    <th>标题</th>
                    <th>归属</th>
                    <th>时间</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                {mediaItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="review-media-type">
                        {item.type === 'image' ? <ImageIcon size={14} /> : <Music size={14} />}
                        {item.type === 'image' ? '图片' : '音频'}
                      </span>
                    </td>
                    <td className="admin-table-text-left">{item.title}</td>
                    <td>{item.owner}</td>
                    <td>{item.createdAt}</td>
                    <td>
                      <span className={`review-status ${item.status}`}>
                        {item.status === 'pending' ? '待审核' : item.status === 'approved' ? '已通过' : '已驳回'}
                      </span>
                    </td>
                    <td>
                      {item.status === 'pending' ? (
                        <>
                          <button className="admin-table-link" onClick={() => handleMediaReview(item, 'approved')}>通过</button>
                          <button className="admin-table-link danger" onClick={() => handleMediaReview(item, 'rejected')}>驳回</button>
                        </>
                      ) : (
                        <span className="admin-table-muted">已处理</span>
                      )}
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
        </Annotate>
      )}

      {activeTab === 'refunds' && (
        <Annotate id="content-review.refund-review">
        <div className="card">
          <div className="card-header review-books-header">
            <h3 className="card-title"><CreditCard size={16} /> 退款申请审核</h3>
            <select value={refundFilter} onChange={(e) => setRefundFilter(e.target.value as typeof refundFilter)}>
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="rejected">已驳回</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          <div className="card-body review-body">
            {filteredRefunds.length === 0 ? (
              <div className="admin-table-empty">暂无退款申请</div>
            ) : (
              <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>订单号</th>
                    <th>客户</th>
                    <th>商品</th>
                    <th>金额</th>
                    <th>退款原因</th>
                    <th>申请时间</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                {filteredRefunds.map((order) => {
                  const refund = order.refundRequest!;
                  const statusKey = (refund.status || 'pending') as RefundStatusKey;
                  return (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.userName || '未知用户'}（{order.userPhone || order.userId}）</td>
                    <td>
                      <div>{order.productName}</div>
                      <div className="review-refund-sub">{orderTypeLabels[order.type] || order.type}</div>
                    </td>
                    <td>¥{order.amount.toLocaleString()}</td>
                    <td className="admin-table-text-left">
                      <div className="review-book-intro">
                        {refund.reasonOptionLabel || refund.reason}
                        {refund.customReason ? `（${refund.customReason}）` : ''}
                      </div>
                      {refund.rejectionReason && <div className="review-book-intro">驳回原因：{refund.rejectionReason}</div>}
                    </td>
                    <td>{new Date(refund.createdAt).toLocaleString()}</td>
                    <td><span className={refundStatusMap[statusKey].className}>{refundStatusMap[statusKey].label}</span></td>
                    <td>
                      {statusKey === 'pending' ? (
                        <>
                          <button className="admin-table-link" disabled={refundSubmitting} onClick={() => handleApproveRefund(order)}>通过退款</button>
                          <button className="admin-table-link danger" disabled={refundSubmitting} onClick={() => { setRefundRejectOrder(order); setRefundRejectionReason(''); }}>驳回</button>
                        </>
                      ) : (
                        <span className="admin-table-muted">已处理</span>
                      )}
                    </td>
                  </tr>
                  );
                })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
        </Annotate>
      )}

      {refundRejectOrder && (
        <div className="modal-overlay" onClick={() => setRefundRejectOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>驳回退款申请</h4>
              <button className="modal-close" onClick={() => setRefundRejectOrder(null)}><XIcon size={16} /></button>
            </div>
            <div className="modal-body">
              <p className="review-refund-reject-hint">请填写驳回原因，客户将可以看到该说明并重新申请退款。</p>
              <div className="form-row">
                <textarea rows={4} maxLength={500} value={refundRejectionReason} onChange={(e) => setRefundRejectionReason(e.target.value)} placeholder="请输入驳回原因" />
              </div>
              <div className="review-refund-reject-actions">
                <button className="btn btn-outline" onClick={() => setRefundRejectOrder(null)}>取消</button>
                <button className="btn btn-danger" disabled={refundSubmitting} onClick={handleRejectRefund}>{refundSubmitting ? '提交中…' : '确认驳回'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
