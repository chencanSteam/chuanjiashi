import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Package } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderApi } from '../../api/order';
import type { Order } from '../../mocks/types';
import { useToast } from '../../hooks/useToast';
import './MobileCommerce.css';

export default function MobileOrderDetail() {
  const { id } = useParams(); const navigate = useNavigate(); const { addToast } = useToast(); const [order, setOrder] = useState<Order | null>(null);
  useEffect(() => { if (id) orderApi.get(id).then(setOrder).catch(() => addToast('订单不存在', 'error')); }, [id, addToast]);
  if (!order) return <div className="mobile-commerce"><div className="mobile-subpage-bar"><button type="button" onClick={() => navigate('/m/orders')}><ArrowLeft size={18} /></button><strong>订单详情</strong><span /></div><div className="mobile-commerce-state">订单加载中…</div></div>;
  return <div className="mobile-commerce"><div className="mobile-subpage-bar"><button type="button" onClick={() => navigate('/m/orders')}><ArrowLeft size={18} /></button><strong>订单详情</strong><span /></div><article className="mobile-detail-card"><div className="mobile-order-head"><span>{order.productName}</span><b>{order.status}</b></div><div className="mobile-detail-price">¥{order.amount}</div><dl><dt>订单号</dt><dd>{order.id}</dd><dt>下单时间</dt><dd>{new Date(order.createdAt).toLocaleString()}</dd><dt>商品类型</dt><dd>{order.type}</dd></dl>{order.address && <div className="mobile-detail-block"><h4><Package size={15} />收货地址</h4><p>{order.address.name} {order.address.phone}</p><p>{order.address.province}{order.address.city}{order.address.district}{order.address.detail}</p></div>}{order.logistics && <div className="mobile-detail-block"><h4>物流信息</h4><p>{order.logistics.company} · {order.logistics.trackingNo}</p></div>}{order.deliverables?.map((item) => <div className="mobile-detail-block" key={item.url}><h4><CheckCircle2 size={15} />交付物</h4><p>{item.name}</p></div>)}</article></div>;
}
