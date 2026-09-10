import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../store/AppContext.js';
import { Money } from '../components/Money.js';
import { Spinner } from '../components/Spinner.js';
import { ErrorBanner } from '../components/ErrorBanner.js';
import { FormField } from '../components/FormField.js';
import type { Delivery } from '@checkout/contracts';
import { ApiError } from '../api/client.js';

export function Checkout() {
  const {
    cart,
    checkoutOptions,
    quote,
    loading,
    error,
    loadCheckoutOptions,
    createQuote,
    placeOrder,
    navigate,
    clearError,
  } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [delMethod, setDelMethod] = useState<'pickup' | 'courier'>('pickup');
  const [pickupPointId, setPickupPointId] = useState('point-center');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [apartment, setApartment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash_on_delivery'>('card');
  const [localError, setLocalError] = useState<ApiError | null>(null);

  useEffect(() => {
    loadCheckoutOptions();
  }, [loadCheckoutOptions]);

  const delivery: Delivery = useMemo(
    () =>
      delMethod === 'pickup'
        ? { method: 'pickup', pickupPointId }
        : {
            method: 'courier',
            address: { city, street, house, apartment: apartment || undefined },
          },
    [delMethod, pickupPointId, city, street, house, apartment],
  );

  const handleQuote = useCallback(async () => {
    setLocalError(null);
    try {
      await createQuote(delivery);
    } catch {}
  }, [createQuote, delivery]);

  // Auto-recalculate when delivery changes and quote already exists
  useEffect(() => {
    if (quote) createQuote(delivery).catch(() => {});
  }, [delivery]);

  const validate = (): string | null => {
    if (!name.trim()) return 'Введите имя';
    if (!email.includes('@')) return 'Введите email';
    if (!/^\+[1-9]\d{9,14}$/.test(phone)) return 'Телефон: + и 10–15 цифр';
    if (delMethod === 'courier') {
      if (!city.trim()) return 'Введите город';
      if (!street.trim()) return 'Введите улицу';
      if (!house.trim()) return 'Введите номер дома';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const msg = validate();
    if (msg) {
      setLocalError(new ApiError('CLIENT_VALIDATION', msg, undefined, ''));
      return;
    }
    try {
      await createQuote(delivery);
      await placeOrder({ name, email, phone }, paymentMethod);
      if (paymentMethod === 'card') {
        navigate('payment');
      } else {
        navigate('success');
      }
    } catch (err) {
      if (err instanceof ApiError) setLocalError(err);
    }
  };

  const err = localError || error;

  return (
    <div className="page checkout">
      <header className="page-header">
        <button className="btn btn-outline" onClick={() => navigate('cart')}>
          ← Корзина
        </button>
        <h1>Оформление заказа</h1>
      </header>

      {err && (
        <ErrorBanner
          error={err}
          onDismiss={() => {
            setLocalError(null);
            clearError();
          }}
        />
      )}
      {loading && <Spinner />}

      <form onSubmit={handleSubmit} className="checkout-form" noValidate>
        <fieldset>
          <legend>Контактные данные</legend>
          <FormField
            label="Имя"
            name="name"
            value={name}
            onChange={setName}
            error={err}
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={setEmail}
            error={err}
            required
            maxLength={150}
            autoComplete="email"
          />
          <FormField
            label="Телефон"
            name="phone"
            type="tel"
            value={phone}
            onChange={setPhone}
            error={err}
            required
            placeholder="+79990000000"
            autoComplete="tel"
          />
        </fieldset>

        <fieldset>
          <legend>Доставка</legend>
          <label className="radio-label">
            <input
              type="radio"
              name="delivery"
              checked={delMethod === 'pickup'}
              onChange={() => setDelMethod('pickup')}
            />
            Самовывоз
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="delivery"
              checked={delMethod === 'courier'}
              onChange={() => setDelMethod('courier')}
            />
            Курьер
          </label>

          {delMethod === 'pickup' && (
            <label>
              Пункт выдачи
              <select value={pickupPointId} onChange={(e) => setPickupPointId(e.target.value)}>
                {checkoutOptions?.deliveryMethods
                  .find((d) => d.id === 'pickup')
                  ?.pickupPoints.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} — {p.address}
                    </option>
                  ))}
              </select>
            </label>
          )}

          {delMethod === 'courier' && (
            <div className="address-fields">
              <label>
                Город
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  minLength={2}
                />
              </label>
              <label>
                Улица
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                  minLength={2}
                />
              </label>
              <label>
                Дом
                <input
                  type="text"
                  value={house}
                  onChange={(e) => setHouse(e.target.value)}
                  required
                />
              </label>
              <label>
                Квартира
                <input
                  type="text"
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                />
              </label>
            </div>
          )}

          <button
            type="button"
            className="btn btn-outline"
            disabled={loading}
            onClick={handleQuote}
          >
            Рассчитать стоимость
          </button>
        </fieldset>

        {quote && (
          <div className="quote-summary">
            <p>
              Товары: <Money value={quote.subtotal} />
            </p>
            <p>Доставка: {quote.shipping === 0 ? 'Бесплатно' : <Money value={quote.shipping} />}</p>
            <p className="total">
              Итого: <Money value={quote.total} />
            </p>
          </div>
        )}

        <fieldset>
          <legend>Оплата</legend>
          <label className="radio-label">
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === 'card'}
              onChange={() => setPaymentMethod('card')}
            />
            Картой онлайн
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === 'cash_on_delivery'}
              onChange={() => setPaymentMethod('cash_on_delivery')}
            />
            Наличными при получении
          </label>
        </fieldset>

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {paymentMethod === 'card' ? 'Перейти к оплате' : 'Оформить заказ'}
        </button>
      </form>
    </div>
  );
}
