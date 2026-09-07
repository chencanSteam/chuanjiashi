import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Calendar, MapPin, Search, X } from 'lucide-react';
import { biographerApi } from '../api/biographer';
import type { BiographerOrder as MockBiographerOrder } from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import './BiographerOrders.css';

const statusMap: Record<MockBiographerOrder['status'], { label: string; color: string }> = {
  pending_schedule: { label: '待预约采访', color: '#d97706' },
  interview_scheduled: { label: '已预约采访', color: '#7c3aed' },
  draft_submitted: { label: '已提交初稿', color: '#2563eb' },
  modifying: { label: '修改中', color: '#d97706' },
  final_submitted: { label: '已提交终稿', color: '#2563eb' },
  completed: { label: '已完成', color: '#1B5E4B' },
  after_sales: { label: '售后中', color: '#ef4444' },
};

const progressNodes = ['预约采访', '提交初稿', '修改完善', '交付定稿'];

function getNextAction(order: MockBiographerOrder): { node: string; label: string } | null {
  const pending = order.progress.find((p) => p.status === 'pending');
  if (!pending) return null;
  const labelMap: Record<string, string> = {
    '预约采访': '预约采访时间',
    '提交初稿': '提交初稿',
    '修改完善': '确认修改完成',
    '交付定稿': '交付定稿',
  };
  return { node: pending.node, label: labelMap[pending.node] };
}

export default function BiographerOrders() {
  const [orders, setOrders] = useState<MockBiographerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOrder, setActingOrder] = useState<MockBiographerOrder | null>(null);
  const [detailOrder, setDetailOrder] = useState<MockBiographerOrder | null>(null);
  const [confirmActionState, setConfirmActionState] = useState<{ order: MockBiographerOrder; next: { node: string; label: string } } | null>(null);
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleAddress, setScheduleAddress] = useState('');
  const [processing, setProcessing] = useState(false);
  // 搜索/筛选：输入框为草稿值，点「查询」或回车后才生效
  const [keywordInput, setKeywordInput] = useState('');
  const [statusInput, setStatusInput] = useState<MockBiographerOrder['status'] | 'all'>('all');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<MockBiographerOrder['status'] | 'all'>('all');

  const applyFilters = () => {
    setKeyword(keywordInput.trim());
    setStatusFilter(statusInput);
  };

  const resetFilters = () => {
    setKeywordInput('');
    setStatusInput('all');
    setKeyword('');
    setStatusFilter('all');
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    setLoading(true);
    biographerApi
      .myOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  const handleAction = (order: MockBiographerOrder) => {
    const next = getNextAction(order);
    if (!next) return;
    if (next.node === '预约采访') {
      setActingOrder(order);
      setScheduleTime(order.schedule?.time || '');
      setScheduleAddress(order.schedule?.address || '');
      return;
    }
    // 其余操作先弹确认框，避免误触
    setConfirmActionState({ order, next });
  };

  const executeAction = async () => {
    if (!confirmActionState) return;
    try {
      setProcessing(true);
      await biographerApi.updateProgress(confirmActionState.order.id, confirmActionState.next.node);
      setConfirmActionState(null);
      loadOrders();
    } finally {
      setProcessing(false);
    }
  };

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const searchable = `${order.id} ${order.orderId || ''} ${order.customerName || order.userId} ${order.serviceName}`.toLowerCase();
    if (keyword && !searchable.includes(keyword.toLowerCase())) return false;
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    return true;
  }), [orders, keyword, statusFilter]);

  const handleSchedule = async () => {
    if (!actingOrder || !scheduleTime || !scheduleAddress) return;
    try {
      setProcessing(true);
      await biographerApi.scheduleInterview(actingOrder.id, { time: scheduleTime, address: scheduleAddress });
      setActingOrder(null);
      loadOrders();
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="biographer-orders-page">
        <header className="page-header"><h1 className="page-title">我的订单</h1></header>
        <div className="card"><div className="card-body">加载中...</div></div>
      </div>
    );
  }

  return (
    <div className="biographer-orders-page">
      <header className="page-header"><h1 className="page-title">我的订单</h1></header>

      <div className="card">
        <div className="card-header partner-center-list-header">
          <h3 className="card-title"><ClipboardList size={16} /> 传记订单</h3>
        </div>
        <div className="card-body partner-center-list-body">
          <div className="biographer-orders-filters">
            <div className="biographer-orders-search">
              <Search size={15} />
              <input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') applyFilters(); }}
                placeholder="搜索订单号、客户或服务"
              />
            </div>
            <select value={statusInput} onChange={(event) => setStatusInput(event.target.value as MockBiographerOrder['status'] | 'all')}>
              <option value="all">全部状态</option>
              {Object.entries(statusMap).map(([value, item]) => (
                <option value={value} key={value}>{item.label}</option>
              ))}
            </select>
            <button type="button" className="btn btn-primary btn-sm" onClick={applyFilters}>查询</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={resetFilters}>重置</button>
          </div>
          {filteredOrders.length === 0 ? (
            <div className="admin-table-empty">暂无符合条件的订单</div>
          ) : (
            <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>服务</th>
                  <th>客户</th>
                  <th>订单号</th>
                  <th>金额</th>
                  <th>采访安排</th>
                  <th>进度</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
              {filteredOrders.map((o) => {
                const nextAction = getNextAction(o);
                const doneCount = o.progress.filter((p) => p.status === 'done').length;
                const progressPct = Math.round((doneCount / progressNodes.length) * 100);
                return (
                  <tr key={o.id}>
                    <td className="admin-table-text-left">{o.serviceName}</td>
                    <td>{o.customerName || o.userId}</td>
                    <td>{o.orderId || o.id.slice(-8)}</td>
                    <td>¥{o.amount.toLocaleString()}</td>
                    <td>
                      {o.schedule?.time ? (
                        <span>{o.schedule.time}<br /><small className="admin-table-muted">{o.schedule.address}</small></span>
                      ) : (
                        <span className="admin-table-muted">待安排</span>
                      )}
                    </td>
                    <td>
                      <Annotate id="biographer-orders.progress" inline>
                      <div className="bio-order-progress-cell">
                        <div className="bio-order-progress-track"><div className="bio-order-progress-fill" style={{ width: `${progressPct}%` }} /></div>
                        <small className="admin-table-muted">{doneCount}/{progressNodes.length}</small>
                      </div>
                      </Annotate>
                    </td>
                    <td>
                      <Annotate id="biographer-orders.order-status" inline>
                      <span style={{ color: statusMap[o.status].color, fontWeight: 600 }}>{statusMap[o.status].label}</span>
                      </Annotate>
                    </td>
                    <td>
                      <button className="admin-table-link" onClick={() => setDetailOrder(o)}>详情</button>
                      {nextAction ? (
                        <Annotate id="biographer-orders.next-action" inline>
                        <button
                          className="admin-table-link"
                          disabled={processing}
                          onClick={() => handleAction(o)}
                        >
                          {nextAction.label}
                        </button>
                        </Annotate>
                      ) : (
                        <span className="admin-table-muted">—</span>
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

      {detailOrder && (
        <div className="modal-overlay" onClick={() => setDetailOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>订单详情 - {detailOrder.orderId || detailOrder.id}</h4>
              <button className="modal-close" onClick={() => setDetailOrder(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="bio-order-detail-grid">
                <div className="bio-order-detail-row"><span>服务</span><strong>{detailOrder.serviceName}</strong></div>
                <div className="bio-order-detail-row"><span>客户</span><strong>{detailOrder.customerName || detailOrder.userId}</strong></div>
                <div className="bio-order-detail-row"><span>订单金额</span><strong>¥{detailOrder.amount.toLocaleString()}</strong></div>
                <div className="bio-order-detail-row">
                  <span>订单状态</span>
                  <strong style={{ color: statusMap[detailOrder.status].color }}>{statusMap[detailOrder.status].label}</strong>
                </div>
                <div className="bio-order-detail-row"><span>采访时间</span><strong>{detailOrder.schedule?.time || '待安排'}</strong></div>
                <div className="bio-order-detail-row"><span>采访地点</span><strong>{detailOrder.schedule?.address || '待安排'}</strong></div>
                <div className="bio-order-detail-row"><span>截止时间</span><strong>{detailOrder.deadline ? new Date(detailOrder.deadline).toLocaleString() : '待安排'}</strong></div>
                <div className="bio-order-detail-row"><span>创建时间</span><strong>{new Date(detailOrder.createdAt).toLocaleString()}</strong></div>
                {detailOrder.remark && (
                  <div className="bio-order-detail-row bio-order-detail-full"><span>客户备注</span><strong>{detailOrder.remark}</strong></div>
                )}
              </div>
              <div className="bio-order-detail-progress-title">服务进度</div>
              <div className="bio-order-detail-progress">
                {detailOrder.progress.map((p) => (
                  <div className={`bio-order-detail-node ${p.status === 'done' ? 'done' : ''}`} key={p.node}>
                    <span className="bio-order-detail-node-name">{p.node}</span>
                    <span className="bio-order-detail-node-time">{p.status === 'done' ? (p.time ? new Date(p.time).toLocaleString() : '已完成') : '待处理'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmActionState && (
        <div className="modal-overlay" onClick={() => setConfirmActionState(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{confirmActionState.next.label}</h4>
              <button className="modal-close" onClick={() => setConfirmActionState(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.8 }}>
                订单「{confirmActionState.order.serviceName}」（客户：{confirmActionState.order.customerName || confirmActionState.order.userId}）当前进度节点为「{confirmActionState.next.node}」，确认执行「{confirmActionState.next.label}」吗？
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button className="btn btn-outline" onClick={() => setConfirmActionState(null)}>取消</button>
                <button className="btn btn-primary" disabled={processing} onClick={executeAction}>{processing ? '提交中…' : '确认'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {actingOrder && (
        <Annotate id="biographer-orders.schedule-modal">
        <div className="modal-overlay" onClick={() => setActingOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>预约采访</h4>
              <button className="modal-close" onClick={() => setActingOrder(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label><Calendar size={12} /> 采访时间</label>
                <input
                  type="text"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  placeholder="例如：2024-07-20 14:00"
                />
              </div>
              <div className="form-row">
                <label><MapPin size={12} /> 采访地点</label>
                <input
                  type="text"
                  value={scheduleAddress}
                  onChange={(e) => setScheduleAddress(e.target.value)}
                  placeholder="例如：杭州市西湖区某某小区 / 线上视频"
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 8 }}
                disabled={!scheduleTime || !scheduleAddress || processing}
                onClick={handleSchedule}
              >
                确认预约
              </button>
            </div>
          </div>
        </div>
        </Annotate>
      )}
    </div>
  );
}
