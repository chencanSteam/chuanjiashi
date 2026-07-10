import { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingCart, CreditCard, Package, CheckCircle, AlertCircle, Clock, XCircle, Eye, X } from 'lucide-react';
import { orderApi, type AdminOrder } from '../api/order';
import { useToast } from '../hooks/useToast';
import './OrderManagement.css';

const statusOptions: Array<{ value: AdminOrder['status'] | 'all'; label: string }> = [
  { value: 'all', label: '全部状态' },
  { value: 'pending_pay', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'delivering', label: '服务中' },
  { value: 'completed', label: '已完成' },
  { value: 'refunded', label: '已退款' },
  { value: 'closed', label: '已关闭' },
];

const statusMap: Record<AdminOrder['status'], { label: string; className: string; icon: typeof Clock }> = {
  pending_pay: { label: '待支付', className: 'order-status-pending', icon: Clock },
  paid: { label: '已支付', className: 'order-status-paid', icon: CreditCard },
  delivering: { label: '服务中', className: 'order-status-delivering', icon: Package },
  completed: { label: '已完成', className: 'order-status-completed', icon: CheckCircle },
  refunded: { label: '已退款', className: 'order-status-refunded', icon: AlertCircle },
  closed: { label: '已关闭', className: 'order-status-closed', icon: XCircle },
};

const typeLabelMap: Record<AdminOrder['type'], string> = {
  biography: '传记服务',
  digital_person: '数字人',
  video: '视频',
  qrcode: '二维码',
  book: '实体书',
  biographer_service: '传记师服务',
  group_buy: '团购',
};

interface OrderAction {
  status: AdminOrder['status'];
  label: string;
  variant: 'primary' | 'danger' | 'outline';
}

const allowedActions: Record<AdminOrder['status'], OrderAction[]> = {
  pending_pay: [{ status: 'closed', label: '关闭订单', variant: 'danger' }],
  paid: [
    { status: 'delivering', label: '开始服务', variant: 'primary' },
    { status: 'refunded', label: '退款', variant: 'danger' },
  ],
  delivering: [
    { status: 'completed', label: '完成服务', variant: 'primary' },
    { status: 'refunded', label: '退款', variant: 'danger' },
  ],
  completed: [{ status: 'refunded', label: '退款', variant: 'danger' }],
  refunded: [],
  closed: [],
};

export default function OrderManagement() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminOrder['status'] | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ order: AdminOrder; action: OrderAction } | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    setLoading(true);
    orderApi
      .adminList()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchKeyword =
        !keyword ||
        o.id.includes(keyword) ||
        o.productName.includes(keyword) ||
        o.userName?.includes(keyword) ||
        o.userPhone?.includes(keyword);
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchKeyword && matchStatus;
    });
  }, [orders, keyword, statusFilter]);

  const stats = useMemo(() => {
    const totalAmount = orders.reduce((sum, o) => sum + o.amount, 0);
    const paidAmount = orders.filter((o) => ['paid', 'delivering', 'completed'].includes(o.status)).reduce((sum, o) => sum + o.amount, 0);
    const pendingCount = orders.filter((o) => o.status === 'pending_pay').length;
    return {
      total: orders.length,
      totalAmount,
      paidAmount,
      pendingCount,
    };
  }, [orders]);

  const executeAction = async () => {
    if (!confirmAction) return;
    const { order, action } = confirmAction;
    try {
      await orderApi.adminUpdateStatus(order.id, action.status);
      addToast('订单状态已更新', 'success');
      setConfirmAction(null);
      loadOrders();
    } catch (err: any) {
      addToast(err.message || '操作失败', 'error');
    }
  };

  const renderActionButtons = (item: AdminOrder) => {
    const actions = allowedActions[item.status];
    return (
      <div className="order-actions">
        <button className="order-action-btn order-action-view" onClick={() => setSelectedOrder(item)}>
          <Eye size={12} /> 详情
        </button>
        {actions.map((action) => (
          <button
            key={action.status}
            className={`order-action-btn order-action-${action.variant}`}
            onClick={() => setConfirmAction({ order: item, action })}
          >
            {action.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="order-management-page">
      <header className="page-header">
        <h1 className="page-title">订单管理</h1>
      </header>

      <div className="order-stats">
        <div className="card order-stat-card">
          <ShoppingCart size={20} color="#1B5E4B" />
          <div>
            <div className="order-stat-value">{stats.total}</div>
            <div className="order-stat-label">订单总数</div>
          </div>
        </div>
        <div className="card order-stat-card">
          <CreditCard size={20} color="#2563eb" />
          <div>
            <div className="order-stat-value">¥{stats.paidAmount.toLocaleString()}</div>
            <div className="order-stat-label">实收金额</div>
          </div>
        </div>
        <div className="card order-stat-card">
          <Clock size={20} color="#d97706" />
          <div>
            <div className="order-stat-value">{stats.pendingCount}</div>
            <div className="order-stat-label">待支付</div>
          </div>
        </div>
        <div className="card order-stat-card">
          <CheckCircle size={20} color="#7c3aed" />
          <div>
            <div className="order-stat-value">¥{stats.totalAmount.toLocaleString()}</div>
            <div className="order-stat-label">订单总额</div>
          </div>
        </div>
      </div>

      <div className="card order-list-card">
        <div className="card-header order-list-header">
          <div className="order-filters">
            <div className="order-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="搜索订单号、商品、客户…"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AdminOrder['status'] | 'all')}>
              {statusOptions.map((s) => (
                <option value={s.value} key={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="card-body order-list-body">
          {loading ? (
            <div className="order-empty">加载中…</div>
          ) : filtered.length === 0 ? (
            <div className="order-empty">暂无符合条件的订单</div>
          ) : (
            <div className="order-table">
              <div className="order-row order-header-row">
                <div className="order-cell">订单号</div>
                <div className="order-cell">客户</div>
                <div className="order-cell">商品/服务</div>
                <div className="order-cell">类型</div>
                <div className="order-cell">金额</div>
                <div className="order-cell">状态</div>
                <div className="order-cell">下单时间</div>
                <div className="order-cell">操作</div>
              </div>
              {filtered.map((item) => {
                const status = statusMap[item.status];
                const StatusIcon = status.icon;
                return (
                  <div className="order-row" key={item.id}>
                    <div className="order-cell order-cell-id">{item.id}</div>
                    <div className="order-cell">
                      <div className="order-user-name">{item.userName || '未知用户'}</div>
                      <div className="order-user-phone">{item.userPhone || item.userId}</div>
                    </div>
                    <div className="order-cell order-cell-product">{item.productName}</div>
                    <div className="order-cell">{typeLabelMap[item.type]}</div>
                    <div className="order-cell order-cell-amount">¥{item.amount.toLocaleString()}</div>
                    <div className="order-cell">
                      <span className={`order-status ${status.className}`}>
                        <StatusIcon size={12} /> {status.label}
                      </span>
                    </div>
                    <div className="order-cell order-cell-time">{new Date(item.createdAt).toLocaleString()}</div>
                    <div className="order-cell order-cell-action">{renderActionButtons(item)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content order-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>订单详情</h4>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}><X size={16} /></button>
            </div>
            <div className="modal-body order-detail-body">
              <div className="order-detail-row">
                <span className="order-detail-label">订单号</span>
                <span className="order-detail-value">{selectedOrder.id}</span>
              </div>
              <div className="order-detail-row">
                <span className="order-detail-label">客户</span>
                <span className="order-detail-value">
                  {selectedOrder.userName || '未知用户'} {selectedOrder.userPhone ? `(${selectedOrder.userPhone})` : ''}
                </span>
              </div>
              <div className="order-detail-row">
                <span className="order-detail-label">商品/服务</span>
                <span className="order-detail-value">{selectedOrder.productName}</span>
              </div>
              <div className="order-detail-row">
                <span className="order-detail-label">类型</span>
                <span className="order-detail-value">{typeLabelMap[selectedOrder.type]}</span>
              </div>
              <div className="order-detail-row">
                <span className="order-detail-label">金额</span>
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
                <span className="order-detail-label">下单时间</span>
                <span className="order-detail-value">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>
              {selectedOrder.payTime && (
                <div className="order-detail-row">
                  <span className="order-detail-label">支付时间</span>
                  <span className="order-detail-value">{new Date(selectedOrder.payTime).toLocaleString()}</span>
                </div>
              )}
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
