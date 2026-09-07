import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, Headphones } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { orderApi } from '../../api/order'
import type { Order } from '../../mocks/types'
import './MobileCommerce.css'

export default function MobileAfterSale() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [history, setHistory] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    orderApi.list().then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const candidates = useMemo(
    () => orders.filter((order) => history
      ? !!order.refundRequest
      : (order.status === 'paid' || order.status === 'delivering') && !order.refundRequest),
    [orders, history],
  )

  return (
    <div className="mobile-commerce">
      <div className="mobile-subpage-bar">
        <button type="button" onClick={() => navigate('/m/profile')}><ArrowLeft size={18} /></button>
        <strong>售后服务</strong><span />
      </div>
      <div className="mobile-order-tabs">
        <button type="button" className={!history ? 'active' : ''} onClick={() => setHistory(false)}>待处理</button>
        <button type="button" className={history ? 'active' : ''} onClick={() => setHistory(true)}>售后记录</button>
      </div>
      {loading ? <div className="mobile-commerce-state">加载中…</div> : candidates.length === 0 ? (
        <div className="mobile-commerce-state"><Headphones size={38} /><p>{history ? '暂无售后记录' : '暂无可申请售后的订单'}</p></div>
      ) : (
        <div className="mobile-order-list">
          {candidates.map((order) => (
            <article className="mobile-order-card" key={order.id}>
              <div className="mobile-order-head"><span>{order.productName}</span><b>{order.refundRequest ? order.refundRequest.status === 'completed' ? '退款完成' : order.refundRequest.status === 'rejected' ? '申请驳回' : '审核中' : '可申请退款'}</b></div>
              <div className="mobile-order-meta"><span>订单号 {order.id}</span><span>¥{order.amount}</span></div>
              {order.refundRequest && <p className="mobile-after-sale-note"><CheckCircle2 size={14} />申请原因：{order.refundRequest.reason}{order.refundRequest.rejectionReason ? `；${order.refundRequest.rejectionReason}` : ''}</p>}
              {!history && <button className="mobile-order-action-full" type="button" onClick={() => navigate(`/m/after-sale/apply?orderId=${order.id}`)}>申请退款</button>}
              {history && order.refundRequest?.status === 'rejected' && <button className="mobile-order-action-full" type="button" onClick={() => navigate(`/m/after-sale/result?orderId=${order.id}`)}>查看处理结果</button>}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
