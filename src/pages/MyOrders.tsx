import BiographerServiceOrders from '../components/BiographerServiceOrders';
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
  CreditCard as PayIcon,
} from 'lucide-react';
import { biographerApi } from '../api/biographer';
import type { Order, Biographer, BiographerOrder, RefundReasonOption } from '../mocks/types';
import { paymentApi } from '../api/payment';
import { useToast } from '../hooks/useToast';
import { serviceStatusLabels, type ServiceOrder } from '../data/biographerServiceOrders';
import Annotate from '../components/annotation/Annotate';
import { defaultBiographers, defaultRefundReasonOptions } from '../mocks/data/seed';
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
  pending_schedule: { label: '待预约采访', color: '#d97706' },
  interview_scheduled: { label: '已预约采访', color: '#7c3aed' },
  draft_submitted: { label: '已提交初稿', color: '#2563eb' },
  modifying: { label: '修改中', color: '#d97706' },
  final_submitted: { label: '已提交终稿', color: '#2563eb' },
  completed: { label: '已完成', color: '#1B5E4B' },
  after_sales: { label: '售后中', color: '#ef4444' },
};

/** 订单页统一展示用的行数据。 */
interface UnifiedOrderRow {
  key: string;
  kind: 'normal' | 'bio' | 'service';
  orderId: string;
  typeLabel: string;
  name: string;
  sub: string;
  amount: number;
  statusLabel: string;
  statusClassName?: string;
  statusColor?: string;
  unifiedStatus: Order['status'];
  createdAt: string;
  normal?: Order;
  bio?: BiographerOrder;
  service?: ServiceOrder;
}

function formatCountdown(target: string): string {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return '已过期';
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function useCountdown() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

// 固定的订单页演示数据，不受当前账号或浏览器中已有订单影响。
const demoOrders: Order[] = [
  { id: 'ord_demo_001', userId: 'u_demo_current', type: 'biography', productId: 'prod_bio_standard', productName: '标准传记服务', amount: 1999, status: 'paid', payTime: '2026-09-06T10:20:00', createdAt: '2026-09-06T10:00:00', updatedAt: '2026-09-06T10:20:00' },
  { id: 'ord_demo_002', userId: 'u_demo_current', type: 'book', productId: 'prod_book_hardcover', productName: '张明远的传记 · 精装实体书', amount: 288, status: 'delivering', payTime: '2026-09-05T14:05:00', createdAt: '2026-09-05T14:00:00', updatedAt: '2026-09-06T09:30:00' },
  { id: 'ord_demo_003', userId: 'u_demo_current', type: 'qrcode', productId: 'prod_qrcode', productName: '家风纪念馆二维码', amount: 19.9, status: 'completed', payTime: '2026-09-03T16:40:00', createdAt: '2026-09-03T16:30:00', updatedAt: '2026-09-03T16:40:00' },
  { id: 'ord_demo_004', userId: 'u_demo_current', type: 'biographer_service', productId: 'svc_001', productName: '李传记 · 基础采访套餐', amount: 1999, status: 'paid', payTime: '2026-09-02T11:15:00', createdAt: '2026-09-02T11:00:00', updatedAt: '2026-09-02T11:15:00' },
  { id: 'ord_demo_005', userId: 'u_demo_current', type: 'video', productId: 'prod_video', productName: '家族纪念视频制作', amount: 1288, status: 'refunded', payTime: '2026-08-28T09:30:00', createdAt: '2026-08-28T09:00:00', updatedAt: '2026-08-29T15:00:00' },
];

const demoBiographerOrders: BiographerOrder[] = [
  {
    id: 'bio_order_demo_001', userId: 'u_demo_current', orderId: 'ord_demo_004', biographerId: 'bio_001', serviceId: 'svc_001', serviceName: '基础采访套餐', amount: 1999, status: 'interview_scheduled',
    schedule: { time: '2026-09-12 14:00', address: '线上视频采访' },
    progress: [{ node: '预约采访', status: 'done', time: '2026-09-03T10:00:00' }, { node: '提交初稿', status: 'pending' }, { node: '修改完善', status: 'pending' }, { node: '交付定稿', status: 'pending' }],
    createdAt: '2026-09-02T11:00:00', updatedAt: '2026-09-03T10:00:00',
  },
  {
    id: 'bio_order_demo_002', userId: 'u_demo_current', orderId: 'ord_demo_006', biographerId: 'bio_002', serviceId: 'svc_003', serviceName: '回忆录短篇版', amount: 1299, status: 'draft_submitted',
    schedule: { time: '2026-09-08 10:30', address: '上海市静安区客户家中' },
    progress: [{ node: '预约采访', status: 'done', time: '2026-08-25T10:00:00' }, { node: '提交初稿', status: 'done', time: '2026-09-05T16:00:00' }, { node: '修改完善', status: 'pending' }, { node: '交付定稿', status: 'pending' }],
    createdAt: '2026-08-24T09:30:00', updatedAt: '2026-09-05T16:00:00',
  },
];

const demoServiceOrders: ServiceOrder[] = [];

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
  const [selectedBioOrder, setSelectedBioOrder] = useState<BiographerOrder | null>(null);
  const [reviewedBioOrderIds, setReviewedBioOrderIds] = useState<Set<string>>(new Set());
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [refundReasons, setRefundReasons] = useState<RefundReasonOption[]>([]);
  const [refundReasonOptionId, setRefundReasonOptionId] = useState('');
  const [refundCustomReason, setRefundCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const serviceOrders = demoServiceOrders;
  const [serviceOrderId, setServiceOrderId] = useState<string | null>(null);
  useCountdown();

  const loadOrders = () => {
    setLoading(true);
    setOrders(demoOrders);
    setBioOrders(demoBiographerOrders);
    setRefundReasons(defaultRefundReasonOptions);
    const map: Record<string, Biographer> = {};
    defaultBiographers.filter((b) => b.status === 'approved').forEach((b) => (map[b.id] = b));
    setBiographers(map);
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(loadOrders, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const rows = useMemo<UnifiedOrderRow[]>(() => {
    const normalRows: UnifiedOrderRow[] = orders.map((o) => ({
      key: `normal_${o.id}`,
      kind: 'normal',
      orderId: o.id,
      typeLabel: typeLabelMap[o.type],
      name: o.productName,
      sub: '',
      amount: o.amount,
      statusLabel: statusMap[o.status].label,
      statusClassName: statusMap[o.status].className,
      unifiedStatus: o.status,
      createdAt: o.createdAt,
      normal: o,
    }));
    const bioRows: UnifiedOrderRow[] = bioOrders.map((o) => ({
      key: `bio_${o.id}`,
      kind: 'bio',
      orderId: o.orderId || o.id,
      typeLabel: '传记师服务',
      name: o.serviceName,
      sub: `传记师：${biographers[o.biographerId]?.name || '李传记'}`,
      amount: o.amount,
      statusLabel: bioStatusMap[o.status].label,
      statusColor: bioStatusMap[o.status].color,
      unifiedStatus: o.status === 'completed' ? 'completed' : 'delivering',
      createdAt: o.createdAt,
      bio: o,
    }));
    // 新版服务订单状态映射到统一状态口径：待接单/待付款→待支付，服务中→服务中
    const serviceStatusToUnified: Record<string, Order['status']> = {
      pending_accept: 'pending_pay',
      pending_pay: 'pending_pay',
      working: 'delivering',
      completed: 'completed',
      refunded: 'refunded',
      closed: 'closed',
    };
    const serviceRows: UnifiedOrderRow[] = serviceOrders.map((o) => ({
      key: `service_${o.id}`,
      kind: 'service',
      orderId: o.id,
      typeLabel: '传记师服务',
      name: o.service.name,
      sub: `传记师：${o.biographerName} · 传主：${o.requirements.interviewee || '待补充'}`,
      amount: o.amount,
      statusLabel: serviceStatusLabels[o.status] + (o.requests.some((r) => r.status === 'pending') ? ' · 平台处理中' : ''),
      unifiedStatus: serviceStatusToUnified[o.status] || 'delivering',
      createdAt: o.createdAt,
      service: o,
    }));
    return [...normalRows, ...bioRows, ...serviceRows]
      .filter((r) => statusFilter === 'all' || r.unifiedStatus === statusFilter)
      .filter((r) => {
        if (typeFilter === 'all') return true;
        if (typeFilter === 'biographer_service') return r.kind !== 'normal' || r.normal?.type === 'biographer_service';
        return r.kind === 'normal' && r.normal?.type === typeFilter;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, bioOrders, serviceOrders, biographers, statusFilter, typeFilter]);

  const handlePay = async (order: Order) => {
    try {
      setPayingId(order.id);
      await paymentApi.pay(order.id, 'wechat');
      addToast('支付成功', 'success');
      loadOrders();
      navigate(`/order-success?orderId=${order.id}`);
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : '支付失败', 'error');
    } finally {
      setPayingId(null);
    }
  };

  // 实体订单（实体书/衍生品）服务中可确认收货，确认后订单完成
  const handleConfirmReceipt = (order: Order) => {
    setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status: 'completed', updatedAt: new Date().toISOString() } : item));
    addToast('已确认收货，订单完成', 'success');
  };

  const copyOrderId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => addToast('订单号已复制', 'success'));
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
      const request = {
        reason: selectedReason.label,
        reasonOptionId: selectedReason.id,
        reasonOptionLabel: selectedReason.label,
        customReason: selectedReason.isOther ? customReason : undefined,
        createdAt: new Date().toISOString(),
        status: 'pending' as const,
      };
      setOrders((current) => current.map((item) => item.id === refundOrder.id ? { ...item, refundRequest: request } : item));
      addToast('退款申请已提交，等待平台审核', 'success');
      setRefundOrder(null);
      setRefundReasonOptionId('');
      setRefundCustomReason('');
      setSelected(null);
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : '退款失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const canRefund = (order: Order) =>
    ['paid', 'delivering'].includes(order.status) &&
    (!order.refundRequest || order.refundRequest.status === 'rejected');

  const openBioOrder = (order: BiographerOrder) => {
    setSelectedBioOrder(order);
    setReviewRating(5);
  };

  const submitBioReview = async () => {
    if (!selectedBioOrder) return;
    try {
      setReviewSubmitting(true);
      await biographerApi.submitReview(selectedBioOrder.id, {
        rating: reviewRating,
        content: '',
        tags: [],
      });
      setReviewedBioOrderIds((current) => new Set(current).add(selectedBioOrder.id));
      addToast('评价提交成功，感谢您的反馈', 'success');
      setSelectedBioOrder(null);
      loadOrders();
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : '评价提交失败', 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };


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
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Order['status'] | 'all')}>
              {statusOptions.map((s) => (
                <option value={s.value} key={s.value}>{s.label}</option>
              ))}
            </select>
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
          ) : rows.length === 0 ? (
            <div className="my-order-empty">
              <ShoppingBag size={40} color="#d1d5db" />
              <p>暂无符合条件的订单</p>
              <button className="btn btn-primary" onClick={() => navigate('/home')}>返回首页</button>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>订单号</th><th>类型</th><th>商品 / 服务</th><th>金额</th><th>状态</th><th>下单时间</th><th>操作</th></tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <td>{row.orderId}</td>
                      <td>{row.typeLabel}</td>
                      <td className="admin-table-text-left">{row.name}{row.sub && <><br /><small>{row.sub}</small></>}</td>
                      <td>¥{row.amount.toLocaleString()}</td>
                      <td>
                        <span
                          className={row.statusClassName ? `my-order-status ${row.statusClassName}` : undefined}
                          style={row.statusColor ? { color: row.statusColor, fontWeight: 600 } : undefined}
                        >
                          {row.statusLabel}
                        </span>
                        {row.kind === 'normal' && row.normal?.status === 'pending_pay' && row.normal.expireAt && (
                          <small style={{ display: 'block', color: '#9ca3af' }}>
                            {new Date(row.normal.expireAt) < new Date() ? '已过期' : `剩 ${formatCountdown(row.normal.expireAt)}`}
                          </small>
                        )}
                      </td>
                      <td>{new Date(row.createdAt).toLocaleString()}</td>
                      <td>
                        {row.kind === 'normal' && row.normal && (
                          <>
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(row.normal!)}>查看详情</button>
                            {canRefund(row.normal) && <button className="btn btn-outline btn-sm" onClick={() => openRefund(row.normal!)}>申请退款</button>}
                            {row.normal.status === 'pending_pay' && (!row.normal.expireAt || new Date(row.normal.expireAt) > new Date()) && (
                              <button className="btn btn-primary btn-sm" disabled={payingId === row.normal.id} onClick={() => handlePay(row.normal!)}>
                                {payingId === row.normal.id ? '支付中…' : '去支付'}
                              </button>
                            )}
                            {row.normal.status === 'delivering' && ['book', 'derivative'].includes(row.normal.type) && (
                              <button className="btn btn-primary btn-sm" onClick={() => handleConfirmReceipt(row.normal!)}>确认收货</button>
                            )}
                          </>
                        )}
                        {row.kind === 'bio' && row.bio && (
                          <>
                            <button className="btn btn-ghost btn-sm" onClick={() => openBioOrder(row.bio!)}>查看详情</button>
                            {row.bio.status === 'completed' && (
                              reviewedBioOrderIds.has(row.bio.id) ? (
                                <span className="my-order-reviewed-label"><CheckCircle size={13} /> 已评价</span>
                              ) : (
                                <button className="btn btn-primary btn-sm" onClick={() => openBioOrder(row.bio!)}>去评价</button>
                              )
                            )}
                          </>
                        )}
                        {row.kind === 'service' && (
                          <button className="btn btn-primary btn-sm" onClick={() => setServiceOrderId(row.orderId)}>查看服务订单</button>
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

      {serviceOrderId && <BiographerServiceOrders role="customer" detailOnly selectedOrderId={serviceOrderId} onCloseDetail={() => setServiceOrderId(null)} />}

      {selectedBioOrder && (
        <div className="modal-overlay" onClick={() => setSelectedBioOrder(null)}>
          <div className="modal-content my-order-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h4>传记师订单详情</h4>
              <button className="modal-close" onClick={() => setSelectedBioOrder(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="my-order-detail-row"><span>服务</span><span>{selectedBioOrder.serviceName}</span></div>
              <div className="my-order-detail-row"><span>传记师</span><span>{biographers[selectedBioOrder.biographerId]?.name || '李传记'}</span></div>
              <div className="my-order-detail-row"><span>订单状态</span><span className="my-order-status my-order-status-completed">已完成</span></div>
              <div className="my-order-detail-row"><span>订单金额</span><span className="my-order-detail-amount">¥{selectedBioOrder.amount.toLocaleString()}</span></div>
              <div className="my-order-detail-section">
                <h5><CheckCircle size={14} /> 服务进度</h5>
                <p className="my-order-detail-remark">采访、初稿、修改和终稿均已完成。演示资料：本订单专用于体验评价流程。</p>
              </div>
              {reviewedBioOrderIds.has(selectedBioOrder.id) ? (
                <div className="my-order-review-notice"><CheckCircle size={15} /> 该订单已完成评价</div>
              ) : (
                <div className="my-order-detail-section">
                  <h5><Star size={14} /> 评价服务</h5>
                  <div className="my-order-review-stars interactive" role="radiogroup" aria-label="服务评分">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button type="button" key={score} aria-label={`${score} 星`} aria-pressed={reviewRating === score} onClick={() => setReviewRating(score)}>
                        <Star size={24} className={score <= reviewRating ? 'filled' : ''} />
                      </button>
                    ))}
                  </div>
                  <div className="my-order-detail-actions">
                    <button className="btn btn-outline" onClick={() => setSelectedBioOrder(null)}>暂不评价</button>
                    <button className="btn btn-primary" disabled={reviewSubmitting} onClick={submitBioReview}>{reviewSubmitting ? '提交中…' : '提交评价'}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                <span>{selected.productName}</span>
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
