import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Phone, User, Calendar, MapPin, CheckCircle, Clock, CreditCard, MessageCircle } from 'lucide-react';
import { biographerApi } from '../api/biographer';
import type { BiographerOrder as MockBiographerOrder, Biographer } from '../mocks/types';
import './MyBiographerOrders.css';

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

export default function MyBiographerOrders() {
  const [orders, setOrders] = useState<MockBiographerOrder[]>([]);
  const [biographers, setBiographers] = useState<Record<string, Biographer>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([biographerApi.orders(), biographerApi.list()])
      .then(([orderList, bioList]) => {
        setOrders(orderList);
        const map: Record<string, Biographer> = {};
        bioList.forEach((b) => (map[b.id] = b));
        setBiographers(map);
      })
      .catch(() => {
        setOrders([]);
        setBiographers({});
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status !== 'completed' && o.status !== 'after_sales').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      totalAmount: orders.reduce((sum, o) => sum + o.amount, 0),
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="my-bio-orders-page">
        <header className="page-header"><h1 className="page-title">我的传记师订单</h1></header>
        <div className="card"><div className="card-body">加载中...</div></div>
      </div>
    );
  }

  return (
    <div className="my-bio-orders-page">
      <header className="page-header"><h1 className="page-title">我的传记师订单</h1></header>

      <div className="my-bio-order-stats">
        <div className="card my-bio-order-stat-card">
          <ClipboardList size={20} color="#1B5E4B" />
          <div>
            <div className="my-bio-order-stat-value">{stats.total}</div>
            <div className="my-bio-order-stat-label">订单总数</div>
          </div>
        </div>
        <div className="card my-bio-order-stat-card">
          <Clock size={20} color="#d97706" />
          <div>
            <div className="my-bio-order-stat-value">{stats.pending}</div>
            <div className="my-bio-order-stat-label">进行中</div>
          </div>
        </div>
        <div className="card my-bio-order-stat-card">
          <CheckCircle size={20} color="#1B5E4B" />
          <div>
            <div className="my-bio-order-stat-value">{stats.completed}</div>
            <div className="my-bio-order-stat-label">已完成</div>
          </div>
        </div>
        <div className="card my-bio-order-stat-card">
          <CreditCard size={20} color="#2563eb" />
          <div>
            <div className="my-bio-order-stat-value">¥{stats.totalAmount.toLocaleString()}</div>
            <div className="my-bio-order-stat-label">累计金额</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header partner-center-list-header">
          <h3 className="card-title"><ClipboardList size={16} /> 订单列表</h3>
        </div>
        <div className="card-body partner-center-list-body">
          {orders.length === 0 ? (
            <div className="partner-center-empty">
              <MessageCircle size={48} color="#d1d5db" />
              <p>暂无传记师订单</p>
              <span>您可以在「找传记师」中预约专业传记师</span>
            </div>
          ) : (
            <div className="my-bio-order-list">
              {orders.map((o) => {
                const bio = biographers[o.biographerId];
                const doneCount = o.progress.filter((p) => p.status === 'done').length;
                const progressPct = Math.round((doneCount / progressNodes.length) * 100);
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
                      <div className="my-bio-order-status">
                        <span style={{ color: statusMap[o.status].color, fontWeight: 600 }}>{statusMap[o.status].label}</span>
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
                        {progressNodes.map((node) => {
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
      </div>
    </div>
  );
}
