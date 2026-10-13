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
  User,
  Search,
  RotateCcw,
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

const bioProgressNodes = ['预约采访', '提交初稿', '修改完善', '交付定稿'];

const PAGE_SIZE = 10;

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

// 页面演示兜底：即使当前浏览器没有初始化订单或切换了演示账号，也始终能看到完整样例。
const demoOrders: Order[] = [
  { id: 'ord_demo_001', userId: 'u_demo_current', type: 'biography', productId: 'prod_bio_standard', productName: '标准传记服务', amount: 1999, status: 'paid', payTime: '2026-09-06T10:20:00', createdAt: '2026-09-06T10:00:00', updatedAt: '2026-09-06T10:20:00' },
  { id: 'ord_demo_002', userId: 'u_demo_current', type: 'book', productId: 'prod_book_hardcover', productName: '张明远的传记 · 精装实体书', amount: 288, quantity: 2, status: 'delivering', payTime: '2026-09-05T14:05:00', createdAt: '2026-09-05T14:00:00', updatedAt: '2026-09-06T09:30:00' },
  { id: 'ord_demo_003', userId: 'u_demo_current', type: 'qrcode', productId: 'prod_qrcode', productName: '家风纪念馆二维码', amount: 19.9, status: 'completed', payTime: '2026-09-03T16:40:00', createdAt: '2026-09-03T16:30:00', updatedAt: '2026-09-03T16:40:00' },
  { id: 'ord_demo_004', userId: 'u_demo_current', type: 'biographer_service', productId: 'svc_001', productName: '李传记 · 基础采访套餐', amount: 1999, status: 'paid', payTime: '2026-09-02T11:15:00', createdAt: '2026-09-02T11:00:00', updatedAt: '2026-09-02T11:15:00' },
  { id: 'ord_demo_005', userId: 'u_demo_current', type: 'video', productId: 'prod_video', productName: '家族纪念视频制作', amount: 1288, status: 'refunded', payTime: '2026-08-28T09:30:00', createdAt: '2026-08-28T09:00:00', updatedAt: '2026-08-29T15:00:00' },
  { id: 'ord_demo_006', userId: 'u_demo_current', type: 'biographer_service', productId: 'svc_003', productName: '王传记 · 回忆录短篇版', amount: 1299, status: 'delivering', payTime: '2026-08-24T09:45:00', createdAt: '2026-08-24T09:30:00', updatedAt: '2026-08-24T09:45:00' },
  { id: 'ord_demo_007', userId: 'u_demo_current', type: 'book', productId: 'prod_book_hardcover', productName: '家风传记 · 精装实体书', amount: 288, quantity: 1, status: 'pending_pay', expireAt: '2027-12-31T23:59:59', createdAt: '2026-09-07T10:00:00', updatedAt: '2026-09-07T10:00:00' },
  { id: 'ord_demo_008', userId: 'u_demo_current', type: 'derivative', productId: 'prod_deriv_badge', productName: '家徽定制徽章', amount: 69, status: 'paid', payTime: '2026-09-06T20:10:00', createdAt: '2026-09-06T20:00:00', updatedAt: '2026-09-06T20:10:00' },
  { id: 'ord_demo_009', userId: 'u_demo_current', type: 'digital_person', productId: 'prod_digital_person', productName: '数字人定制（标准版）', amount: 999, status: 'delivering', payTime: '2026-09-05T09:15:00', createdAt: '2026-09-05T09:00:00', updatedAt: '2026-09-06T11:00:00' },
  { id: 'ord_demo_010', userId: 'u_demo_current', type: 'video', productId: 'prod_video', productName: '家族纪念视频制作', amount: 999, status: 'completed', payTime: '2026-09-01T15:40:00', createdAt: '2026-09-01T15:30:00', updatedAt: '2026-09-04T10:00:00', deliverables: [{ type: 'video', name: '家族纪念视频成片', url: '#', createdAt: '2026-09-04T10:00:00' }] },
  { id: 'ord_demo_011', userId: 'u_demo_current', type: 'qrcode', productId: 'prod_qrcode', productName: '纪念物二维码', amount: 29.9, status: 'closed', createdAt: '2026-08-30T11:00:00', updatedAt: '2026-08-30T11:30:00' },
  { id: 'ord_demo_012', userId: 'u_demo_current', type: 'biography', productId: 'prod_bio_standard', productName: '标准传记服务', amount: 1999, status: 'refunded', payTime: '2026-08-26T14:10:00', createdAt: '2026-08-26T14:00:00', updatedAt: '2026-08-28T09:00:00', refundRequest: { reason: '不需要该商品', reasonOptionLabel: '不需要该商品', status: 'completed', createdAt: '2026-08-27T10:00:00', processedAt: '2026-08-28T09:00:00' } },
  { id: 'ord_demo_013', userId: 'u_demo_current', type: 'book', productId: 'prod_book_hardcover', productName: '张明远的传记 · 精装实体书', amount: 864, quantity: 3, status: 'delivering', payTime: '2026-09-04T16:05:00', createdAt: '2026-09-04T16:00:00', updatedAt: '2026-09-05T10:00:00', address: { name: '张先生', phone: '138****8003', province: '浙江省', city: '杭州市', district: '西湖区', detail: '文三路 100 号' }, logistics: { company: '顺丰速运', trackingNo: 'SF20260905001', shippedAt: '2026-09-05T10:00:00' } },
  { id: 'ord_demo_014', userId: 'u_demo_current', type: 'derivative', productId: 'prod_deriv_scarf', productName: '姓氏图腾丝巾', amount: 129, status: 'completed', payTime: '2026-08-25T13:20:00', createdAt: '2026-08-25T13:10:00', updatedAt: '2026-08-30T09:00:00' },
  { id: 'ord_demo_015', userId: 'u_demo_current', type: 'biographer_service', productId: 'svc_002', productName: '李传记 · 深度采访套餐', amount: 3999, status: 'paid', payTime: '2026-09-07T09:15:00', createdAt: '2026-09-07T09:00:00', updatedAt: '2026-09-07T09:15:00' },
  { id: 'ord_demo_016', userId: 'u_demo_current', type: 'digital_person', productId: 'prod_digital_person_pro', productName: '数字人定制（高级版）', amount: 1999, status: 'completed', payTime: '2026-08-20T10:40:00', createdAt: '2026-08-20T10:30:00', updatedAt: '2026-08-28T15:00:00' },
  { id: 'ord_demo_017', userId: 'u_demo_current', type: 'biography', productId: 'prod_bio_pdf', productName: '家族传记 · 下载 PDF', amount: 9.9, status: 'completed', payTime: '2026-08-18T08:40:00', createdAt: '2026-08-18T08:30:00', updatedAt: '2026-08-18T08:40:00', deliverables: [{ type: 'pdf', name: '家族传记.pdf', url: '#', createdAt: '2026-08-18T08:40:00' }] },
  { id: 'ord_demo_018', userId: 'u_demo_current', type: 'qrcode', productId: 'prod_qrcode', productName: '家风纪念馆二维码', amount: 19.9, status: 'paid', payTime: '2026-09-03T19:10:00', createdAt: '2026-09-03T19:00:00', updatedAt: '2026-09-03T19:10:00' },
  { id: 'ord_demo_019', userId: 'u_demo_current', type: 'book', productId: 'prod_book_paperback', productName: '家风传记 · 平装实体书', amount: 118, quantity: 2, status: 'completed', payTime: '2026-08-15T14:20:00', createdAt: '2026-08-15T14:10:00', updatedAt: '2026-08-22T10:00:00', address: { name: '张先生', phone: '138****8003', province: '浙江省', city: '杭州市', district: '西湖区', detail: '文三路 100 号' } },
  { id: 'ord_demo_020', userId: 'u_demo_current', type: 'derivative', productId: 'prod_deriv_calligraphy', productName: '家训书法作品', amount: 199, status: 'closed', createdAt: '2026-08-10T09:00:00', updatedAt: '2026-08-10T09:30:00' },
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

export default function MyOrders() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [bioOrders, setBioOrders] = useState<BiographerOrder[]>([]);
  const [biographers, setBiographers] = useState<Record<string, Biographer>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>(() => {
    const status = searchParams.get('status');
    return statusOptions.some((option) => option.value === status) ? (status as Order['status']) : 'all';
  });
  const [typeFilter, setTypeFilter] = useState<Order['type'] | 'all'>(() => {
    const t = searchParams.get('type');
    return typeOptions.some((o) => o.value === t) ? (t as Order['type']) : 'all';
  });
  // 草稿条件：输入只改草稿，点击「查询」后才应用到实际筛选；初始值与 URL 参数初始化结果保持一致
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftStatus, setDraftStatus] = useState<Order['status'] | 'all'>(statusFilter);
  const [draftType, setDraftType] = useState<Order['type'] | 'all'>(typeFilter);
  const [selected, setSelected] = useState<Order | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
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
        const visibleOrders = orderList.length > 0 ? orderList : demoOrders;
        const visibleBioOrders = bioOrderList.length > 0 ? bioOrderList : demoBiographerOrders;
        const visibleBiographers = bioList.length > 0 ? bioList : defaultBiographers.filter((b) => b.status === 'approved');
        setOrders(visibleOrders);
        setBioOrders(visibleBioOrders);
        setRefundReasons(refundReasonList.length > 0 ? refundReasonList : defaultRefundReasonOptions);
        const map: Record<string, Biographer> = {};
        visibleBiographers.forEach((b) => (map[b.id] = b));
        setBiographers(map);
      })
      .catch(() => {
        setOrders(demoOrders);
        setBioOrders(demoBiographerOrders);
        setRefundReasons(defaultRefundReasonOptions);
        const map: Record<string, Biographer> = {};
        defaultBiographers.filter((b) => b.status === 'approved').forEach((b) => (map[b.id] = b));
        setBiographers(map);
      })
      .finally(() => setLoading(false));
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchKeyword = !keyword || o.id.includes(keyword) || o.productName.includes(keyword);
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchType = typeFilter === 'all' || o.type === typeFilter;
      return matchKeyword && matchStatus && matchType;
    });
  }, [orders, keyword, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  // 传记师订单：仅在「全部类型」或「传记师服务」下展示，不参与普通订单的状态筛选
  const visibleBioOrders = useMemo(() => {
    if (typeFilter !== 'all' && typeFilter !== 'biographer_service') return [];
    return bioOrders;
  }, [bioOrders, typeFilter]);

  const isBioType = typeFilter === 'biographer_service';

  const applyFilters = () => {
    setKeyword(draftKeyword);
    setStatusFilter(draftStatus);
    setTypeFilter(draftType);
    setPage(1);
  };

  const resetFilters = () => {
    setDraftKeyword('');
    setDraftStatus('all');
    setDraftType('all');
    setKeyword('');
    setStatusFilter('all');
    setTypeFilter('all');
    setPage(1);
  };

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

  return (
    <div className="my-orders-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">我的订单</h1>
          <p className="page-subtitle">查看全部商品与服务订单</p>
        </div>
      </header>

      {(typeFilter === 'all' || typeFilter === 'biographer_service') && <BiographerServiceOrders role="customer" />}

      <div className="card my-order-list-card">
        <div className="card-header my-order-list-header">
          <Annotate id="my-orders.filters" inline>
          <div className="my-order-filters">
            <div className="my-order-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="搜索订单号或商品名称"
                value={draftKeyword}
                onChange={(e) => setDraftKeyword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
              />
            </div>
            {!isBioType && (
              <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value as Order['status'] | 'all')}>
                {statusOptions.map((s) => (
                  <option value={s.value} key={s.value}>{s.label}</option>
                ))}
              </select>
            )}
            <select value={draftType} onChange={(e) => setDraftType(e.target.value as Order['type'] | 'all')}>
              {typeOptions.map((t) => (
                <option value={t.value} key={t.value}>{t.label}</option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" onClick={applyFilters}>
              <Search size={13} /> 查询
            </button>
            <button className="btn btn-outline btn-sm" onClick={resetFilters}>
              <RotateCcw size={13} /> 重置
            </button>
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
                <button className="btn btn-primary" onClick={() => navigate('/home')}>返回首页</button>
              </div>
            )
          ) : (
            <>
              {filtered.length > 0 && (
                <>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>订单号</th>
                          <th>下单时间</th>
                          <th>类型</th>
                          <th>商品/服务</th>
                          <th>金额</th>
                          <th>状态</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paged.map((order) => {
                        const status = statusMap[order.status];
                        const StatusIcon = status.icon;
                        const isExpired = order.status === 'pending_pay' && order.expireAt ? new Date(order.expireAt) < new Date() : false;
                        const canPay = order.status === 'pending_pay' && !isExpired;
                        return (
                          <tr key={order.id}>
                            <td className="my-order-cell-id">{order.id}</td>
                            <td className="my-order-cell-time">{new Date(order.createdAt).toLocaleString()}</td>
                            <td>{typeLabelMap[order.type]}</td>
                            <td className="admin-table-text-left my-order-cell-product">
                              <div className="my-order-cell-product-name">
                                {order.productName}
                                {(order.quantity ?? 1) > 1 && <span className="my-order-cell-product-qty">×{order.quantity} 份</span>}
                              </div>
                              {order.sku && <div className="my-order-cell-product-sku">{order.sku}</div>}
                            </td>
                            <td className="my-order-cell-amount">¥{order.amount.toLocaleString()}</td>
                            <td>
                              <span className="my-order-cell-status">
                                <span className={`my-order-status ${status.className}`}>
                                  <StatusIcon size={12} /> {status.label}
                                </span>
                                {order.status === 'pending_pay' && order.expireAt && (
                                  <span className={`my-order-countdown ${isExpired ? 'expired' : ''}`}>
                                    <Clock size={10} /> {isExpired ? '已过期' : `剩 ${formatCountdown(order.expireAt)}`}
                                  </span>
                                )}
                              </span>
                            </td>
                            <td>
                              <button className="admin-table-link" onClick={() => setSelected(order)}>查看详情</button>
                              {canRefund(order) && (
                                <button className="admin-table-link" onClick={() => openRefund(order)}>申请退款</button>
                              )}
                              {canPay && (
                                <button className="admin-table-link" disabled={payingId === order.id} onClick={() => handlePay(order)}>
                                  {payingId === order.id ? '支付中…' : '去支付'}
                                </button>
                              )}
                            </td>
                            </tr>
                        );
                      })}
                      </tbody>
                    </table>
                  </div>
                  <div className="my-order-pagination">
                    <span className="my-order-pagination-total">共 {filtered.length} 条</span>
                    <div className="my-order-pagination-actions">
                      <button className="my-order-pagination-btn" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>上一页</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          className={`my-order-pagination-btn ${p === currentPage ? 'active' : ''}`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      ))}
                      <button className="my-order-pagination-btn" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>下一页</button>
                    </div>
                  </div>
                </>
              )}
              {visibleBioOrders.length > 0 && (
                <>
                  <div className="my-bio-order-table-title">传记师服务订单</div>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>服务名称</th>
                          <th>传记师</th>
                          <th>订单号</th>
                          <th>金额</th>
                          <th>采访安排</th>
                          <th>服务进度</th>
                          <th>状态</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleBioOrders.map((o) => {
                          const bio = biographers[o.biographerId];
                          const doneCount = o.progress.filter((p) => p.status === 'done').length;
                          const progressPct = Math.round((doneCount / bioProgressNodes.length) * 100);
                          const linkedOrder = orders.find((ord) => ord.id === o.orderId);
                          return (
                            <tr key={o.id}>
                              <td className="admin-table-text-left">{o.serviceName}</td>
                              <td>
                                {bio ? (
                                  <span className="my-bio-cell-bio">
                                    <User size={12} /> {bio.name} · {(bio.rating || 5).toFixed(1)} 分
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="my-order-cell-id">{o.id.slice(-8)}</td>
                              <td className="my-order-cell-amount">¥{o.amount.toLocaleString()}</td>
                              <td>
                                {o.schedule?.time ? (
                                  <span className="my-bio-cell-schedule">
                                    <span><Calendar size={12} /> {o.schedule.time}</span>
                                    <span><MapPin size={12} /> {o.schedule.address}</span>
                                  </span>
                                ) : '待安排'}
                              </td>
                              <td>
                                <span className="my-bio-progress">
                                  <span className="my-bio-progress-track">
                                    <span className="my-bio-progress-fill" style={{ width: `${progressPct}%` }} />
                                  </span>
                                  <span className="my-bio-progress-text">{doneCount}/{bioProgressNodes.length} · {progressPct}%</span>
                                </span>
                              </td>
                              <td>
                                <span
                                  className="my-bio-order-status"
                                  style={{ '--bio-status-color': bioStatusMap[o.status].color } as React.CSSProperties}
                                >
                                  {bioStatusMap[o.status].label}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="admin-table-link"
                                  disabled={!linkedOrder}
                                  title={linkedOrder ? undefined : '未找到关联订单'}
                                  onClick={() => linkedOrder && setSelected(linkedOrder)}
                                >
                                  查看详情
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
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
