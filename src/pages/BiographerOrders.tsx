import BiographerServiceOrders from '../components/BiographerServiceOrders';
import Annotate from '../components/annotation/Annotate';
import './BiographerOrders.css';

export default function BiographerOrders() {
  return (
    <div className="biographer-orders-page">
      <header className="page-header"><h1 className="page-title">我的订单</h1></header>
      <Annotate id="biographer-orders.service-orders">
        <BiographerServiceOrders role="biographer" />
      </Annotate>
    </div>
  );
}
