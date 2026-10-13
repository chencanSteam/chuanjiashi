import OrderServiceList from '../components/OrderServiceList';
import Annotate from '../components/annotation/Annotate';
import './BiographerOrders.css';

export default function BiographerOrders() {
  return (
    <div className="biographer-orders-page">
      <header className="page-header"><h1 className="page-title">我的订单</h1></header>
      <Annotate id="biographer-orders.service-orders">
        <OrderServiceList role="biographer" />
      </Annotate>
    </div>
  );
}
