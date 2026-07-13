import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  RefreshCw,
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
  CreditCard as PayIcon,
} from 'lucide-react';
import { orderApi } from '../api/order';
import type { Order } from '../mocks/types';
import { paymentApi } from '../api/payment';
import { useToast } from '../hooks/useToast';
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

export default function MyOrders() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<Order['type'] | 'all'>('all');
  const [selected, setSelected] = useState<Order | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    setLoading(true);
    orderApi
      .list()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchType = typeFilter === 'all' || o.type === typeFilter;
      return matchStatus && matchType;
    });
  }, [orders, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending_pay').length,
      delivering: orders.filter((o) => o.status === 'delivering').length,
      completed: orders.filter((o) => o.status === 'completed').length,
    };
  }, [orders]);

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

  return (
    <div className="my-orders-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">我的订单</h1>
          <p className="page-subtitle">查看全部商品与服务订单</p>
        </div>
        <button className="btn btn-outline" onClick={loadOrders} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> 刷新
        </button>
      </header>

      <div className="my-order-stats">
        <div className="card my-order-stat-card">
          <ClipboardList size={20} color="#1B5E4B" />
          <div>
            <div className="my-order-stat-value">{stats.total}</div>
            <div className="my-order-stat-label">全部订单</div>
          </div>
        </div>
        <div className="card my-order-stat-card">
          <Clock size={20} color="#d97706" />
          <div>
            <div className="my-order-stat-value">{stats.pending}</div>
            <div className="my-order-stat-label">待支付</div>
          </div>
        </div>
        <div className="card my-order-stat-card">
          <Package size={20} color="#7c3aed" />
          <div>
            <div className="my-order-stat-value">{stats.delivering}</div>
            <div className="my-order-stat-label">服务中</div>
          </div>
        </div>
        <div className="card my-order-stat-card">
          <CheckCircle size={20} color="#1B5E4B" />
          <div>
            <div className="my-order-stat-value">{stats.completed}</div>
            <div className="my-order-stat-label">已完成</div>
          </div>
        </div>
      </div>

      <div className="card my-order-list-card">
        <div className="card-header my-order-list-header">
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
        </div>
        <div className="card-body my-order-list-body">
          {loading ? (
            <div className="my-order-empty">加载中…</div>
          ) : filtered.length === 0 ? (
            <div className="my-order-empty">
              <ShoppingBag size={40} color="#d1d5db" />
              <p>暂无符合条件的订单</p>
              <button className="btn btn-primary" onClick={() => navigate('/store')}>去商城逛逛</button>
            </div>
          ) : (
            <div className="my-order-list">
              {filtered.map((order) => {
                const status = statusMap[order.status];
                const StatusIcon = status.icon;
                const canPay = order.status === 'pending_pay';
                return (
                  <div className="my-order-item" key={order.id}>
                    <div className="my-order-item-header">
                      <div className="my-order-item-meta">
                        <span className="my-order-item-id">{order.id}</span>
                        <span className="my-order-item-time">{new Date(order.createdAt).toLocaleString()}</span>
                        <span className="my-order-item-type">{typeLabelMap[order.type]}</span>
                      </div>
                      <span className={`my-order-status ${status.className}`}>
                        <StatusIcon size={12} /> {status.label}
                      </span>
                    </div>
                    <div className="my-order-item-body">
                      <div className="my-order-item-product">
                        <div className="my-order-item-name">{order.productName}</div>
                        {order.sku && <div className="my-order-item-sku">{order.sku}</div>}
                      </div>
                      <div className="my-order-item-amount">¥{order.amount.toLocaleString()}</div>
                    </div>
                    <div className="my-order-item-footer">
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelected(order)}>查看详情</button>
                      {canPay && (
                        <button className="btn btn-primary btn-sm" disabled={payingId === order.id} onClick={() => handlePay(order)}>
                          <PayIcon size={12} /> {payingId === order.id ? '支付中…' : '去支付'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selected && (
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

              {selected.status === 'pending_pay' && (
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} disabled={payingId === selected.id} onClick={() => handlePay(selected)}>
                  <PayIcon size={14} /> {payingId === selected.id ? '支付中…' : '立即支付'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
