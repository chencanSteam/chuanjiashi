import { useEffect, useState } from 'react';
import { ClipboardList, Phone, User } from 'lucide-react';
import { biographerApi } from '../api/biographer';
import type { BiographerOrder as MockBiographerOrder } from '../mocks/types';
import './PartnerCenter.css';

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

export default function BiographerOrders() {
  const [orders, setOrders] = useState<MockBiographerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    biographerApi
      .myOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="partner-center-page">
        <header className="page-header"><h1 className="page-title">我的订单</h1></header>
        <div className="card"><div className="card-body">加载中...</div></div>
      </div>
    );
  }

  return (
    <div className="partner-center-page">
      <header className="page-header"><h1 className="page-title">我的订单</h1></header>

      <div className="card">
        <div className="card-header partner-center-list-header">
          <h3 className="card-title"><ClipboardList size={16} /> 传记订单</h3>
        </div>
        <div className="card-body partner-center-list-body">
          {orders.length === 0 ? (
            <div className="partner-center-empty">暂无订单</div>
          ) : (
            <div className="partner-center-customer-list">
              {orders.map((o) => (
                <div className="partner-center-customer" key={o.id}>
                  <div>
                    <div className="partner-center-customer-name">{o.serviceName}</div>
                    <div className="partner-center-customer-meta"><User size={12} /> 订单号 {o.id.slice(-8)}</div>
                    <div className="partner-center-customer-meta"><Phone size={12} /> 金额 ¥{o.amount.toFixed(2)}</div>
                  </div>
                  <div className="partner-center-customer-status">
                    <span style={{ color: statusMap[o.status].color, fontWeight: 500 }}>{statusMap[o.status].label}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
