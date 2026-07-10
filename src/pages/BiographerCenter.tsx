import { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle, Clock, User, Phone, Mail, Star, Calendar } from 'lucide-react';
import { biographerApi } from '../api/biographer';
import type { Biographer as MockBiographer, BiographerOrder as MockBiographerOrder } from '../mocks/types';
import './PartnerCenter.css';

export default function BiographerCenter() {
  const [biographer, setBiographer] = useState<MockBiographer | null>(null);
  const [orders, setOrders] = useState<MockBiographerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      biographerApi.me().then(setBiographer).catch(() => setBiographer(null)),
      biographerApi.myOrders().then(setOrders).catch(() => setOrders([])),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="partner-center-page">
        <header className="page-header"><h1 className="page-title">工作台</h1></header>
        <div className="card"><div className="card-body">加载中...</div></div>
      </div>
    );
  }

  const pending = orders.filter((o) => ['pending_deposit', 'paid_deposit', 'interview_scheduled'].includes(o.status)).length;
  const inProgress = orders.filter((o) => ['draft_submitted', 'modifying', 'final_submitted'].includes(o.status)).length;
  const completed = orders.filter((o) => ['paid_full', 'completed', 'after_sales'].includes(o.status)).length;

  return (
    <div className="partner-center-page">
      <header className="page-header"><h1 className="page-title">工作台</h1></header>

      <div className="partner-center-dashboard">
        <div className="partner-center-stats">
          <div className="card partner-center-stat"><ClipboardList size={20} color="#1B5E4B" /><div><div className="partner-center-stat-value">{orders.length}</div><div className="partner-center-stat-label">全部订单</div></div></div>
          <div className="card partner-center-stat"><Clock size={20} color="#d97706" /><div><div className="partner-center-stat-value">{pending}</div><div className="partner-center-stat-label">待处理</div></div></div>
          <div className="card partner-center-stat"><Star size={20} color="#2563eb" /><div><div className="partner-center-stat-value">{inProgress}</div><div className="partner-center-stat-label">进行中</div></div></div>
          <div className="card partner-center-stat"><CheckCircle size={20} color="#7c3aed" /><div><div className="partner-center-stat-value">{completed}</div><div className="partner-center-stat-label">已完成</div></div></div>
        </div>

        {biographer && (
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
        )}
      </div>
    </div>
  );
}
