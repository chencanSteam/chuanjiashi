import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Phone, User, Calendar, MapPin, CheckCircle, Clock, ArrowRight, FileText, Send, Package, CreditCard } from 'lucide-react';
import { biographerApi } from '../api/biographer';
import type { BiographerOrder as MockBiographerOrder } from '../mocks/types';
import './BiographerOrders.css';

const statusMap: Record<MockBiographerOrder['status'], { label: string; color: string }> = {
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

const progressNodes = ['支付定金', '预约采访', '提交初稿', '修改完善', '支付尾款', '交付定稿'];

function getNextAction(order: MockBiographerOrder): { node: string; label: string; icon: typeof CheckCircle } | null {
  const pending = order.progress.find((p) => p.status === 'pending');
  if (!pending) return null;
  const iconMap: Record<string, typeof CheckCircle> = {
    '支付定金': CreditCard,
    '预约采访': Calendar,
    '提交初稿': FileText,
    '修改完善': Send,
    '支付尾款': CreditCard,
    '交付定稿': Package,
  };
  const labelMap: Record<string, string> = {
    '支付定金': '确认定金已付',
    '预约采访': '预约采访时间',
    '提交初稿': '提交初稿',
    '修改完善': '确认修改完成',
    '支付尾款': '确认尾款已付',
    '交付定稿': '交付定稿',
  };
  return { node: pending.node, label: labelMap[pending.node], icon: iconMap[pending.node] };
}

export default function BiographerOrders() {
  const [orders, setOrders] = useState<MockBiographerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOrder, setActingOrder] = useState<MockBiographerOrder | null>(null);
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleAddress, setScheduleAddress] = useState('');
  const [processing, setProcessing] = useState(false);

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

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status !== 'completed').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      totalAmount: orders.reduce((sum, o) => sum + o.amount, 0),
    };
  }, [orders]);

  const handleAction = async (order: MockBiographerOrder) => {
    const next = getNextAction(order);
    if (!next) return;
    if (next.node === '预约采访') {
      setActingOrder(order);
      setScheduleTime(order.schedule?.time || '');
      setScheduleAddress(order.schedule?.address || '');
      return;
    }
    try {
      setProcessing(true);
      await biographerApi.updateProgress(order.id, next.node);
      loadOrders();
    } finally {
      setProcessing(false);
    }
  };

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

      <div className="bio-order-stats">
        <div className="card bio-order-stat-card">
          <ClipboardList size={20} color="#1B5E4B" />
          <div>
            <div className="bio-order-stat-value">{stats.total}</div>
            <div className="bio-order-stat-label">订单总数</div>
          </div>
        </div>
        <div className="card bio-order-stat-card">
          <Clock size={20} color="#d97706" />
          <div>
            <div className="bio-order-stat-value">{stats.pending}</div>
            <div className="bio-order-stat-label">进行中</div>
          </div>
        </div>
        <div className="card bio-order-stat-card">
          <CheckCircle size={20} color="#1B5E4B" />
          <div>
            <div className="bio-order-stat-value">{stats.completed}</div>
            <div className="bio-order-stat-label">已完成</div>
          </div>
        </div>
        <div className="card bio-order-stat-card">
          <CreditCard size={20} color="#2563eb" />
          <div>
            <div className="bio-order-stat-value">¥{stats.totalAmount.toLocaleString()}</div>
            <div className="bio-order-stat-label">累计金额</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header partner-center-list-header">
          <h3 className="card-title"><ClipboardList size={16} /> 传记订单</h3>
        </div>
        <div className="card-body partner-center-list-body">
          {orders.length === 0 ? (
            <div className="partner-center-empty">暂无订单</div>
          ) : (
            <div className="bio-order-list">
              {orders.map((o) => {
                const nextAction = getNextAction(o);
                const doneCount = o.progress.filter((p) => p.status === 'done').length;
                const progressPct = Math.round((doneCount / progressNodes.length) * 100);
                return (
                  <div className="bio-order-item" key={o.id}>
                    <div className="bio-order-main">
                      <div className="bio-order-info">
                        <div className="bio-order-service">{o.serviceName}</div>
                        <div className="bio-order-meta">
                          <span><User size={12} /> 订单号 {o.id.slice(-8)}</span>
                          <span><Phone size={12} /> 金额 ¥{o.amount.toLocaleString()}</span>
                          <span>定金 ¥{o.deposit.toLocaleString()}</span>
                        </div>
                        {o.schedule?.time && (
                          <div className="bio-order-schedule">
                            <Calendar size={12} /> {o.schedule.time}
                            <MapPin size={12} /> {o.schedule.address}
                          </div>
                        )}
                      </div>
                      <div className="bio-order-status">
                        <span style={{ color: statusMap[o.status].color, fontWeight: 600 }}>{statusMap[o.status].label}</span>
                      </div>
                    </div>

                    <div className="bio-order-progress">
                      <div className="bio-order-progress-header">
                        <span>服务进度</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="bio-order-progress-track">
                        <div className="bio-order-progress-fill" style={{ width: `${progressPct}%` }} />
                      </div>
                      <div className="bio-order-progress-nodes">
                        {progressNodes.map((node) => {
                          const p = o.progress.find((x) => x.node === node);
                          const done = p?.status === 'done';
                          return (
                            <div key={node} className={`bio-order-progress-node ${done ? 'done' : ''}`}>
                              <div className="bio-order-progress-dot">{done && <CheckCircle size={10} />}</div>
                              <span>{node}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {nextAction && (
                      <div className="bio-order-actions">
                        <button
                          className="btn btn-primary"
                          disabled={processing}
                          onClick={() => handleAction(o)}
                        >
                          <nextAction.icon size={14} /> {nextAction.label}
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {actingOrder && (
        <div className="modal-overlay" onClick={() => setActingOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>预约采访</h4>
              <button className="modal-close" onClick={() => setActingOrder(null)}><Clock size={16} /></button>
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
      )}
    </div>
  );
}
