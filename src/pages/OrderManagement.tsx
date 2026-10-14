import OrderServiceList from '../components/OrderServiceList';
import { readServiceOrders, SERVICE_ORDER_EVENT, serviceStatusLabels, type ServiceOrder, type ServiceStatus } from '../data/biographerServiceOrders';
import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, CreditCard, Package, CheckCircle, AlertCircle, Clock, XCircle, X, UserCheck, Calendar, MapPin, Truck, Download, RotateCcw } from 'lucide-react';
import type { AdminOrder } from '../api/order';
 type OrderManagementOrder = AdminOrder & { quantity?: number; sku?: string; remark?: string };
import { useToast } from '../hooks/useToast';
import type { BiographerOrder, OrderLogistics } from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import './OrderManagement.css';

const productTypeOptions: Array<{ value: OrderManagementOrder['type'] | 'all'; label: string }> = [
  { value: 'all', label: '全部类型' },
  { value: 'biography', label: '下载 PDF' },
  { value: 'book', label: '出版实体书' },
  { value: 'qrcode', label: '生成二维码' },
];

type OrderTab = 'product' | 'service';
type OrderStatusFilter = ServiceStatus | 'all';
type UnifiedOrderRow = { kind: 'regular'; order: OrderManagementOrder } | { kind: 'service'; order: ServiceOrder };

const serviceStatusOptions: Array<{ value: OrderStatusFilter; label: string }> = [
  { value: 'all', label: '全部状态' },
  { value: 'pending_accept', label: '待接单' },
  { value: 'pending_pay', label: '待支付' },
  { value: 'working', label: '服务中' },
  { value: 'completed', label: '已完成' },
  { value: 'refunded', label: '已退款' },
  { value: 'closed', label: '已关闭' },
];

const statusMap: Record<OrderManagementOrder['status'], { label: string; className: string; icon: typeof Clock }> = {
  pending_pay: { label: '待支付', className: 'order-status-pending', icon: Clock },
  paid: { label: '已支付', className: 'order-status-paid', icon: CreditCard },
  delivering: { label: '服务中', className: 'order-status-delivering', icon: Package },
  completed: { label: '已完成', className: 'order-status-completed', icon: CheckCircle },
  refunded: { label: '已退款', className: 'order-status-refunded', icon: AlertCircle },
  closed: { label: '已关闭', className: 'order-status-closed', icon: XCircle },
};

const afterSaleOptions = [
  { value: 'all', label: '全部售后' },
  { value: 'none', label: '无售后' },
  { value: 'pending', label: '退款待审核' },
  { value: 'rejected', label: '退款已驳回' },
  { value: 'completed', label: '已退款' },
] as const;
const serviceAfterSaleOptions = [
  { value: 'all', label: '全部售后' },
  { value: 'none', label: '无售后' },
  { value: 'pending', label: '退款待处理' },
  { value: 'rejected', label: '退款已驳回' },
  { value: 'completed', label: '已退款' },
  { value: 'help_pending', label: '平台介入中' },
] as const;
type AfterSaleFilter = (typeof serviceAfterSaleOptions)[number]['value'];
const serviceAfterSaleStatus = (order: ServiceOrder): AfterSaleFilter => {
  if (order.requests.some(request => request.type === 'help' && request.status === 'pending')) return 'help_pending';
  const refund = order.requests.filter(request => request.type === 'refund').at(-1);
  return refund?.status === 'resolved' ? 'completed' : refund?.status === 'rejected' ? 'rejected' : refund?.status === 'pending' ? 'pending' : 'none';
};
const serviceAfterSaleLabel = (order: ServiceOrder) => serviceAfterSaleOptions.find(option => option.value === serviceAfterSaleStatus(order))?.label || '无售后';

const typeLabelMap: Record<OrderManagementOrder['type'], string> = {
  biography: '下载 PDF',
  digital_person: '数字人',
  video: '视频',
  qrcode: '生成二维码',
  book: '出版实体书',
  biographer_service: '传记师服务',
  group_buy: '团购',
  derivative: '衍生品',
};

interface OrderAction {
  status: OrderManagementOrder['status'];
  label: string;
  variant: 'primary' | 'danger' | 'outline';
}

const isPhysicalProduct = (type: OrderManagementOrder['type']) => type === 'book' || type === 'derivative';

// 订单管理页只用于前端原型展示，直接使用静态 mock，不依赖账号、权限或订单接口。
const DEMO_ORDERS: OrderManagementOrder[] = [
  {
    id: 'ord_demo_001', userId: 'u_demo_current', userName: '张明远', userPhone: '13800138003',
    type: 'biography', productId: 'prod_bio_pdf', productName: '张明远的传记 · PDF 电子版', amount: 9.9, quantity: 1,
    status: 'paid', payTime: '2026-09-06T10:20:00', createdAt: '2026-09-06T10:00:00', updatedAt: '2026-09-06T10:20:00',
  },
  {
    id: 'ord_demo_002', userId: 'u_demo_current', userName: '张明远', userPhone: '13800138003',
    type: 'book', productId: 'prod_book_hardcover', productName: '张明远的传记 · 精装实体书', amount: 59, quantity: 1,
    status: 'paid', payTime: '2026-09-05T14:05:00', createdAt: '2026-09-05T14:00:00', updatedAt: '2026-09-06T09:30:00',
  },
  {
    id: 'ord_demo_003', userId: 'u_demo_current', userName: '张明远', userPhone: '13800138003',
    type: 'qrcode', productId: 'prod_qrcode', productName: '张明远的传记 · 专属二维码', amount: 19.9, quantity: 1,
    status: 'paid', payTime: '2026-09-03T16:40:00', createdAt: '2026-09-03T16:30:00', updatedAt: '2026-09-03T16:40:00',
  },
];

export default function OrderManagement() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState<OrderManagementOrder[]>(DEMO_ORDERS);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(readServiceOrders);
  const [selectedServiceOrderId, setSelectedServiceOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrderTab>('product');
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<OrderManagementOrder['type'] | 'all'>('all');
  const [afterSaleFilter, setAfterSaleFilter] = useState<AfterSaleFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  // 草稿条件：筛选控件只改草稿，点击「查询」后才应用到实际筛选
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftStatus, setDraftStatus] = useState<OrderStatusFilter>('all');
  const [draftType, setDraftType] = useState<OrderManagementOrder['type'] | 'all'>('all');
  const [draftAfterSale, setDraftAfterSale] = useState<AfterSaleFilter>('all');
  const [draftDateFrom, setDraftDateFrom] = useState('');
  const [draftDateTo, setDraftDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderManagementOrder | null>(null);
  const [selectedBiographerOrder, setSelectedBiographerOrder] = useState<BiographerOrder | null>(null);
  const [loadingBioOrder, setLoadingBioOrder] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ order: OrderManagementOrder; action: OrderAction } | null>(null);
  const [refundRejectOrder, setRefundRejectOrder] = useState<OrderManagementOrder | null>(null);
  const [refundRejectionReason, setRefundRejectionReason] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  const [deliverModalOrder, setDeliverModalOrder] = useState<OrderManagementOrder | null>(null);
  const [logistics, setLogistics] = useState<OrderLogistics>({ company: '', trackingNo: '', shippedAt: new Date().toISOString().slice(0, 16) });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDeliverModal, setBatchDeliverModal] = useState(false);
  const [batchCompany, setBatchCompany] = useState('');
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  useEffect(() => {
    const syncServiceOrders = () => setServiceOrders(readServiceOrders());
    window.addEventListener(SERVICE_ORDER_EVENT, syncServiceOrders);
    window.addEventListener('storage', syncServiceOrders);
    return () => { window.removeEventListener(SERVICE_ORDER_EVENT, syncServiceOrders); window.removeEventListener('storage', syncServiceOrders); };
  }, []);

  const loadOrders = () => {
    setLoading(true);
    setOrders(DEMO_ORDERS);
    setServiceOrders(readServiceOrders());
    setSelectedIds(new Set());
    window.setTimeout(() => setLoading(false), 180);
  };

  const handleBatchDeliver = async () => {
    if (!batchCompany.trim()) {
      addToast('请填写物流公司', 'error');
      return;
    }
    if (physicalSelected.length === 0) {
      addToast('没有可发货的实体订单', 'error');
      return;
    }
    try {
      setBatchSubmitting(true);
      const shippedAt = new Date().toISOString();
      setOrders((prev) => prev.map((order, idx) => physicalSelected.some((item) => item.id === order.id)
        ? { ...order, updatedAt: shippedAt, logistics: { company: batchCompany, trackingNo: `SF${Date.now().toString().slice(-6)}${idx.toString().padStart(2, '0')}`, shippedAt } }
        : order));
      addToast(`已批量发货 ${physicalSelected.length} 单`, 'success');
      setBatchDeliverModal(false);
      setBatchCompany('');
      setSelectedIds(new Set());
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : '批量发货失败', 'error');
    } finally {
      setBatchSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      // 传记师服务以服务订单数据为准，避免旧演示订单重复出现。
      if (o.type === 'biographer_service') return false;
      const matchKeyword =
        !keyword ||
        o.id.includes(keyword) ||
        o.productName.includes(keyword) ||
        o.userName?.includes(keyword) ||
        o.userPhone?.includes(keyword);
      const matchType = typeFilter === 'all' || o.type === typeFilter;
      const refundStatus = o.refundRequest?.status || 'none';
      const matchAfterSale = afterSaleFilter === 'all' || refundStatus === afterSaleFilter;
      const orderDate = o.createdAt.slice(0, 10);
      const matchDateFrom = !dateFrom || orderDate >= dateFrom;
      const matchDateTo = !dateTo || orderDate <= dateTo;
      return matchKeyword && matchType && matchAfterSale && matchDateFrom && matchDateTo;
    });
  }, [orders, keyword, typeFilter, afterSaleFilter, dateFrom, dateTo]);

  const filteredServiceOrders = useMemo(() => serviceOrders.filter((order) => {
    const query = keyword.trim().toLowerCase();
    const matchKeyword = !query || `${order.id} ${order.customerName} ${order.customerPhone} ${order.biographerName} ${order.service.name} ${order.requirements.interviewee}`.toLowerCase().includes(query);
    const orderDate = order.createdAt.slice(0, 10);
    return matchKeyword
      && (statusFilter === 'all' || order.status === statusFilter)
      && (afterSaleFilter === 'all' || serviceAfterSaleStatus(order) === afterSaleFilter)
      && (!dateFrom || orderDate >= dateFrom)
      && (!dateTo || orderDate <= dateTo);
  }), [serviceOrders, keyword, statusFilter, afterSaleFilter, dateFrom, dateTo]);

  const visibleRows = useMemo<UnifiedOrderRow[]>(() => (activeTab === 'product'
    ? filtered.map(order => ({ kind: 'regular' as const, order }))
    : filteredServiceOrders.map(order => ({ kind: 'service' as const, order })))
    .sort((a, b) => b.order.createdAt.localeCompare(a.order.createdAt)), [activeTab, filtered, filteredServiceOrders]);
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / 10));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = visibleRows.slice((currentPage - 1) * 10, currentPage * 10);
  const pageNumbers = totalPages > 7
    ? [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages].filter(number => number >= 1 && number <= totalPages))].sort((a, b) => a - b)
    : Array.from({ length: totalPages }, (_, index) => index + 1);

  const applyFilters = () => {
    setKeyword(draftKeyword);
    setStatusFilter(draftStatus);
    setTypeFilter(draftType);
    setAfterSaleFilter(draftAfterSale);
    setDateFrom(draftDateFrom);
    setDateTo(draftDateTo);
    setPage(1);
  };

  const resetFilters = () => {
    setDraftKeyword('');
    setDraftStatus('all');
    setDraftType('all');
    setDraftAfterSale('all');
    setDraftDateFrom('');
    setDraftDateTo('');
    setKeyword('');
    setStatusFilter('all');
    setTypeFilter('all');
    setAfterSaleFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };
  const selectTab = (tab: OrderTab) => {
    setActiveTab(tab);
    setSelectedIds(new Set());
    resetFilters();
  };

  const exportFilteredOrders = () => {
    const header = ['订单号', '用户', '商品/服务', '类型', '数量', '实付金额', '订单状态', '售后状态', '下单时间', '支付时间'];
    const rows = visibleRows.map(({ kind, order }) => kind === 'service' ? [
      order.id, order.customerName, `${order.service.name} · ${order.biographerName}`, '传记师服务', '1', order.amount.toFixed(2),
      serviceStatusLabels[order.status],
      serviceAfterSaleLabel(order),
      new Date(order.createdAt).toLocaleString('zh-CN'), order.paidAt ? new Date(order.paidAt).toLocaleString('zh-CN') : '-',
    ] : [
      order.id, order.userName || `用户${order.userId.slice(-4)}`, order.productName, typeLabelMap[order.type],
      String(order.quantity || 1), order.amount.toFixed(2), statusMap[order.status].label,
      order.refundRequest ? (order.refundRequest.status === 'pending' ? '退款待审核' : order.refundRequest.status === 'rejected' ? '退款已驳回' : '已退款') : '无售后',
      new Date(order.createdAt).toLocaleString('zh-CN'), order.payTime ? new Date(order.payTime).toLocaleString('zh-CN') : '-',
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `订单列表-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addToast(`已导出 ${visibleRows.length} 条订单`, 'success');
  };

  const fulfillmentLabel = (item: OrderManagementOrder) => {
    if (item.status === 'paid') {
      if (isPhysicalProduct(item.type)) return item.logistics ? '已发货' : '待发货';
    }
    if (item.status === 'delivering' && isPhysicalProduct(item.type)) return '已发货';
    if (item.status === 'delivering') return '服务中';
    return '';
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === selectableOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableOrders.map((o) => o.id)));
    }
  };

  const selectableOrders = filtered.filter((o) => isPhysicalProduct(o.type) && o.status === 'paid' && !o.logistics);
  const physicalSelected = selectableOrders.filter((o) => selectedIds.has(o.id));

  const executeAction = () => {
    if (!confirmAction) return;
    const { order, action } = confirmAction;
    setOrders((prev) => prev.map((item) => item.id === order.id ? { ...item, status: action.status, updatedAt: new Date().toISOString() } : item));
    addToast('订单状态已更新', 'success');
    setConfirmAction(null);
  };

  const handleApproveRefund = (order: OrderManagementOrder) => {
    try {
      setRefundSubmitting(true);
      setOrders((prev) => prev.map((item) => item.id === order.id ? { ...item, refundRequest: item.refundRequest ? { ...item.refundRequest, status: 'completed', processedAt: new Date().toISOString() } : item.refundRequest } : item));
      addToast('退款审核通过，退款已完成', 'success');
      setSelectedOrder((current) => current?.id === order.id ? { ...current, refundRequest: current.refundRequest ? { ...current.refundRequest, status: 'completed' } : current.refundRequest } : current);
    } finally {
      setRefundSubmitting(false);
    }
  };

  const handleRejectRefund = () => {
    if (!refundRejectOrder) return;
    if (!refundRejectionReason.trim()) {
      addToast('请填写驳回原因', 'error');
      return;
    }
    try {
      setRefundSubmitting(true);
      setOrders((prev) => prev.map((item) => item.id === refundRejectOrder.id ? { ...item, refundRequest: item.refundRequest ? { ...item.refundRequest, status: 'rejected', rejectionReason: refundRejectionReason.trim() } : item.refundRequest } : item));
      addToast('退款申请已驳回', 'success');
      setRefundRejectOrder(null);
      setRefundRejectionReason('');
    } finally {
      setRefundSubmitting(false);
    }
  };

  const handleViewDetail = (item: OrderManagementOrder) => {
    setSelectedOrder(item);
    setSelectedBiographerOrder(null);
    setLoadingBioOrder(false);
  };

  const handleDeliver = () => {
    if (!deliverModalOrder) return;
    if (!logistics.company.trim() || !logistics.trackingNo.trim()) {
      addToast('请填写物流公司和运单号', 'error');
      return;
    }
    const shippedAt = new Date().toISOString();
    setOrders((prev) => prev.map((item) => item.id === deliverModalOrder.id ? { ...item, logistics: { ...logistics, shippedAt }, updatedAt: shippedAt } : item));
    addToast('物流信息已保存', 'success');
    setDeliverModalOrder(null);
    setLogistics({ company: '', trackingNo: '', shippedAt: new Date().toISOString().slice(0, 16) });
  };

  const renderActionButtons = (item: OrderManagementOrder) => {
    const statusActions: OrderAction[] = [];

    if (item.status === 'delivering') {
      statusActions.push({ status: 'completed', label: '完成服务', variant: 'primary' });
    } else if (item.status === 'pending_pay') {
      statusActions.push({ status: 'closed', label: '关闭订单', variant: 'danger' });
    }

    return (
      <>
        <button className="admin-table-link" onClick={() => handleViewDetail(item)}>
          详情
        </button>
        {item.status === 'paid' && isPhysicalProduct(item.type) && !item.logistics && (
          <button className="admin-table-link" onClick={() => setDeliverModalOrder(item)}>
            发货
          </button>
        )}
        {item.refundRequest?.status === 'pending' && (
          <>
            <button className="admin-table-link" disabled={refundSubmitting} onClick={() => { if (window.confirm('审核通过后将模拟完成退款，是否继续？')) handleApproveRefund(item); }}>
              通过退款
            </button>
            <button className="admin-table-link danger" disabled={refundSubmitting} onClick={() => { setRefundRejectOrder(item); setRefundRejectionReason(''); }}>
              驳回退款
            </button>
          </>
        )}
        {statusActions.map((action) => (
          <button
            key={action.status}
            className={`admin-table-link${action.variant === 'danger' ? ' danger' : ''}`}
            onClick={() => setConfirmAction({ order: item, action })}
          >
            {action.label}
          </button>
        ))}
      </>
    );
  };

  const renderAddress = (order: OrderManagementOrder) => {
    if (!order.address) return null;
    const { name, phone, province, city, district, detail } = order.address;
    return (
      <>
        <div className="order-detail-divider" />
        <div className="order-detail-section">
          <h5><MapPin size={14} /> 收货地址</h5>
          <div className="order-detail-row">
            <span className="order-detail-label">收件人</span>
            <span className="order-detail-value">{name} {phone}</span>
          </div>
          <div className="order-detail-row">
            <span className="order-detail-label">地址</span>
            <span className="order-detail-value" style={{ maxWidth: 260, lineHeight: 1.5 }}>
              {province}{city}{district}{detail}
            </span>
          </div>
        </div>
      </>
    );
  };

  const renderLogistics = (order: OrderManagementOrder) => {
    if (!order.logistics) return null;
    return (
      <>
        <div className="order-detail-divider" />
        <div className="order-detail-section">
          <h5><Truck size={14} /> 物流信息</h5>
          <div className="order-detail-row">
            <span className="order-detail-label">物流公司</span>
            <span className="order-detail-value">{order.logistics.company}</span>
          </div>
          <div className="order-detail-row">
            <span className="order-detail-label">运单号</span>
            <span className="order-detail-value">{order.logistics.trackingNo}</span>
          </div>
          <div className="order-detail-row">
            <span className="order-detail-label">发货时间</span>
            <span className="order-detail-value">{new Date(order.logistics.shippedAt).toLocaleString()}</span>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="order-management-page">
      <header className="page-header">
        <h1 className="page-title">订单管理</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={exportFilteredOrders} disabled={loading || visibleRows.length === 0}>
            <Download size={14} /> 导出当前结果
          </button>
          <button className="btn btn-outline" onClick={loadOrders} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> 刷新
          </button>
        </div>
      </header>

      <div className="order-management-tabs" role="tablist" aria-label="订单分类">
        <button type="button" role="tab" aria-selected={activeTab === 'product'} className={activeTab === 'product' ? 'active' : ''} onClick={() => selectTab('product')}>商品订单</button>
        <button type="button" role="tab" aria-selected={activeTab === 'service'} className={activeTab === 'service' ? 'active' : ''} onClick={() => selectTab('service')}>服务订单</button>
      </div>

      <div className="card order-list-card">
        <div className="card-header order-list-header">
          <Annotate id="order-management.filters" inline>
          <div className="order-filters">
            <div className="order-search">
              <Search size={14} />
              <input
                type="text"
                placeholder={activeTab === 'product' ? '搜索订单号、商品、用户…' : '搜索订单号、客户、传记师…'}
                value={draftKeyword}
                onChange={(e) => setDraftKeyword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
              />
            </div>
            {activeTab === 'service' && <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value as OrderStatusFilter)}>
              {serviceStatusOptions.map((s) => (
                <option value={s.value} key={s.value}>{s.label}</option>
              ))}
            </select>}
            {activeTab === 'product' && <select value={draftType} onChange={(e) => setDraftType(e.target.value as OrderManagementOrder['type'] | 'all')}>
              {productTypeOptions.map((t) => (
                <option value={t.value} key={t.value}>{t.label}</option>
              ))}
            </select>}
            <select value={draftAfterSale} onChange={(e) => setDraftAfterSale(e.target.value as typeof draftAfterSale)}>
              {(activeTab === 'product' ? afterSaleOptions : serviceAfterSaleOptions).map((item) => (
                <option value={item.value} key={item.value}>{item.label}</option>
              ))}
            </select>
            <label className="order-filter-date">
              <span>下单时间</span>
              <input type="date" value={draftDateFrom} onChange={(e) => setDraftDateFrom(e.target.value)} />
              <i>至</i>
              <input type="date" value={draftDateTo} onChange={(e) => setDraftDateTo(e.target.value)} />
            </label>
            <button className="btn btn-primary btn-sm" onClick={applyFilters}>
              <Search size={13} /> 查询
            </button>
            <button className="btn btn-ghost btn-sm order-reset-button" onClick={resetFilters}>
              <RotateCcw size={13} /> 重置
            </button>
          </div>
          </Annotate>
        </div>
        {activeTab === 'product' && selectedIds.size > 0 && (
          <Annotate id="order-management.batch">
          <div className="order-batch-bar">
            <span className="order-batch-count">已选 {selectedIds.size} 单</span>
            <div className="order-batch-actions">
              {physicalSelected.length > 0 && (
                <button className="btn btn-primary btn-sm" onClick={() => setBatchDeliverModal(true)}>
                  <Truck size={14} /> 批量发货 ({physicalSelected.length})
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds(new Set())}>取消选择</button>
            </div>
          </div>
          </Annotate>
        )}
        <div className="card-body order-list-body">
          {loading ? (
            <div className="admin-table-empty">加载中…</div>
          ) : visibleRows.length === 0 ? (
            <div className="admin-table-empty">暂无符合条件的订单</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    {activeTab === 'product' && <th className="admin-table-check">
                      <input
                        type="checkbox"
                        checked={selectableOrders.length > 0 && selectedIds.size === selectableOrders.length}
                        disabled={selectableOrders.length === 0}
                        onChange={toggleSelectAll}
                      />
                    </th>}
                    <th>订单号</th>
                    <th>用户</th>
                    <th>{activeTab === 'product' ? '商品' : '服务'}</th>
                    <th>类型</th>
                    <th>数量</th>
                    <th>实付金额</th>
                    <th>订单状态</th>
                    <th>售后状态</th>
                    <th>下单时间</th>
                    <th>支付时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row) => {
                    if (row.kind === 'service') {
                      const order = row.order;
                      const afterSale = serviceAfterSaleStatus(order);
                      const statusClass = order.status === 'working' ? 'order-status-delivering' : order.status === 'completed' ? 'order-status-completed' : order.status === 'refunded' ? 'order-status-refunded' : order.status === 'closed' ? 'order-status-closed' : 'order-status-pending';
                      return <tr key={`service-${order.id}`}>
                        <td className="order-cell-id">{order.id}</td>
                        <td><div className="order-user-name">{order.customerName}</div><div className="order-user-phone">{order.customerPhone}</div></td>
                        <td className="admin-table-text-left order-cell-product"><div className="order-product-name">{order.service.name} · {order.biographerName}</div></td>
                        <td>传记师服务</td><td>1</td><td className="order-cell-amount">¥{order.amount.toLocaleString()}</td>
                        <td><span className={`order-status ${statusClass}`}>{serviceStatusLabels[order.status]}</span>{order.paidAt && <span className="order-fulfillment-label">{order.stages.filter(stage => stage.status === 'accepted').length}/{order.stages.length} 个阶段已确认</span>}</td>
                        <td>{afterSale === 'none' ? <span className="order-no-after-sale">无售后</span> : <span className={`order-refund-review-badge ${afterSale === 'help_pending' ? 'pending' : afterSale}`}>{serviceAfterSaleLabel(order)}</span>}</td>
                        <td className="order-cell-time">{new Date(order.createdAt).toLocaleString()}</td>
                        <td className="order-cell-time">{order.paidAt ? new Date(order.paidAt).toLocaleString() : '-'}</td>
                        <td><button className="admin-table-link" onClick={() => setSelectedServiceOrderId(order.id)}>详情</button></td>
                      </tr>;
                    }
                    const item = row.order;
                    const status = statusMap[item.status];
                    const StatusIcon = status.icon;
                    const selected = selectedIds.has(item.id);
                    return (
                      <tr className={selected ? 'selected' : undefined} key={item.id}>
                        <td className="admin-table-check">
                          <input type="checkbox" checked={selected} disabled={!selectableOrders.some(order => order.id === item.id)} onChange={() => toggleSelect(item.id)} />
                        </td>
                        <td className="order-cell-id">{item.id}</td>
                        <td>
                          <div className="order-user-name">{item.userName || '未知用户'}</div>
                          <div className="order-user-phone">{item.userPhone || item.userId}</div>
                        </td>
                        <td className="admin-table-text-left order-cell-product">
                          <div className="order-product-name">{item.productName}</div>
                          <div className="order-product-tags">
                            {item.address && (
                              <span className="order-product-tag address-tag" title="已填写收货地址"><MapPin size={10} /> 地址</span>
                            )}
                          </div>
                        </td>
                        <td>{typeLabelMap[item.type]}</td>
                        <td>{item.quantity || 1}</td>
                        <td className="order-cell-amount">¥{item.amount.toLocaleString()}</td>
                        <td>
                          <span className={`order-status ${status.className}`}>
                            <StatusIcon size={12} /> {status.label}
                          </span>
                          {fulfillmentLabel(item) && <span className="order-fulfillment-label">{fulfillmentLabel(item)}</span>}
                        </td>
                        <td>
                          {item.refundRequest ? (
                            <span className={`order-refund-review-badge ${item.refundRequest.status}`}>
                              {item.refundRequest.status === 'pending' ? '退款待审核' : item.refundRequest.status === 'rejected' ? '退款已驳回' : '已退款'}
                            </span>
                          ) : <span className="order-no-after-sale">无售后</span>}
                        </td>
                        <td className="order-cell-time">{new Date(item.createdAt).toLocaleString()}</td>
                        <td className="order-cell-time">{item.payTime ? new Date(item.payTime).toLocaleString() : '-'}</td>
                        <td>
                          <Annotate id="order-management.row-actions" inline>{renderActionButtons(item)}</Annotate>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {visibleRows.length > 0 && <div className="order-pagination">
          <span>共 {visibleRows.length} 条</span>
          <div className="order-pagination-pages">
            <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>上一页</button>
            {pageNumbers.map((number, index) => <span className="order-pagination-slot" key={number}>
              {index > 0 && number - pageNumbers[index - 1] > 1 && <span className="order-pagination-gap">…</span>}
              <button type="button" className={currentPage === number ? 'active' : ''} onClick={() => setPage(number)}>{number}</button>
            </span>)}
            <button type="button" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>下一页</button>
          </div>
        </div>}
      </div>

      {selectedServiceOrderId && <OrderServiceList role="admin" detailOnly selectedOrderId={selectedServiceOrderId} onCloseDetail={() => setSelectedServiceOrderId(null)} />}

      {selectedOrder && (
        <Annotate id="order-management.detail">
        <div className="modal-overlay" onClick={() => { setSelectedOrder(null); setSelectedBiographerOrder(null); }}>
          <div className="modal-content order-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>订单详情</h4>
              <button className="modal-close" onClick={() => { setSelectedOrder(null); setSelectedBiographerOrder(null); }}><X size={16} /></button>
            </div>
            <div className="modal-body order-detail-body">
              <div className="order-detail-row">
                <span className="order-detail-label">订单号</span>
                <span className="order-detail-value">{selectedOrder.id}</span>
              </div>
              <div className="order-detail-row">
                <span className="order-detail-label">用户</span>
                <span className="order-detail-value">
                  {selectedOrder.userName || '未知用户'} {selectedOrder.userPhone ? `(${selectedOrder.userPhone})` : ''}
                </span>
              </div>
              <div className="order-detail-row">
                <span className="order-detail-label">商品/服务</span>
                <span className="order-detail-value">{selectedOrder.productName}</span>
              </div>
              {selectedOrder.sku && (
                <div className="order-detail-row">
                  <span className="order-detail-label">SKU</span>
                  <span className="order-detail-value">{selectedOrder.sku}</span>
                </div>
              )}
              <div className="order-detail-row">
                <span className="order-detail-label">类型</span>
                <span className="order-detail-value">{typeLabelMap[selectedOrder.type]}</span>
              </div>
              {(selectedOrder.type === 'biography' || selectedOrder.type === 'qrcode') && <div className="order-detail-row">
                <span className="order-detail-label">获取方式</span>
                <span className="order-detail-value">{selectedOrder.type === 'biography' ? '客户在「我的传记」直接生成并下载当前传记 PDF' : '客户在「我的传记」生成传记网页二维码，扫码在线阅读'}</span>
              </div>}
              <div className="order-detail-row">
                <span className="order-detail-label">购买数量</span>
                <span className="order-detail-value">{selectedOrder.quantity || 1}</span>
              </div>
              <div className="order-detail-row">
                <span className="order-detail-label">实付金额</span>
                <span className="order-detail-value order-detail-amount">¥{selectedOrder.amount.toLocaleString()}</span>
              </div>
              <div className="order-detail-row">
                <span className="order-detail-label">状态</span>
                <span className="order-detail-value">
                  <span className={`order-status ${statusMap[selectedOrder.status].className}`}>
                    {statusMap[selectedOrder.status].label}
                  </span>
                </span>
              </div>
              <div className="order-detail-row">
                <span className="order-detail-label">售后状态</span>
                <span className="order-detail-value">
                  {selectedOrder.refundRequest
                    ? selectedOrder.refundRequest.status === 'pending' ? '退款待审核' : selectedOrder.refundRequest.status === 'rejected' ? '退款已驳回' : '已退款'
                    : '无售后'}
                </span>
              </div>
              <div className="order-detail-row">
                <span className="order-detail-label">下单时间</span>
                <span className="order-detail-value">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>
              {selectedOrder.payTime && (
                <div className="order-detail-row">
                  <span className="order-detail-label">支付时间</span>
                  <span className="order-detail-value">{new Date(selectedOrder.payTime).toLocaleString()}</span>
                </div>
              )}
              {selectedOrder.remark && (
                <div className="order-detail-row">
                  <span className="order-detail-label">备注</span>
                  <span className="order-detail-value" style={{ maxWidth: 260, lineHeight: 1.5 }}>{selectedOrder.remark}</span>
                </div>
              )}

              {renderAddress(selectedOrder)}
              {renderLogistics(selectedOrder)}
              {selectedOrder.refundRequest && (
                <>
                  <div className="order-detail-divider" />
                  <div className="order-detail-section order-refund-review-section">
                    <h5><AlertCircle size={14} /> 退款申请 <span className={`order-refund-review-badge ${selectedOrder.refundRequest.status}`}>{selectedOrder.refundRequest.status === 'pending' ? '待审核' : selectedOrder.refundRequest.status === 'rejected' ? '已驳回' : '已完成'}</span></h5>
                    <div className="order-detail-row"><span className="order-detail-label">退款原因</span><span className="order-detail-value">{selectedOrder.refundRequest.reasonOptionLabel || selectedOrder.refundRequest.reason}</span></div>
                    {selectedOrder.refundRequest.customReason && <div className="order-detail-row"><span className="order-detail-label">补充说明</span><span className="order-detail-value">{selectedOrder.refundRequest.customReason}</span></div>}
                    <div className="order-detail-row"><span className="order-detail-label">申请时间</span><span className="order-detail-value">{new Date(selectedOrder.refundRequest.createdAt).toLocaleString()}</span></div>
                    {selectedOrder.refundRequest.rejectionReason && <div className="order-detail-row"><span className="order-detail-label">驳回原因</span><span className="order-detail-value">{selectedOrder.refundRequest.rejectionReason}</span></div>}
                    {selectedOrder.refundRequest.processedAt && <div className="order-detail-row"><span className="order-detail-label">处理时间</span><span className="order-detail-value">{new Date(selectedOrder.refundRequest.processedAt).toLocaleString()}</span></div>}
                    {selectedOrder.refundRequest.status === 'pending' && (
                      <div className="order-review-actions">
                        <button className="btn btn-primary btn-sm" disabled={refundSubmitting} onClick={() => { if (window.confirm('审核通过后将模拟完成退款，是否继续？')) handleApproveRefund(selectedOrder); }}>通过退款</button>
                        <button className="btn btn-danger btn-sm" disabled={refundSubmitting} onClick={() => { setRefundRejectOrder(selectedOrder); setRefundRejectionReason(''); }}>驳回退款</button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {selectedOrder.type === 'biographer_service' && (
                <>
                  <div className="order-detail-divider" />
                  <div className="order-detail-section">
                    <h5><UserCheck size={14} /> 传记师服务信息</h5>
                    {loadingBioOrder ? (
                      <div className="order-detail-loading">加载中…</div>
                    ) : selectedBiographerOrder ? (
                      <>
                        <div className="order-detail-row">
                          <span className="order-detail-label">订单金额</span>
                          <span className="order-detail-value">¥{selectedBiographerOrder.amount.toLocaleString()}</span>
                        </div>
                        {selectedBiographerOrder.schedule?.time && (
                          <div className="order-detail-row">
                            <span className="order-detail-label">采访安排</span>
                            <span className="order-detail-value">
                              <Calendar size={12} /> {selectedBiographerOrder.schedule.time}
                              <br />
                              <MapPin size={12} /> {selectedBiographerOrder.schedule.address}
                            </span>
                          </div>
                        )}
                        <div className="order-detail-row">
                          <span className="order-detail-label">服务进度</span>
                          <span className="order-detail-value">
                            <div className="admin-bio-progress">
                              {selectedBiographerOrder.progress.map((p) => (
                                <div key={p.node} className={`admin-bio-progress-node ${p.status}`}>
                                  <div className="admin-bio-progress-dot" />
                                  <span>{p.node}</span>
                                </div>
                              ))}
                            </div>
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="order-detail-empty">未找到关联的传记师订单</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        </Annotate>
      )}

      {deliverModalOrder && (
        <div className="modal-overlay" onClick={() => setDeliverModalOrder(null)}>
          <div className="modal-content order-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>发货 - {deliverModalOrder.id}</h4>
              <button className="modal-close" onClick={() => setDeliverModalOrder(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="order-form-row">
                <label>物流公司 <span className="order-form-required">*</span></label>
                <input
                  type="text"
                  value={logistics.company}
                  onChange={(e) => setLogistics({ ...logistics, company: e.target.value })}
                  placeholder="如：顺丰速运"
                />
              </div>
              <div className="order-form-row">
                <label>运单号 <span className="order-form-required">*</span></label>
                <input
                  type="text"
                  value={logistics.trackingNo}
                  onChange={(e) => setLogistics({ ...logistics, trackingNo: e.target.value })}
                  placeholder="请输入快递单号"
                />
              </div>
              <div className="order-detail-actions">
                <button className="btn btn-outline" onClick={() => setDeliverModalOrder(null)}>取消</button>
                <button className="btn btn-primary" onClick={handleDeliver}><Truck size={14} /> 确认发货</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {batchDeliverModal && (
        <div className="modal-overlay" onClick={() => setBatchDeliverModal(false)}>
          <div className="modal-content order-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>批量发货（{physicalSelected.length} 单）</h4>
              <button className="modal-close" onClick={() => setBatchDeliverModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p className="order-batch-hint">将为选中的实体书/衍生品订单统一发货，运单号由系统自动生成。</p>
              <div className="order-form-row">
                <label>物流公司 <span className="order-form-required">*</span></label>
                <input
                  type="text"
                  value={batchCompany}
                  onChange={(e) => setBatchCompany(e.target.value)}
                  placeholder="如：顺丰速运"
                />
              </div>
              <div className="order-detail-actions">
                <button className="btn btn-outline" onClick={() => setBatchDeliverModal(false)}>取消</button>
                <button className="btn btn-primary" disabled={batchSubmitting} onClick={handleBatchDeliver}>
                  <Truck size={14} /> {batchSubmitting ? '发货中…' : '确认批量发货'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {refundRejectOrder && (
        <div className="modal-overlay" onClick={() => setRefundRejectOrder(null)}>
          <div className="modal-content order-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>驳回退款申请</h4>
              <button className="modal-close" onClick={() => setRefundRejectOrder(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p className="order-refund-reject-hint">请填写驳回原因，用户将可以看到该说明并重新申请退款。</p>
              <div className="order-form-row">
                <label>驳回原因 <span className="order-form-required">*</span></label>
                <textarea rows={4} maxLength={500} value={refundRejectionReason} onChange={(e) => setRefundRejectionReason(e.target.value)} placeholder="请输入驳回原因" />
              </div>
              <div className="order-detail-actions">
                <button className="btn btn-outline" onClick={() => setRefundRejectOrder(null)}>取消</button>
                <button className="btn btn-danger" disabled={refundSubmitting} onClick={handleRejectRefund}>{refundSubmitting ? '提交中…' : '确认驳回'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>确认操作</h4>
              <button className="modal-close" onClick={() => setConfirmAction(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#6b7280', fontSize: 13 }}>
                确定要对订单「{confirmAction.order.id}」执行「{confirmAction.action.label}」操作吗？
              </p>
              <div className="order-detail-actions">
                <button className="btn btn-outline" onClick={() => setConfirmAction(null)}>取消</button>
                <button
                  className={`btn ${confirmAction.action.variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                  onClick={executeAction}
                >
                  确认{confirmAction.action.label}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
