import { useEffect, useState, useCallback } from 'react';
import { AppProvider, useApp } from './store/AppContext.js';
import { setToken } from './api/client.js';
import { createSession } from './api/endpoints.js';
import { loadSession, saveSession } from './store/session.js';
import { Catalog } from './pages/Catalog.js';
import { Cart } from './pages/Cart.js';
import { Checkout } from './pages/Checkout.js';
import { Payment } from './pages/Payment.js';
import { Success } from './pages/Success.js';
import { Spinner } from './components/Spinner.js';

function Router() {
  const { page } = useApp();

  switch (page) {
    case 'catalog':
      return <Catalog />;
    case 'cart':
      return <Cart />;
    case 'checkout':
      return <Checkout />;
    case 'payment':
      return <Payment />;
    case 'success':
      return <Success />;
    default:
      return <Catalog />;
  }
}

function AppInner() {
  const [ready, setReady] = useState(false);

  const init = useCallback(async () => {
    const { token } = loadSession();
    if (token) {
      setToken(token);
    } else {
      const session = await createSession();
      setToken(session.token);
      saveSession({ token: session.token });
    }
    setReady(true);
  }, []);

  useEffect(() => {
    init().catch(() => setReady(true));
  }, [init]);

  if (!ready)
    return (
      <div className="app-loading">
        <Spinner />
      </div>
    );

  return <Router />;
}

export default function App() {
  return (
    <AppProvider>
      <div className="app">
        <AppInner />
      </div>
    </AppProvider>
  );
}
