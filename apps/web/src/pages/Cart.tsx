import { useMemo } from 'react';
import { useApp } from '../store/AppContext.js';
import { Money } from '../components/Money.js';
import { Spinner } from '../components/Spinner.js';
import { ErrorBanner } from '../components/ErrorBanner.js';

const noop = () => {};

export function Cart() {
  const { cart, products, loading, error, updateCartItem, removeFromCart, navigate, clearError } =
    useApp();

  const stockMap = useMemo(() => new Map(products.map((p) => [p.id, p.stock])), [products]);
  const items = cart?.items ?? [];

  return (
    <div className="page cart">
      <header className="page-header">
        <button className="btn btn-outline" onClick={() => navigate('catalog')}>
          ← Каталог
        </button>
        <h1>Корзина</h1>
      </header>

      {error && <ErrorBanner error={error} onDismiss={clearError} />}

      {!items.length && !loading && <p>Корзина пуста</p>}

      {items.map((item) => {
        const stock = stockMap.get(item.productId) ?? 99;
        return (
          <div key={item.productId} className="cart-item">
            <div className="cart-item-info">
              <h3>{item.title}</h3>
              <p>
                <Money value={item.unitPrice} /> × {item.quantity}
              </p>
            </div>
            <div className="cart-item-actions">
              <button
                className="btn btn-sm"
                disabled={loading || item.quantity <= 1}
                onClick={() => updateCartItem(item.productId, item.quantity - 1).catch(noop)}
              >
                −
              </button>
              <span className="qty">{item.quantity}</span>
              <button
                className="btn btn-sm"
                disabled={loading || item.quantity >= stock}
                onClick={() => updateCartItem(item.productId, item.quantity + 1).catch(noop)}
              >
                +
              </button>
              <button
                className="btn btn-sm btn-danger"
                disabled={loading}
                onClick={() => removeFromCart(item.productId).catch(noop)}
              >
                Удалить
              </button>
            </div>
            <div className="cart-item-total">
              <Money value={item.lineTotal} />
            </div>
          </div>
        );
      })}

      {items.length > 0 && (
        <div className="cart-footer">
          <p className="cart-total">
            Итого: <Money value={cart!.subtotal} />
          </p>
          <button
            className="btn btn-primary btn-lg"
            disabled={loading}
            onClick={() => navigate('checkout')}
          >
            Оформить заказ
          </button>
        </div>
      )}

      {loading && <Spinner />}
    </div>
  );
}
