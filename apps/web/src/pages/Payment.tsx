import { useState, useEffect, useRef } from 'react';
import { useApp } from '../store/AppContext.js';
import { Money } from '../components/Money.js';
import { Spinner } from '../components/Spinner.js';
import { ErrorBanner } from '../components/ErrorBanner.js';
import { usePolling } from '../hooks/usePolling.js';
import { getSandbox } from '../api/endpoints.js';
import type { Scenario } from '@checkout/contracts';
import { Static } from '@sinclair/typebox';
import { SandboxSchema } from '@checkout/contracts';

type Sandbox = Static<typeof SandboxSchema>;

export function Payment() {
  const {
    order,
    payment,
    loading,
    error,
    startPayment,
    simulatePay,
    pollPayment,
    retryPayment,
    navigate,
    clearError,
  } = useApp();

  const [sandbox, setSandbox] = useState<Sandbox | null>(null);
  const [selectedCard, setSelectedCard] = useState<string>('');
  const [pollingActive, setPollingActive] = useState(false);

  useEffect(() => {
    getSandbox()
      .then(setSandbox)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (sandbox?.cards.length) {
      setSelectedCard(sandbox.cards[0].id);
    }
  }, [sandbox]);

  const isTerminal =
    payment?.status === 'succeeded' ||
    payment?.status === 'failed' ||
    payment?.status === 'cancelled';

  useEffect(() => {
    if (payment && !isTerminal) {
      setPollingActive(true);
    }
  }, [payment?.id, isTerminal]);

  usePolling(
    async () => {
      const done = await pollPayment();
      if (done) setPollingActive(false);
      return done;
    },
    pollingActive,
    2000,
  );

  const handleStartPayment = () => {
    startPayment().catch(() => {});
  };

  const handleSimulate = (scenario: Scenario) => {
    simulatePay(scenario).catch(() => {});
  };

  const handleRetry = () => {
    retryPayment();
  };

  if (!order) {
    return (
      <div className="page payment">
        <p>Заказ не найден</p>
        <button className="btn btn-outline" onClick={() => navigate('catalog')}>
          К каталогу
        </button>
      </div>
    );
  }

  return (
    <div className="page payment">
      <header className="page-header">
        <h1>Оплата заказа {order.number}</h1>
      </header>

      {error && <ErrorBanner error={error} onDismiss={clearError} />}

      <div className="order-summary-mini">
        <p>
          Сумма: <Money value={order.total} />
        </p>
      </div>

      {!payment && (
        <button className="btn btn-primary btn-lg" disabled={loading} onClick={handleStartPayment}>
          Оплатить
        </button>
      )}

      {payment && !isTerminal && (
        <div className="payment-processing">
          <Spinner />
          <p>Ожидание результата оплаты...</p>
        </div>
      )}

      {payment && isTerminal && (
        <div className="payment-result">
          {payment.status === 'succeeded' && (
            <div className="success-block">
              <p className="status-ok">Оплата прошла успешно!</p>
              <button className="btn btn-primary" onClick={() => navigate('success')}>
                К деталям заказа
              </button>
            </div>
          )}

          {payment.status === 'failed' && (
            <div className="fail-block">
              <p className="status-fail">
                Оплата отклонена
                {payment.failureCode === 'CARD_DECLINED' ? ' (карта отклонена)' : ''}
              </p>
              <button className="btn btn-primary" onClick={handleRetry}>
                Попробовать снова
              </button>
            </div>
          )}

          {payment.status === 'cancelled' && (
            <div className="cancel-block">
              <p>Оплата отменена</p>
              <button className="btn btn-primary" onClick={handleRetry}>
                Попробовать снова
              </button>
            </div>
          )}
        </div>
      )}

      {sandbox && payment && !isTerminal && (
        <div className="sandbox-cards">
          <h2>Тестовые карты</h2>
          <p className="hint">Выберите карту и нажмите «Отправить»:</p>
          {sandbox.cards.map((card) => (
            <label key={card.id} className="radio-label">
              <input
                type="radio"
                name="card"
                value={card.id}
                checked={selectedCard === card.id}
                onChange={() => setSelectedCard(card.id)}
              />
              {card.title} — {card.maskedNumber}
              {card.scenario === 'decline' ? ' (отказ)' : ''}
            </label>
          ))}
          <div className="sandbox-actions">
            <button
              className="btn btn-primary"
              disabled={loading || !selectedCard}
              onClick={() => {
                const card = sandbox.cards.find((c) => c.id === selectedCard);
                if (card) handleSimulate(card.scenario);
              }}
            >
              Отправить
            </button>
            <button
              className="btn btn-outline"
              disabled={loading}
              onClick={() => handleSimulate('cancel')}
            >
              Отменить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
