import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Clock,
  CreditCard,
  Package,
  CheckCircle,
  AlertCircle,
  XCircle,
  MapPin,
  Truck,
  FileText,
  ExternalLink,
  ShoppingBag,
  X,
  Copy,
  Star,
  User,
  Phone,
  Calendar,
  MessageCircle,
  CreditCard as PayIcon,
} from 'lucide-react';
import { orderApi } from '../api/order';
import { biographerApi } from '../api/biographer';
import type { Order, Biographer, BiographerOrder, RefundReasonOption } from '../mocks/types';
import { refundReasonApi } from '../api/refundReason';
import { paymentApi } from '../api/payment';
import { useToast } from '../hooks/useToast';
import Annotate from '../components/annotation/Annotate';
import './MyOrders.css';

const statusOptions: Array<{ value: Order['status'] | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'pending_pay', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'delivering', label: '服务中' },
  { value: 'completed', label: '已完成' },
  { value: 'refunded', label: '已退款' },
  { value: 'closed', label: '已关闭' },
];

const typeOptions: Array<{ value: Order['type'] | 'all'; label: string }> = [
  { value: 'all', label: '全部类型' },
  { value: 'book', label: '实体书' },
  { value: 'derivative', label: '衍生品' },
  { value: 'qrcode', label: '二维码' },
  { value: 'video', label: '纪念视频' },
  { value: 'digital_person', label: '数字人' },
  { value: 'biography', label: '传记服务' },
  { value: 'biographer_service', label: '传记师服务' },
];

const statusMap: Record<Order['status'], { label: string; className: string; icon: typeof Clock }> = {
  pending_pay: { label: '待支付', className: 'my-order-status-pending', icon: Clock },
  paid: { label: '已支付', className: 'my-order-status-paid', icon: CreditCard },
  delivering: { label: '服务中', className: 'my-order-status-delivering', icon: Package },
  completed: { label: '已完成', className: 'my-order-status-completed', icon: CheckCircle },
  refunded: { label: '已退款', className: 'my-order-status-refunded', icon: AlertCircle },
  closed: { label: '已关闭', className: 'my-order-status-closed', icon: XCircle },
};

const typeLabelMap: Record<Order['type'], string> = {
  biography: '传记服务',
  digital_person: '数字人',
  video: '纪念视频',
  qrcode: '二维码',
  book: '实体书',
  biographer_service: '传记师服务',
  group_buy: '团购',
  derivative: '衍生品',
};

const deliverableTypeLabels: Record<string, string> = {
  pdf: 'PDF',
  video: '视频',
  qrcode: '二维码',
  link: '链接',
  image: '图片',
};

const bioStatusMap: Record<BiographerOrder['status'], { label: string; color: string }> = {
  pending_deposit: { label: '待付定金', color: '#d97706' },
  paid_deposit: { label: '已付定金', color: '#2563eb' },
  interview_scheduled: { label: '已预约采访', color: '#7c3aed' },
  draft_submitted: { label: '已提交初稿', color: '#2563eb' },
  modifying: { label: '修改中', color: '#d97706' },
  final_submitted: { label: '已提交终稿', color: '#2563eb' },
  paid_full: { label: '已付尾款', color: '#7c3aed' },
  completed: { label: '已完成', color: '#1B5E4B' },
  after_sales: { label: '售后中', color: '#ef4444' },
};

const bioProgressNodes = ['支付定金', '预约采访', '提交初稿', '修改完善', '支付尾款', '交付定稿'];

function formatCountdown(target: string): string {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return '已过期';
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function useCountdown() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

export default function MyOrders() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [bioOrders, setBioOrders] = useState<BiographerOrder[]>([]);
  const [biographers, setBiographers] = useState<Record<string, Biographer>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>(() => {
    const status = searchParams.get('status');
    return statusOptions.some((option) => option.value === status) ? (status as Order['status']) : 'all';
  });
  const [typeFilter, setTypeFilter] = useState<Order['type'] | 'all'>(() => {
    const t = searchParams.get('type');
    return typeOptions.some((o) => o.value === t) ? (t as Order['type']) : 'all';
  });
  const [selected, setSelected] = useState<Order | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [refundReasons, setRefundReasons] = useState<RefundReasonOption[]>([]);
  const [refundReasonOptionId, setRefundReasonOptionId] = useState('');
  const [refundCustomReason, setRefundCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useCountdown();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    setLoading(true);
    Promise.all([orderApi.list(), biographerApi.orders(), biographerApi.list(), refundReasonApi.list()])
      .then(([orderList, bioOrderList, bioList, refundReasonList]) => {
        setOrders(orderList);
        setBioOrders(bioOrderList);
        setRefundReasons(refundReasonList);
        const map: Record<string, Biographer> = {};
        bioList.forEach((b) => (map[b.id] = b));
        setBiographers(map);
      })
      .catch(() => {
        setOrders([]);
        setBioOrders([]);
        setBiographers({});
        setRefundReasons([]);
      })
      .finally(() => setLoading(false));
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchType = typeFilter === 'all' || o.type === typeFilter;
      return matchStatus && matchType;
    });
  }, [orders, statusFilter, typeFilter]);

  // 传记师订单：仅在「全部类型」或「传记师服务」下展示，不参与普通订单的状态筛选
  const visibleBioOrders = useMemo(() => {
    if (typeFilter !== 'all' && typeFilter !== 'biographer_service') return [];
    return bioOrders;
  }, [bioOrders, typeFilter]);

  const isBioType = typeFilter === 'biographer_service';

  const handlePay = async (order: Order) => {
    try {
      setPayingId(order.id);
      await paymentApi.pay(order.id, 'wechat');
      addToast('支付成功', 'success');
      loadOrders();
      navigate(`/order-success?orderId=${order.id}`);
    } catch (err: any) {
      addToast(err.message || '支付失败', 'error');
    } finally {
      setPayingId(null);
    }
  };

  const copyOrderId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => addToast('订单号已复制', 'success'));
  };

  const handleReview = async () => {
    if (!reviewOrder) return;
    if (!reviewContent.trim()) {
      addToast('请填写评价内容', 'error');
      return;
    }
    try {
      setSubmitting(true);
      await orderApi.review(reviewOrder.id, { rating, content: reviewContent.trim(), status: 'pending', createdAt: new Date().toISOString() });
      addToast('评价已提交', 'success');
      setReviewOrder(null);
      setRating(5);
      setReviewContent('');
      loadOrders();
    } catch (err: any) {
      addToast(err.message || '评价失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openRefund = (order: Order) => {
    setRefundOrder(order);
    setRefundReasonOptionId('');
    setRefundCustomReason('');
  };

  const handleRefund = async () => {
    if (!refundOrder) return;
    const selectedReason = refundReasons.find((reason) => reason.id === refundReasonOptionId);
    if (!selectedReason) {
      addToast('请选择退款原因', 'error');
      return;
    }
    const customReason = refundCustomReason.trim();
    if (selectedReason.isOther && !customReason) {
      addToast('请填写其他退款原因', 'error');
      return;
    }
    if (customReason.length > 500) {
      addToast('退款原因不能超过 500 个字', 'error');
      return;
    }
    try {
      setSubmitting(true);
      await orderApi.refund(refundOrder.id, {
        reason: selectedReason.label,
        reasonOptionId: selectedReason.id,
        reasonOptionLabel: selectedReason.label,
        customReason: selectedReason.isOther ? customReason : undefined,
        createdAt: new Date().toISOString(),
      });
      addToast('退款申请已提交，等待平台审核', 'success');
      setRefundOrder(null);
      setRefundReasonOptionId('');
      setRefundCustomReason('');
      setSelected(null);
      loadOrders();
    } catch (err: any) {
      addToast(err.message || '退款失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const canRefund = (order: Order) =>
    ['paid', 'delivering'].includes(order.status) &&
    (!order.refundRequest || order.refundRequest.status === 'rejected');
  const canReview = (order: Order) => order.status === 'completed' && !order.review;

  return (
    <div className="my-orders-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">我的订单</h1>
          <p className="page-subtitle">查看全部商品与服务订单</p>
        </div>
      </header>

      <div className="card my-order-list-card">
        <div className="card-header my-order-list-header">
          <Annotate id="my-orders.filters" inline>
          <div className="my-order-filters">
            {!isBioType && (
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Order['status'] | 'all')}>
                {statusOptions.map((s) => (
                  <option value={s.value} key={s.value}>{s.label}</option>
                ))}
              </select>
            )}
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as Order['type'] | 'all')}>
              {typeOptions.map((t) => (
                <option value={t.value} key={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          </Annotate>
        </div>
        <Annotate id="my-orders.order-list">
        <div className="card-body my-order-list-body">
          {loading ? (
            <div className="my-order-empty">加载中…</div>
          ) : filtered.length === 0 && visibleBioOrders.length === 0 ? (
            isBioType ? (
              <div className="my-order-empty">
                <MessageCircle size={40} color="#d1d5db" />
                <p>暂无传记师订单</p>
                <button className="btn btn-primary" onClick={() => navigate('/biographers')}>去找传记师预约</button>
              </div>
            ) : (
              <div className="my-order-empty">
                <ShoppingBag size={40} color="#d1d5db" />
                <p>暂无符合条件的订单</p>
                <button className="btn btn-primary" onClick={() => navigate('/store')}>去商城逛逛</button>
              </div>
            )
          ) : (
            <div className="my-order-list">
              {filtered.map((order) => {
                const status = statusMap[order.status];
                const StatusIcon = status.icon;
                const isExpired = order.status === 'pending_pay' && order.expireAt ? new Date(order.expireAt) < new Date() : false;
                const canPay = order.status === 'pending_pay' && !isExpired;
                return (
                  <div className="my-order-item" key={order.id}>
                    <div className="my-order-item-header">
                      <div className="my-order-item-meta">
                        <span className="my-order-item-time">{new Date(order.createdAt).toLocaleString()}</span>
                        <span className="my-order-item-type">{typeLabelMap[order.type]}</span>
                        {order.status === 'pending_pay' && order.expireAt && (
                          <span className={`my-order-countdown ${isExpired ? 'expired' : ''}`}>
                            <Clock size={10} /> {isExpired ? '已过期' : `剩 ${formatCountdown(order.expireAt)}`}
                          </span>
                        )}
                      </div>
                      <span className={`my-order-status ${status.className}`}>
                        <StatusIcon size={12} /> {status.label}
                      </span>
                    </div>
                    <div className="my-order-item-main">
                      <div className="my-order-item-mark" aria-hidden="true">
                        <Package size={18} />
                      </div>
                      <div className="my-order-item-product">
                        <div className="my-order-item-name">
                          {order.productName}
                          {(order.quantity ?? 1) > 1 && <span className="my-order-item-qty">×{order.quantity} 份</span>}
                        </div>
                        {order.sku && <div className="my-order-item-sku">{order.sku}</div>}
                      </div>
                      <div className="my-order-item-total">
                        <span className="my-order-item-total-label">订单金额</span>
                        <span className="my-order-item-amount">¥{order.amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="my-order-item-footer">
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelected(order)}>查看详情</button>
                      {canReview(order) && (
                        <button className="btn btn-outline btn-sm" onClick={() => { setReviewOrder(order); setRating(5); setReviewContent(''); }}>
                          <Star size={12} /> 评价
                        </button>
                      )}
                      {canRefund(order) && (
                        <button className="btn btn-outline btn-sm" onClick={() => openRefund(order)}>
                          申请退款
                        </button>
                      )}
                      {canPay && (
                        <button className="btn btn-primary btn-sm" disabled={payingId === order.id} onClick={() => handlePay(order)}>
                          <PayIcon size={12} /> {payingId === order.id ? '支付中…' : '去支付'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {visibleBioOrders.map((o) => {
                const bio = biographers[o.biographerId];
                const doneCount = o.progress.filter((p) => p.status === 'done').length;
                const progressPct = Math.round((doneCount / bioProgressNodes.length) * 100);
                return (
                  <div className="my-bio-order-item" key={o.id}>
                    <div className="my-bio-order-main">
                      <div className="my-bio-order-info">
                        <div className="my-bio-order-service">{o.serviceName}</div>
                        {bio && (
                          <div className="my-bio-order-bio">
                            <User size={12} /> 传记师：{bio.name} · {(bio.rating || 5).toFixed(1)} 分
                          </div>
                        )}
                        <div className="my-bio-order-meta">
                          <span><Phone size={12} /> 订单号 {o.id.slice(-8)}</span>
                          <span>订单金额 ¥{o.amount.toLocaleString()}</span>
                          <span>定金 ¥{o.deposit.toLocaleString()}</span>
                        </div>
                        {o.schedule?.time && (
                          <div className="my-bio-order-schedule">
                            <Calendar size={12} /> {o.schedule.time}
                            <MapPin size={12} /> {o.schedule.address}
                          </div>
                        )}
                      </div>
                      <div
                        className="my-bio-order-status"
                        style={{ '--bio-status-color': bioStatusMap[o.status].color } as React.CSSProperties}
                      >
                        {bioStatusMap[o.status].label}
                      </div>
                    </div>

                    <div className="my-bio-order-progress">
                      <div className="my-bio-order-progress-header">
                        <span>服务进度</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="my-bio-order-progress-track">
                        <div className="my-bio-order-progress-fill" style={{ width: `${progressPct}%` }} />
                      </div>
                      <div className="my-bio-order-progress-nodes">
                        {bioProgressNodes.map((node) => {
                          const p = o.progress.find((x) => x.node === node);
                          const done = p?.status === 'done';
                          return (
                            <div key={node} className={`my-bio-order-progress-node ${done ? 'done' : ''}`}>
                              <div className="my-bio-order-progress-dot">{done && <CheckCircle size={10} />}</div>
                              <span>{node}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </Annotate>
      </div>

      {selected && (
        <Annotate id="my-orders.detail-modal">
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content my-order-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>订单详情</h4>
              <button className="modal-close" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="my-order-detail-row">
                <span>订单号</span>
                <span className="my-order-detail-id">
                  {selected.id}
                  <button className="my-order-copy-btn" onClick={() => copyOrderId(selected.id)}><Copy size={12} /></button>
                </span>
              </div>
              <div className="my-order-detail-row">
                <span>商品</span>
                <span>{selected.productName}{(selected.quantity ?? 1) > 1 ? ` ×${selected.quantity} 份` : ''}</span>
              </div>
              <div className="my-order-detail-row">
                <span>类型</span>
                <span>{typeLabelMap[selected.type]}</span>
              </div>
              <div className="my-order-detail-row">
                <span>金额</span>
                <span className="my-order-detail-amount">¥{selected.amount.toLocaleString()}</span>
              </div>
              <div className="my-order-detail-row">
                <span>状态</span>
                <span className={`my-order-status ${statusMap[selected.status].className}`}>
                  {statusMap[selected.status].label}
                </span>
              </div>
              <div className="my-order-detail-row">
                <span>下单时间</span>
                <span>{new Date(selected.createdAt).toLocaleString()}</span>
              </div>
              {selected.payTime && (
                <div className="my-order-detail-row">
                  <span>支付时间</span>
                  <span>{new Date(selected.payTime).toLocaleString()}</span>
                </div>
              )}
              {selected.remark && (
                <div className="my-order-detail-row">
                  <span>备注</span>
                  <span className="my-order-detail-remark">{selected.remark}</span>
                </div>
              )}

              {selected.address && (
                <div className="my-order-detail-section">
                  <h5><MapPin size={14} /> 收货地址</h5>
                  <div className="my-order-detail-row">
                    <span>收件人</span>
                    <span>{selected.address.name} {selected.address.phone}</span>
                  </div>
                  <div className="my-order-detail-row">
                    <span>地址</span>
                    <span>{selected.address.province}{selected.address.city}{selected.address.district}{selected.address.detail}</span>
                  </div>
                </div>
              )}

              {selected.logistics && (
                <div className="my-order-detail-section">
                  <h5><Truck size={14} /> 物流信息</h5>
                  <div className="my-order-detail-row">
                    <span>物流公司</span>
                    <span>{selected.logistics.company}</span>
                  </div>
                  <div className="my-order-detail-row">
                    <span>运单号</span>
                    <span className="my-order-detail-id">{selected.logistics.trackingNo}</span>
                  </div>
                  <div className="my-order-detail-row">
                    <span>发货时间</span>
                    <span>{new Date(selected.logistics.shippedAt).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {selected.deliverables && selected.deliverables.length > 0 && (
                <div className="my-order-detail-section">
                  <h5><FileText size={14} /> 交付物</h5>
                  <div className="my-order-deliverable-list">
                    {selected.deliverables.map((d, idx) => (
                      <div className="my-order-deliverable-item" key={idx}>
                        <div>
                          <div className="my-order-deliverable-name">{d.name}</div>
                          <div className="my-order-deliverable-type">{deliverableTypeLabels[d.type] || d.type} · {new Date(d.createdAt).toLocaleString()}</div>
                        </div>
                        <a className="my-order-deliverable-link" href={d.url} target="_blank" rel="noreferrer"><ExternalLink size={12} /> 查看</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.review && (
                <div className="my-order-detail-section">
                  <h5><Star size={14} /> 我的评价</h5>
                  <div className="my-order-review-stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < selected.review!.rating ? 'filled' : ''} />
                    ))}
                  </div>
                  <p className="my-order-review-content">{selected.review.content}</p>
                </div>
              )}

              {selected.refundRequest && (
                <div className="my-order-detail-section">
                  <h5>售后记录</h5>
                  <div className="my-order-refund-notice">
                    <strong>{selected.refundRequest.status === 'pending' ? '退款审核中' : selected.refundRequest.status === 'rejected' ? '退款申请已驳回' : '退款已完成'}</strong>
                    <span>{selected.refundRequest.status === 'pending' ? '平台正在审核，请耐心等待' : selected.refundRequest.status === 'rejected' ? '可修改原因后重新申请' : '平台审核通过，退款已完成'}</span>
                  </div>
                  <div className="my-order-detail-row">
                    <span>退款原因</span>
                    <span>{selected.refundRequest.reasonOptionLabel || selected.refundRequest.reason}</span>
                  </div>
                  {selected.refundRequest.customReason && (
                    <div className="my-order-detail-row">
                      <span>补充说明</span>
                      <span>{selected.refundRequest.customReason}</span>
                    </div>
                  )}
                  <div className="my-order-detail-row">
                    <span>申请时间</span>
                    <span>{new Date(selected.refundRequest.createdAt).toLocaleString()}</span>
                  </div>
                  {selected.refundRequest.rejectionReason && (
                    <div className="my-order-detail-row">
                      <span>驳回原因</span>
                      <span>{selected.refundRequest.rejectionReason}</span>
                    </div>
                  )}
                  {selected.refundRequest.processedAt && (
                    <div className="my-order-detail-row">
                      <span>处理时间</span>
                      <span>{new Date(selected.refundRequest.processedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="my-order-detail-actions">
                {selected.status === 'pending_pay' && (!selected.expireAt || new Date(selected.expireAt) > new Date()) ? (
                  <button className="btn btn-primary" style={{ flex: 1 }} disabled={payingId === selected.id} onClick={() => handlePay(selected)}>
                    <PayIcon size={14} /> {payingId === selected.id ? '支付中…' : '立即支付'}
                  </button>
                ) : null}
                {canReview(selected) && (
                  <button className="btn btn-outline" onClick={() => { setReviewOrder(selected); setRating(5); setReviewContent(''); }}>
                    <Star size={14} /> 评价
                  </button>
                )}
                {canRefund(selected) && (
                  <button className="btn btn-outline" onClick={() => openRefund(selected)}>
                    申请退款
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        </Annotate>
      )}

      {reviewOrder && (
        <Annotate id="my-orders.review-modal">
        <div className="modal-overlay" onClick={() => setReviewOrder(null)}>
          <div className="modal-content my-order-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>评价订单</h4>
              <button className="modal-close" onClick={() => setReviewOrder(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="my-order-review-product">{reviewOrder.productName}</div>
              <div className="my-order-review-stars interactive">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} className="my-order-star-btn" onClick={() => setRating(i + 1)}>
                    <Star size={24} className={i < rating ? 'filled' : ''} />
                  </button>
                ))}
              </div>
              <div className="form-row">
                <label>评价内容</label>
                <textarea
                  rows={4}
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="分享您的使用体验，帮助其他用户了解这项服务"
                />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={submitting} onClick={handleReview}>
                {submitting ? '提交中…' : '提交评价'}
              </button>
            </div>
          </div>
        </div>
        </Annotate>
      )}

      {refundOrder && (
        <Annotate id="my-orders.refund-modal">
        <div className="modal-overlay" onClick={() => setRefundOrder(null)}>
          <div className="modal-content my-order-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>申请退款</h4>
              <button className="modal-close" onClick={() => setRefundOrder(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="my-order-review-product">{refundOrder.productName}</div>
              <fieldset className="my-order-refund-options">
                <legend>退款原因</legend>
                {refundReasons.map((reason) => (
                  <label className={`my-order-refund-option ${refundReasonOptionId === reason.id ? 'selected' : ''}`} key={reason.id}>
                    <input
                      type="radio"
                      name="refund-reason"
                      value={reason.id}
                      checked={refundReasonOptionId === reason.id}
                      onChange={() => {
                        setRefundReasonOptionId(reason.id);
                        if (!reason.isOther) setRefundCustomReason('');
                      }}
                    />
                    <span>{reason.label}</span>
                  </label>
                ))}
              </fieldset>
              {refundReasons.find((reason) => reason.id === refundReasonOptionId)?.isOther && (
                <div className="my-order-refund-other">
                  <label htmlFor="refund-custom-reason">补充说明</label>
                  <textarea
                    id="refund-custom-reason"
                    rows={3}
                    maxLength={500}
                    value={refundCustomReason}
                    onChange={(e) => setRefundCustomReason(e.target.value)}
                    placeholder="请填写具体退款原因"
                  />
                  <span className="my-order-refund-counter">{refundCustomReason.length}/500</span>
                </div>
              )}
              <button className="btn btn-danger" style={{ width: '100%', marginTop: 8 }} disabled={submitting} onClick={handleRefund}>
                {submitting ? '处理中…' : '确认退款'}
              </button>
            </div>
          </div>
        </div>
        </Annotate>
      )}
    </div>
  );
}
