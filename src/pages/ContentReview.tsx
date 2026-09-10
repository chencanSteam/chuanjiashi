import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import {
  BookOpen,
  Image as ImageIcon,
  X as XIcon,
  Music,
  Search,
  Eye,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { bookshelfApi } from '../api/bookshelf';
import { contentReviewApi } from '../api/contentReview';
import type { AdminOrder } from '../api/order';
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
  completed: { label: '已退款', className: 'review-status approved' },
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

const REFUND_DEMO_ORDERS: AdminOrder[] = [
  {
    id: 'ord_demo_006', userId: 'u_demo_006', userName: '刘先生', userPhone: '134****8006',
    type: 'biography', productId: 'download_default', productName: '家族传记 · 下载 PDF', amount: 9.9, quantity: 1,
    status: 'refunded', payTime: '2026-09-06T13:10:00', createdAt: '2026-09-06T13:08:00', updatedAt: '2026-09-06T15:00:00',
    refundRequest: { reason: '不需要该商品', reasonOptionLabel: '不需要该商品', status: 'completed', createdAt: '2026-09-06T14:20:00', processedAt: '2026-09-06T15:00:00' },
  },
  {
    id: 'ord_demo_007', userId: 'u_demo_007', userName: '周女士', userPhone: '133****8007',
    type: 'book', productId: 'publish_default', productName: '家庭传记 · 实体书精装版', amount: 288, quantity: 1,
    status: 'paid', payTime: '2026-09-07T10:15:00', createdAt: '2026-09-07T10:12:00', updatedAt: '2026-09-07T11:00:00',
    refundRequest: { reason: '商品与描述不符', reasonOptionLabel: '商品与描述不符', customReason: '希望更换装帧版本', status: 'pending', createdAt: '2026-09-07T11:00:00' },
  },
  {
    id: 'ord_demo_008', userId: 'u_demo_008', userName: '王先生', userPhone: '132****8008',
    type: 'qrcode', productId: 'qrcode_default', productName: '张明远的传记 · 生成二维码', amount: 19.9, quantity: 1,
    status: 'paid', payTime: '2026-09-08T09:30:00', createdAt: '2026-09-08T09:28:00', updatedAt: '2026-09-08T10:00:00',
    refundRequest: { reason: '重复购买', reasonOptionLabel: '重复购买', status: 'pending', createdAt: '2026-09-08T10:00:00' },
  },
  {
    id: 'ord_demo_009', userId: 'u_demo_009', userName: '陈女士', userPhone: '131****8009',
    type: 'biographer_service', productId: 'bio_service_001', productName: '传记师深度采访服务', amount: 1999, quantity: 1,
    status: 'paid', payTime: '2026-09-05T15:40:00', createdAt: '2026-09-05T15:35:00', updatedAt: '2026-09-06T09:00:00',
    refundRequest: { reason: '暂时无法安排时间', reasonOptionLabel: '暂时无法安排时间', status: 'rejected', rejectionReason: '服务已进入排期，暂不支持直接退款', createdAt: '2026-09-06T09:00:00', processedAt: '2026-09-06T11:20:00' },
  },
];

const REFUND_AMOUNT_DEMO: Record<string, number> = {
  ord_demo_006: 9.9,
  ord_demo_007: 288,
  ord_demo_008: 19.9,
  ord_demo_009: 1999,
};

export default function ContentReview() {
  const { addToast } = useToast();
  const { section } = useParams<{ section: string }>();
  const activeTab = section as SectionKey;
  const sectionValid = sections.some((s) => s.key === section);
  const [books, setBooks] = useState<PublicBook[]>([]);
  const [bookStatusFilter, setBookStatusFilter] = useState<'all' | PublicBook['status']>('all');
  const [mediaItems, setMediaItems] = useState<MediaReviewItem[]>([]);
  const [refundOrders, setRefundOrders] = useState<AdminOrder[]>(REFUND_DEMO_ORDERS);
  const [refundFilter, setRefundFilter] = useState<'all' | RefundStatusKey>('all');
  const [refundKeyword, setRefundKeyword] = useState('');
  const [refundTypeFilter, setRefundTypeFilter] = useState<'all' | AdminOrder['type']>('all');
  const [refundRejectOrder, setRefundRejectOrder] = useState<AdminOrder | null>(null);
  const [selectedRefundOrder, setSelectedRefundOrder] = useState<AdminOrder | null>(null);
  const [refundRejectionReason, setRefundRejectionReason] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  const loadBooks = () => {
    bookshelfApi
      .adminList({ status: 'all' })
      .then((list) => setBooks(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
      .catch(() => setBooks([]));
  };

  const loadRefunds = () => {
    setRefundOrders(REFUND_DEMO_ORDERS);
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
      setRefundOrders((prev) => prev.map((item) => item.id === order.id ? { ...item, status: 'refunded', refundRequest: item.refundRequest ? { ...item.refundRequest, status: 'completed', processedAt: new Date().toISOString() } : item.refundRequest } : item));
      addToast('退款审核通过，退款已完成', 'success');
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
      setRefundOrders((prev) => prev.map((item) => item.id === refundRejectOrder.id ? { ...item, refundRequest: item.refundRequest ? { ...item.refundRequest, status: 'rejected', rejectionReason: refundRejectionReason.trim(), processedAt: new Date().toISOString() } : item.refundRequest } : item));
      addToast('退款申请已驳回', 'success');
      setRefundRejectOrder(null);
      setRefundRejectionReason('');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    } finally {
      setRefundSubmitting(false);
    }
  };

  const filteredBooks = bookStatusFilter === 'all' ? books : books.filter((b) => b.status === bookStatusFilter);
  const filteredRefunds = refundOrders.filter((order) => {
    const refund = order.refundRequest;
    const statusKey = (refund?.status || 'pending') as RefundStatusKey;
    const query = refundKeyword.trim().toLowerCase();
    const matchesKeyword = !query || `${order.id} ${order.userName} ${order.userPhone} ${order.productName}`.toLowerCase().includes(query);
    return (refundFilter === 'all' || statusKey === refundFilter)
      && (refundTypeFilter === 'all' || order.type === refundTypeFilter)
      && matchesKeyword;
  });

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
          <div className="card-header review-refund-header">
            <div className="review-refund-toolbar">
              <div className="review-refund-search">
                <Search size={15} />
                <input value={refundKeyword} onChange={(e) => setRefundKeyword(e.target.value)} placeholder="搜索订单号、客户、商品" />
              </div>
              <select value={refundFilter} onChange={(e) => setRefundFilter(e.target.value as typeof refundFilter)}>
                <option value="all">全部状态</option>
                <option value="pending">待审核</option>
                <option value="rejected">已驳回</option>
                <option value="completed">已退款</option>
              </select>
              <select value={refundTypeFilter} onChange={(e) => setRefundTypeFilter(e.target.value as typeof refundTypeFilter)}>
                <option value="all">全部商品类型</option>
                <option value="biography">传记导出</option>
                <option value="book">实体书</option>
                <option value="qrcode">二维码</option>
                <option value="biographer_service">传记师服务</option>
              </select>
            </div>
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
                    <th>订单金额</th>
                    <th>退款金额</th>
                    <th>退款原因</th>
                    <th>申请时间</th>
                    <th>处理时间</th>
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
                    <td className="review-refund-amount">¥{(REFUND_AMOUNT_DEMO[order.id] ?? order.amount).toLocaleString()}</td>
                    <td className="admin-table-text-left">
                      <div className="review-book-intro">
                        {refund.reasonOptionLabel || refund.reason}
                        {refund.customReason ? `（${refund.customReason}）` : ''}
                      </div>
                      {refund.rejectionReason && <div className="review-book-intro">驳回原因：{refund.rejectionReason}</div>}
                    </td>
                    <td>{new Date(refund.createdAt).toLocaleString()}</td>
                    <td>{refund.processedAt ? new Date(refund.processedAt).toLocaleString() : '—'}</td>
                    <td><span className={refundStatusMap[statusKey].className}>{refundStatusMap[statusKey].label}</span></td>
                    <td>
                      {statusKey === 'pending' ? (
                        <>
                          <button className="admin-table-link" onClick={() => setSelectedRefundOrder(order)}><Eye size={13} /> 详情</button>
                          <button className="admin-table-link" disabled={refundSubmitting} onClick={() => handleApproveRefund(order)}>同意退款</button>
                          <button className="admin-table-link danger" disabled={refundSubmitting} onClick={() => { setRefundRejectOrder(order); setRefundRejectionReason(''); }}>驳回</button>
                        </>
                      ) : (
                        <button className="admin-table-link" onClick={() => setSelectedRefundOrder(order)}><Eye size={13} /> 查看详情</button>
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

      {selectedRefundOrder && selectedRefundOrder.refundRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRefundOrder(null)}>
          <div className="modal-content review-refund-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h4>退款申请详情</h4>
                <p className="review-refund-detail-subtitle">订单号：{selectedRefundOrder.id}</p>
              </div>
              <button className="modal-close" onClick={() => setSelectedRefundOrder(null)}><XIcon size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="review-refund-detail-status-row">
                <span className={refundStatusMap[(selectedRefundOrder.refundRequest.status || 'pending') as RefundStatusKey].className}>
                  {refundStatusMap[(selectedRefundOrder.refundRequest.status || 'pending') as RefundStatusKey].label}
                </span>
                <span>申请时间：{new Date(selectedRefundOrder.refundRequest.createdAt).toLocaleString()}</span>
              </div>
              <div className="review-refund-detail-grid">
                <div><span>客户</span><strong>{selectedRefundOrder.userName}（{selectedRefundOrder.userPhone || selectedRefundOrder.userId}）</strong></div>
                <div><span>商品类型</span><strong>{orderTypeLabels[selectedRefundOrder.type] || selectedRefundOrder.type}</strong></div>
                <div><span>商品名称</span><strong>{selectedRefundOrder.productName}</strong></div>
                <div><span>支付时间</span><strong>{selectedRefundOrder.payTime ? new Date(selectedRefundOrder.payTime).toLocaleString() : '—'}</strong></div>
                <div><span>订单金额</span><strong>¥{selectedRefundOrder.amount.toLocaleString()}</strong></div>
                <div><span>申请退款金额</span><strong className="review-refund-detail-price">¥{(REFUND_AMOUNT_DEMO[selectedRefundOrder.id] ?? selectedRefundOrder.amount).toLocaleString()}</strong></div>
              </div>
              <div className="review-refund-detail-section">
                <h5>退款原因</h5>
                <p>{selectedRefundOrder.refundRequest.reasonOptionLabel || selectedRefundOrder.refundRequest.reason}</p>
                {selectedRefundOrder.refundRequest.customReason && <p>{selectedRefundOrder.refundRequest.customReason}</p>}
              </div>
              {selectedRefundOrder.refundRequest.rejectionReason && (
                <div className="review-refund-detail-section review-refund-detail-rejected">
                  <h5>驳回原因</h5>
                  <p>{selectedRefundOrder.refundRequest.rejectionReason}</p>
                </div>
              )}
              {selectedRefundOrder.refundRequest.processedAt && (
                <div className="review-refund-detail-section">
                  <h5>处理记录</h5>
                  <p>处理时间：{new Date(selectedRefundOrder.refundRequest.processedAt).toLocaleString()}</p>
                  <p>处理结果：{refundStatusMap[(selectedRefundOrder.refundRequest.status || 'pending') as RefundStatusKey].label}</p>
                </div>
              )}
              {selectedRefundOrder.refundRequest.status === 'pending' && (
                <div className="review-refund-detail-actions">
                  <button className="btn btn-outline" onClick={() => setSelectedRefundOrder(null)}>关闭</button>
                  <button className="btn btn-danger" onClick={() => { setSelectedRefundOrder(null); setRefundRejectOrder(selectedRefundOrder); setRefundRejectionReason(''); }}>驳回申请</button>
                  <button className="btn btn-primary" onClick={() => { setSelectedRefundOrder(null); handleApproveRefund(selectedRefundOrder); }}>同意退款</button>
                </div>
              )}
            </div>
          </div>
        </div>
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
