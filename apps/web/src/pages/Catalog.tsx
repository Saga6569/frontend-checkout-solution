import { useEffect } from 'react';
import { useApp } from '../store/AppContext.js';
import { Money } from '../components/Money.js';
import { Spinner } from '../components/Spinner.js';
import { ErrorBanner } from '../components/ErrorBanner.js';

export function Catalog() {
  const { products, cart, loading, error, loadProducts, addToCart, navigate, clearError } =
    useApp();

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const inCart = (productId: string) => cart?.items.find((i) => i.productId === productId);

  return (
    <div className="page catalog">
      <header className="page-header">
        <h1>Каталог</h1>
        <button className="btn btn-outline" onClick={() => navigate('cart')}>
          Корзина{cart?.quantity ? ` (${cart.quantity})` : ''}
        </button>
      </header>

      {error && <ErrorBanner error={error} onDismiss={clearError} />}
      {loading && !products.length && <Spinner />}

      <div className="product-grid">
        {products.map((p) => {
          const item = inCart(p.id);
          return (
            <div key={p.id} className="product-card">
              <h2>{p.title}</h2>
              <p className="desc">{p.description}</p>
              <p className="price">
                <Money value={p.price} />
              </p>
              <p className="stock">{p.stock === 0 ? 'Нет в наличии' : `Остаток: ${p.stock}`}</p>
              {p.stock > 0 && (
                <button
                  className="btn btn-primary"
                  disabled={loading || !!item}
                  onClick={() => addToCart(p.id, 1).catch(() => {})}
                >
                  {item ? `В корзине (${item.quantity})` : 'В корзину'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
