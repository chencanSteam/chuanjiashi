import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, ClipboardList, CreditCard, Package, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../../api/order';
import type { Order, OrderStatus } from '../../mocks/types';
import './MobileCommerce.css';

const statuses: Array<{ key: 'all' | OrderStatus; label: string }> = [{ key: 'all', label: '全部' }, { key: 'pending_pay', label: '待支付' }, { key: 'paid', label: '已支付' }, { key: 'delivering', label: '服务中' }, { key: 'completed', label: '已完成' }, { key: 'refunded', label: '已退款' }];
const statusText: Record<OrderStatus, string> = { pending_pay: '待支付', paid: '已支付', delivering: '服务中', completed: '已完成', refunded: '已退款', closed: '已关闭' };

export default function MobileOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    orderApi.list()
      .then(setOrders)
      .catch(() => {
        // 订单服务不可用时保持移动端空态，不使用全局 Toast，避免提示跑出手机容器。
        setOrders([]);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const visible = useMemo(() => filter === 'all' ? orders : orders.filter((order) => order.status === filter), [orders, filter]);
  const pay = (order: Order) => { navigate(`/m/payment?orderId=${order.id}&method=wechat`); };
  return <div className="mobile-commerce"><div className="mobile-subpage-bar"><button type="button" onClick={() => navigate('/m/profile')}><ArrowLeft size={18} /></button><strong>我的订单</strong><button type="button" onClick={load}><RefreshCw size={16} /></button></div><div className="mobile-order-tabs">{statuses.map((item) => <button type="button" key={item.key} className={filter === item.key ? 'active' : ''} onClick={() => setFilter(item.key)}>{item.label}</button>)}</div>{loading ? <div className="mobile-commerce-state">加载中…</div> : visible.length === 0 ? <div className="mobile-commerce-state"><ClipboardList size={38} /><p>暂无订单</p></div> : <div className="mobile-order-list">{visible.map((order) => <article className="mobile-order-card" key={order.id}><div className="mobile-order-head"><span>{order.productName}</span><b>{statusText[order.status]}</b></div><div className="mobile-order-meta"><span>订单号 {order.id}</span><span>{new Date(order.createdAt).toLocaleDateString()}</span></div><div className="mobile-order-summary"><Package size={17} /><span>{order.type} · {order.quantity || 1} 件</span><strong>¥{order.amount}</strong></div><div className="mobile-order-actions"><button type="button" onClick={() => navigate(`/m/orders/${order.id}`)}>查看详情 <ChevronRight size={14} /></button>{order.status === 'pending_pay' && <button type="button" className="primary" onClick={() => pay(order)}><CreditCard size={14} />去支付</button>}</div></article>)}</div>}</div>;
}
