import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, FileText, ArrowRight, Copy } from 'lucide-react';
import { orderApi } from '../api/order';
import { useToast } from '../hooks/useToast';
import Annotate from '../components/annotation/Annotate';
import type { Order } from '../mocks/types';
import './OrderSuccess.css';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    orderApi
      .get(orderId)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  const needsAddress = order?.type === 'book' || order?.type === 'derivative';

  return (
    <div className="order-success-page">
      <div className="order-success-card">
        <div className="order-success-icon">
          <CheckCircle size={48} />
        </div>
        <h1 className="order-success-title">支付成功</h1>
        <p className="order-success-subtitle">感谢您对传家世的信任，我们已收到您的订单</p>

        {loading ? (
          <div className="order-success-loading">加载订单信息…</div>
        ) : order ? (
          <Annotate id="order-success.order-info">
          <div className="order-success-info">
            <div className="order-success-row">
              <span>订单号</span>
              <span className="order-success-order-id">
                {order.id}
                <button className="order-success-copy" onClick={() => { navigator.clipboard.writeText(order.id); addToast('订单号已复制', 'success'); }}>
                  <Copy size={12} />
                </button>
              </span>
            </div>
            <div className="order-success-row">
              <span>商品</span>
              <span>{order.productName}</span>
            </div>
            <div className="order-success-row">
              <span>实付金额</span>
              <span className="order-success-amount">¥{order.amount.toLocaleString()}</span>
            </div>
            <div className="order-success-row">
              <span>当前状态</span>
              <span className="order-success-status">已支付，等待商家履约</span>
            </div>
          </div>
          </Annotate>
        ) : (
          <div className="order-success-info">
            <div className="order-success-row">
              <span>当前状态</span>
              <span className="order-success-status">已支付，等待商家履约</span>
            </div>
          </div>
        )}

        <Annotate id="order-success.tips">
        <div className="order-success-tips">
          {needsAddress ? (
            <>
              <Package size={16} />
              <span>实体商品将在 1-3 个工作日内发货，您可在「我的订单」中查看物流进度。</span>
            </>
          ) : (
            <>
              <FileText size={16} />
              <span>数字服务将在确认后生成，您可在「我的订单」中查看交付物。</span>
            </>
          )}
        </div>
        </Annotate>

        <Annotate id="order-success.actions" inline>
        <div className="order-success-actions">
          <button className="btn btn-primary" onClick={() => navigate('/my-orders')}>
            查看我的订单 <ArrowRight size={14} />
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/home')}>
            返回首页
          </button>
        </div>
        </Annotate>
      </div>
    </div>
  );
}
