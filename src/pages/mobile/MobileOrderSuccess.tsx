import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, ClipboardList } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderApi } from '../../api/order';
import type { Order } from '../../mocks/types';
import './MobileCommerce.css';
export default function MobileOrderSuccess() { const [params] = useSearchParams(); const navigate = useNavigate(); const [order, setOrder] = useState<Order | null>(null); useEffect(() => { const id = params.get('orderId'); if (id) orderApi.get(id).then(setOrder).catch(() => undefined); }, [params]); return <div className="mobile-commerce mobile-success"><div className="mobile-subpage-bar"><button type="button" onClick={() => navigate('/m/profile')}><ArrowLeft size={18} /></button><strong>支付结果</strong><span /></div><div className="mobile-success-card"><CheckCircle2 size={58} /><h2>支付成功</h2><p>{order ? `订单号：${order.id}` : '订单已创建，请在订单中查看详情'}</p>{order && <strong>¥{order.amount}</strong>}<div><button type="button" onClick={() => navigate(order ? `/m/orders/${order.id}` : '/m/orders')}><ClipboardList size={15} />查看订单</button><button type="button" onClick={() => navigate('/m')}>返回首页</button></div></div></div>; }
