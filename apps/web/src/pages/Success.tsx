import { useEffect } from 'react';
import { useApp } from '../store/AppContext.js';
import { Money } from '../components/Money.js';
import { clearSession } from '../store/session.js';

export function Success() {
  const { order, navigate, resetOrder } = useApp();

  useEffect(() => {
    clearSession();
  }, []);

  if (!order) {
    return (
      <div className="page success">
        <p>Заказ не найден</p>
        <button className="btn btn-outline" onClick={() => navigate('catalog')}>
          К каталогу
        </button>
      </div>
    );
  }

  const isPaid = order.paymentMethod === 'card' && order.status === 'paid';
  const isCash = order.paymentMethod === 'cash_on_delivery';

  return (
    <div className="page success">
      <header className="page-header">
        <h1>{isPaid ? 'Заказ оплачен' : 'Заказ оформлен'}</h1>
      </header>

      <div className="success-card">
        <p className="order-number">Заказ №{order.number}</p>

        {isCash && <p className="cash-notice">Оплата при получении</p>}

        <section>
          <h2>Товары</h2>
          {order.items.map((item) => (
            <div key={item.productId} className="success-item">
              <span>
                {item.title} × {item.quantity}
              </span>
              <Money value={item.lineTotal} />
            </div>
          ))}
        </section>

        <section>
          <h2>Доставка</h2>
          {order.delivery.method === 'pickup' ? (
            <p>Самовывоз: {order.delivery.pickupPointId}</p>
          ) : (
            <p>
              Курьер: {order.delivery.address.city}, {order.delivery.address.street}, д.{' '}
              {order.delivery.address.house}
              {order.delivery.address.apartment ? `, кв. ${order.delivery.address.apartment}` : ''}
            </p>
          )}
        </section>

        <div className="success-totals">
          <p>
            Товары: <Money value={order.subtotal} />
          </p>
          <p>Доставка: {order.shipping === 0 ? 'Бесплатно' : <Money value={order.shipping} />}</p>
          <p className="total">
            Итого: <Money value={order.total} />
          </p>
        </div>

        <button className="btn btn-primary" onClick={resetOrder}>
          Новый заказ
        </button>
      </div>
    </div>
  );
}
