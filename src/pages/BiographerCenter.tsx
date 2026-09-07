import { useEffect, useMemo, useState } from 'react';
import { User, Phone, Mail, Calendar, ClipboardList, Clock3, CheckCircle2, ArrowRight, PenLine, Wallet, Eye, Settings, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { biographerApi } from '../api/biographer';
import type { Biographer as MockBiographer, BiographerOrder } from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import './PartnerCenter.css';
import './BiographerOrders.css';
import './BiographerCenter.css';

const statusMap: Record<BiographerOrder['status'], { label: string; color: string }> = {
  pending_schedule: { label: '待预约采访', color: '#d97706' },
  interview_scheduled: { label: '已预约采访', color: '#7c3aed' },
  draft_submitted: { label: '已提交初稿', color: '#2563eb' },
  modifying: { label: '修改中', color: '#d97706' },
  final_submitted: { label: '已提交终稿', color: '#2563eb' },
  completed: { label: '已完成', color: '#1B5E4B' },
  after_sales: { label: '售后中', color: '#ef4444' },
};

const pendingStatuses: BiographerOrder['status'][] = ['pending_schedule', 'interview_scheduled'];
const activeStatuses: BiographerOrder['status'][] = ['draft_submitted', 'modifying', 'final_submitted'];
const completedStatuses: BiographerOrder['status'][] = ['completed', 'after_sales'];

function formatDeadline(deadline?: string): string {
  if (!deadline) return '待安排';
  return new Date(deadline).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

export default function BiographerCenter() {
  const navigate = useNavigate();
  const [biographer, setBiographer] = useState<MockBiographer | null>(null);
  const [orders, setOrders] = useState<BiographerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([biographerApi.me(), biographerApi.myOrders()]).then(([profileResult, ordersResult]) => {
      if (profileResult.status === 'fulfilled') setBiographer(profileResult.value);
      if (ordersResult.status === 'fulfilled') setOrders(ordersResult.value);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((order) => pendingStatuses.includes(order.status)).length,
    active: orders.filter((order) => activeStatuses.includes(order.status)).length,
    completed: orders.filter((order) => completedStatuses.includes(order.status)).length,
  }), [orders]);

  const todoOrders = useMemo(
    () => orders.filter((order) => order.status !== 'completed').slice(0, 4),
    [orders],
  );
  const monthIncome = useMemo(
    () => orders.filter((order) => order.status === 'completed').reduce((sum, order) => sum + order.amount * 0.85, 0),
    [orders],
  );

  if (loading) {
    return (
      <div className="partner-center-page">
        <header className="page-header"><h1 className="page-title">工作台</h1></header>
        <div className="card"><div className="card-body">加载中...</div></div>
      </div>
    );
  }

  return (
    <div className="partner-center-page">
      <header className="page-header biographer-workbench-header">
        <div>
          <p className="biographer-workbench-eyebrow">传记师工作台</p>
          <h1 className="page-title">欢迎回来，{biographer?.name || '传记师'}</h1>
          <p className="page-subtitle">把每一段人生故事，认真写成值得珍藏的作品。</p>
        </div>
        <div className="biographer-workbench-actions">
          <button className="btn btn-outline" onClick={() => navigate('/biographer/profile')}><Eye size={14} /> 查看主页</button>
          <button className="btn btn-primary" onClick={() => navigate('/biographer/orders')}><ClipboardList size={14} /> 管理订单</button>
        </div>
      </header>

      <div className="biographer-workbench-status">
        <span className="biographer-status-dot" /> 接单中
        <span className="biographer-status-divider" />
        {biographer?.certificationLevel === 'gold' ? '金牌传记师' : '认证传记师'}
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/biographer/profile/edit')}><Settings size={13} /> 编辑服务资料</button>
      </div>

      <div className="biographer-workbench-kpis">
        <div className="card biographer-workbench-kpi"><Clock3 size={22} color="#d97706" /><div><div className="biographer-workbench-kpi-value">{stats.pending}</div><div className="biographer-workbench-kpi-label">待处理订单</div><small>需要你及时跟进</small></div></div>
        <div className="card biographer-workbench-kpi"><PenLine size={22} color="#2563eb" /><div><div className="biographer-workbench-kpi-value">{stats.active}</div><div className="biographer-workbench-kpi-label">进行中订单</div><small>正在交付服务</small></div></div>
        <div className="card biographer-workbench-kpi"><Wallet size={22} color="#1B5E4B" /><div><div className="biographer-workbench-kpi-value">¥{Math.round(monthIncome).toLocaleString()}</div><div className="biographer-workbench-kpi-label">本月收入</div><small>按 85% 预计入账</small></div></div>
        <div className="card biographer-workbench-kpi"><CheckCircle2 size={22} color="#1B5E4B" /><div><div className="biographer-workbench-kpi-value">{stats.completed}</div><div className="biographer-workbench-kpi-label">已完成订单</div><small>累计服务客户</small></div></div>
      </div>

      <div className="partner-center-dashboard">
        {biographer && (
          <Annotate id="biographer-center.profile">
          <div className="card">
            <div className="card-header"><h3 className="card-title"><User size={16} /> 我的资料</h3></div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0f2f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#1B5E4B' }}>
                  {biographer.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}>{biographer.name}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{biographer.intro}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13, color: '#4b5563' }}>
                <div><Phone size={12} /> {biographer.phone}</div>
                {biographer.email && <div><Mail size={12} /> {biographer.email}</div>}
                <div><Calendar size={12} /> 从业 {biographer.experience} 年</div>
              </div>
            </div>
          </div>
          </Annotate>
        )}

        <div className="biographer-workbench-columns">
          <div className="card">
            <div className="card-header"><h3 className="card-title"><MessageCircle size={16} /> 今日待办</h3></div>
            <div className="card-body">
              {todoOrders.length === 0 ? <div className="admin-table-empty">暂无待办，今天也要保持好状态。</div> : (
                <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>客户</th><th>服务</th><th>下一步</th><th>截止时间</th><th>操作</th></tr>
                  </thead>
                  <tbody>
                    {todoOrders.map((order) => {
                      const next = order.progress.find((item) => item.status === 'pending');
                      return (
                        <tr key={order.id}>
                          <td>{order.customerName || order.userId}</td>
                          <td className="admin-table-text-left">{order.serviceName}</td>
                          <td>{next?.node || '等待客户确认'}</td>
                          <td>{formatDeadline(order.deadline)}</td>
                          <td><button className="admin-table-link" onClick={() => navigate('/biographer/orders')}>去处理</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </div>
          <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title"><ClipboardList size={16} /> 最近订单</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/biographer/orders')}>查看全部 <ArrowRight size={14} /></button>
          </div>
          <div className="card-body">
            {orders.length === 0 ? (
              <div className="admin-table-empty">暂无订单</div>
            ) : (
              <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>服务</th><th>客户</th><th>金额</th><th>截止时间</th><th>进度</th><th>状态</th></tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((order) => {
                    const status = statusMap[order.status];
                    const done = order.progress.filter((item) => item.status === 'done').length;
                    return (
                      <tr key={order.id}>
                        <td className="admin-table-text-left">{order.serviceName}</td>
                        <td>{order.customerName || order.userId}</td>
                        <td>¥{order.amount.toLocaleString()}</td>
                        <td>{formatDeadline(order.deadline)}</td>
                        <td>
                          <div className="bio-order-progress-cell">
                            <div className="bio-order-progress-track"><div className="bio-order-progress-fill" style={{ width: `${order.progress.length ? (done / order.progress.length) * 100 : 0}%` }} /></div>
                            <small className="admin-table-muted">{done}/{order.progress.length}</small>
                          </div>
                        </td>
                        <td><span style={{ color: status.color, fontWeight: 600 }}>{status.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
