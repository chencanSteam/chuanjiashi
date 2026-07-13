import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, ShoppingCart, CreditCard, Package, CheckCircle, AlertCircle, Clock, XCircle, Eye, X, UserCheck, Calendar, MapPin, Truck, Upload, FileText, ExternalLink } from 'lucide-react';
import { orderApi, type AdminOrder } from '../api/order';
import { biographerApi } from '../api/biographer';
import { useToast } from '../hooks/useToast';
import type { BiographerOrder, Deliverable, OrderLogistics } from '../mocks/types';
import './OrderManagement.css';

const typeOptions: Array<{ value: AdminOrder['type'] | 'all'; label: string }> = [
  { value: 'all', label: '全部类型' },
  { value: 'book', label: '实体书' },
  { value: 'derivative', label: '衍生品' },
  { value: 'qrcode', label: '二维码' },
  { value: 'video', label: '纪念视频' },
  { value: 'digital_person', label: '数字人' },
  { value: 'biography', label: '传记服务' },
  { value: 'biographer_service', label: '传记师服务' },
  { value: 'group_buy', label: '团购' },
];

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
  derivative: '衍生品',
};

interface OrderAction {
  status: AdminOrder['status'];
  label: string;
  variant: 'primary' | 'danger' | 'outline';
}

const isPhysicalProduct = (type: AdminOrder['type']) => type === 'book' || type === 'derivative';
const isDigitalProduct = (type: AdminOrder['type']) => ['qrcode', 'video', 'digital_person', 'biography'].includes(type);

const deliverableTypeOptions: Deliverable['type'][] = ['pdf', 'video', 'qrcode', 'link', 'image'];
const deliverableTypeLabels: Record<Deliverable['type'], string> = {
  pdf: 'PDF 文件',
  video: '视频文件',
  qrcode: '二维码',
  link: '链接',
  image: '图片',
};

export default function OrderManagement() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminOrder['status'] | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<AdminOrder['type'] | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [selectedBiographerOrder, setSelectedBiographerOrder] = useState<BiographerOrder | null>(null);
  const [loadingBioOrder, setLoadingBioOrder] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ order: AdminOrder; action: OrderAction } | null>(null);

  const [deliverModalOrder, setDeliverModalOrder] = useState<AdminOrder | null>(null);
  const [logistics, setLogistics] = useState<OrderLogistics>({ company: '', trackingNo: '', shippedAt: new Date().toISOString().slice(0, 16) });

  const [deliverableModalOrder, setDeliverableModalOrder] = useState<AdminOrder | null>(null);
  const [deliverable, setDeliverable] = useState<Deliverable>({ type: 'link', url: '', name: '', createdAt: new Date().toISOString() });

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
      const matchType = typeFilter === 'all' || o.type === typeFilter;
      return matchKeyword && matchStatus && matchType;
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

  const handleViewDetail = async (item: AdminOrder) => {
    setSelectedOrder(item);
    if (item.type === 'biographer_service') {
      setLoadingBioOrder(true);
      try {
        const bioOrder = await biographerApi.adminGetBiographerOrderByOrderId(item.id);
        setSelectedBiographerOrder(bioOrder);
      } catch {
        setSelectedBiographerOrder(null);
      } finally {
        setLoadingBioOrder(false);
      }
    } else {
      setSelectedBiographerOrder(null);
    }
  };

  const handleDeliver = async () => {
    if (!deliverModalOrder) return;
    if (!logistics.company.trim() || !logistics.trackingNo.trim()) {
      addToast('请填写物流公司和运单号', 'error');
      return;
    }
    try {
      await orderApi.adminDeliver(deliverModalOrder.id, { ...logistics, shippedAt: new Date().toISOString() });
      addToast('物流信息已保存，订单进入服务中', 'success');
      setDeliverModalOrder(null);
      setLogistics({ company: '', trackingNo: '', shippedAt: new Date().toISOString().slice(0, 16) });
      loadOrders();
    } catch (err: any) {
      addToast(err.message || '发货失败', 'error');
    }
  };

  const handleAddDeliverable = async () => {
    if (!deliverableModalOrder) return;
    if (!deliverable.url.trim() || !deliverable.name.trim()) {
      addToast('请填写交付物名称和链接/地址', 'error');
      return;
    }
    try {
      await orderApi.adminAddDeliverable(deliverableModalOrder.id, { ...deliverable, createdAt: new Date().toISOString() });
      addToast('交付物已上传', 'success');
      setDeliverableModalOrder(null);
      setDeliverable({ type: 'link', url: '', name: '', createdAt: new Date().toISOString() });
      loadOrders();
    } catch (err: any) {
      addToast(err.message || '上传失败', 'error');
    }
  };

  const renderActionButtons = (item: AdminOrder) => {
    const statusActions: OrderAction[] = [];

    if (item.status === 'paid') {
      statusActions.push({ status: 'refunded', label: '退款', variant: 'danger' });
    } else if (item.status === 'delivering') {
      statusActions.push(
        { status: 'completed', label: '完成服务', variant: 'primary' },
        { status: 'refunded', label: '退款', variant: 'danger' }
      );
    } else if (item.status === 'completed') {
      statusActions.push({ status: 'refunded', label: '退款', variant: 'danger' });
    } else if (item.status === 'pending_pay') {
      statusActions.push({ status: 'closed', label: '关闭订单', variant: 'danger' });
    }

    return (
      <div className="order-actions">
        <button className="order-action-btn order-action-view" onClick={() => handleViewDetail(item)}>
          <Eye size={12} /> 详情
        </button>
        {item.status === 'paid' && isPhysicalProduct(item.type) && (
          <button className="order-action-btn order-action-primary" onClick={() => setDeliverModalOrder(item)}>
            <Truck size={12} /> 发货
          </button>
        )}
        {item.status === 'paid' && isDigitalProduct(item.type) && (
          <button className="order-action-btn order-action-primary" onClick={() => setDeliverableModalOrder(item)}>
            <Upload size={12} /> 上传交付物
          </button>
        )}
        {item.status === 'paid' && !isPhysicalProduct(item.type) && !isDigitalProduct(item.type) && (
          <button
            className="order-action-btn order-action-primary"
            onClick={() => setConfirmAction({ order: item, action: { status: 'delivering', label: '开始服务', variant: 'primary' } })}
          >
            开始服务
          </button>
        )}
        {statusActions.map((action) => (
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

  const renderAddress = (order: AdminOrder) => {
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

  const renderLogistics = (order: AdminOrder) => {
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

  const renderDeliverables = (order: AdminOrder) => {
    if (!order.deliverables || order.deliverables.length === 0) return null;
    return (
      <>
        <div className="order-detail-divider" />
        <div className="order-detail-section">
          <h5><FileText size={14} /> 交付物</h5>
          <div className="order-deliverable-list">
            {order.deliverables.map((d, idx) => (
              <div className="order-deliverable-item" key={idx}>
                <div className="order-deliverable-info">
                  <span className="order-deliverable-name">{d.name}</span>
                  <span className="order-deliverable-type">{deliverableTypeLabels[d.type]}</span>
                </div>
                <a className="order-deliverable-link" href={d.url} target="_blank" rel="noreferrer">
                  <ExternalLink size={12} /> 查看
                </a>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="order-management-page">
      <header className="page-header">
        <h1 className="page-title">订单管理</h1>
        <button className="btn btn-outline" onClick={loadOrders} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> 刷新
        </button>
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
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as AdminOrder['type'] | 'all')}>
              {typeOptions.map((t) => (
                <option value={t.value} key={t.value}>{t.label}</option>
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
                    <div className="order-cell order-cell-product">
                      <div className="order-product-name">{item.productName}</div>
                      <div className="order-product-tags">
                        {item.address && (
                          <span className="order-product-tag address-tag" title="已填写收货地址"><MapPin size={10} /> 地址</span>
                        )}
                        {item.deliverables && item.deliverables.length > 0 && (
                          <span className="order-product-tag deliverable-tag" title={`已上传 ${item.deliverables.length} 个交付物`}><FileText size={10} /> 交付物 {item.deliverables.length}</span>
                        )}
                      </div>
                    </div>
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
                <span className="order-detail-label">客户</span>
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
              {selectedOrder.remark && (
                <div className="order-detail-row">
                  <span className="order-detail-label">备注</span>
                  <span className="order-detail-value" style={{ maxWidth: 260, lineHeight: 1.5 }}>{selectedOrder.remark}</span>
                </div>
              )}

              {renderAddress(selectedOrder)}
              {renderLogistics(selectedOrder)}
              {renderDeliverables(selectedOrder)}

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
                          <span className="order-detail-label">定金金额</span>
                          <span className="order-detail-value">¥{selectedBiographerOrder.deposit.toLocaleString()}</span>
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

      {deliverableModalOrder && (
        <div className="modal-overlay" onClick={() => setDeliverableModalOrder(null)}>
          <div className="modal-content order-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>上传交付物 - {deliverableModalOrder.id}</h4>
              <button className="modal-close" onClick={() => setDeliverableModalOrder(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="order-form-row">
                <label>交付物类型</label>
                <select
                  value={deliverable.type}
                  onChange={(e) => setDeliverable({ ...deliverable, type: e.target.value as Deliverable['type'] })}
                >
                  {deliverableTypeOptions.map((t) => (
                    <option value={t} key={t}>{deliverableTypeLabels[t]}</option>
                  ))}
                </select>
              </div>
              <div className="order-form-row">
                <label>名称 <span className="order-form-required">*</span></label>
                <input
                  type="text"
                  value={deliverable.name}
                  onChange={(e) => setDeliverable({ ...deliverable, name: e.target.value })}
                  placeholder="如：纪念视频成片"
                />
              </div>
              <div className="order-form-row">
                <label>链接 / 地址 <span className="order-form-required">*</span></label>
                <input
                  type="text"
                  value={deliverable.url}
                  onChange={(e) => setDeliverable({ ...deliverable, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="order-detail-actions">
                <button className="btn btn-outline" onClick={() => setDeliverableModalOrder(null)}>取消</button>
                <button className="btn btn-primary" onClick={handleAddDeliverable}><Upload size={14} /> 确认上传</button>
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
