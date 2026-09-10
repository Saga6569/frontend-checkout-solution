import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type {
  Product,
  Cart,
  Quote,
  Order,
  Payment,
  Simulation,
  Delivery,
  Customer,
  Scenario,
} from '@checkout/contracts';
import { Static } from '@sinclair/typebox';
import { SandboxSchema, CheckoutOptionsSchema } from '@checkout/contracts';
import * as api from '../api/endpoints.js';
import { setToken as setApiToken } from '../api/client.js';
import { loadSession, saveSession, clearSession } from './session.js';
import { newIdempotencyKey } from './idempotency.js';
import { ApiError } from '../api/client.js';

type Sandbox = Static<typeof SandboxSchema>;
type CheckoutOptions = Static<typeof CheckoutOptionsSchema>;

type Page = 'catalog' | 'cart' | 'checkout' | 'payment' | 'success';

interface AppState {
  page: Page;
  products: Product[];
  cart: Cart | null;
  sandbox: Sandbox | null;
  checkoutOptions: CheckoutOptions | null;
  quote: Quote | null;
  order: Order | null;
  payment: Payment | null;
  simulation: Simulation | null;
  loading: boolean;
  error: ApiError | null;
}

interface AppCtx extends AppState {
  navigate(page: Page): void;
  loadProducts(): Promise<void>;
  addToCart(productId: string, quantity: number): Promise<void>;
  updateCartItem(productId: string, quantity: number): Promise<void>;
  removeFromCart(productId: string): Promise<void>;
  loadCheckoutOptions(): Promise<void>;
  createQuote(delivery: Delivery): Promise<void>;
  placeOrder(customer: Customer, paymentMethod: 'card' | 'cash_on_delivery'): Promise<void>;
  startPayment(): Promise<void>;
  simulatePay(scenario: Scenario): Promise<void>;
  pollPayment(): Promise<boolean>;
  retryPayment(): Promise<void>;
  resetOrder(): void;
  clearError(): void;
}

const Ctx = createContext<AppCtx | null>(null);

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp outside provider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    page: 'catalog',
    products: [],
    cart: null,
    sandbox: null,
    checkoutOptions: null,
    quote: null,
    order: null,
    payment: null,
    simulation: null,
    loading: false,
    error: null,
  });

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const wrap = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const result = await fn();
      if (mountedRef.current) setState((s) => ({ ...s, loading: false }));
      return result;
    } catch (err) {
      if (!mountedRef.current) throw err;
      const apiErr =
        err instanceof ApiError ? err : new ApiError('NETWORK_ERROR', 'Ошибка сети', undefined, '');
      setState((s) => ({ ...s, loading: false, error: apiErr }));
      throw apiErr;
    }
  }, []);

  // Initialize session
  useEffect(() => {
    const { token, orderId, paymentId } = loadSession();
    if (!token) return;
    setApiToken(token);
    setState((s) => ({ ...s, page: orderId ? 'payment' : 'catalog' }));

    // Restore cart
    api.getCart().then(
      (cart) => {
        if (mountedRef.current) setState((s) => ({ ...s, cart }));
      },
      () => {},
    );

    // Restore order + payment if mid-checkout
    if (orderId) {
      api.getOrder(orderId).then(
        (order) => {
          if (!mountedRef.current) return;
          // Order already finalized → go to success
          if (order.status === 'paid' || order.status === 'confirmed') {
            setState((s) => ({ ...s, order, page: 'success' }));
            return;
          }
          setState((s) => ({ ...s, order }));
          // Resume payment polling if payment was in progress
          if (paymentId && order.paymentStatus === 'pending') {
            api.getPayment(paymentId).then(
              (payment) => {
                if (mountedRef.current) setState((s) => ({ ...s, payment }));
              },
              () => {},
            );
          }
        },
        () => {
          if (mountedRef.current) clearSession();
        },
      );
    }
  }, []);

  const navigate = useCallback((page: Page) => {
    setState((s) => ({ ...s, page, error: null }));
  }, []);

  const loadProducts = useCallback(async () => {
    const products = await wrap(() => api.getProducts());
    if (mountedRef.current) setState((s) => ({ ...s, products }));
  }, [wrap]);

  const refreshCart = useCallback(async () => {
    const cart = await api.getCart();
    if (mountedRef.current) setState((s) => ({ ...s, cart }));
    return cart;
  }, []);

  const addToCart = useCallback(
    async (productId: string, quantity: number) => {
      await wrap(async () => {
        await api.setCartItem(productId, quantity);
        await refreshCart();
      });
    },
    [wrap, refreshCart],
  );

  const updateCartItem = useCallback(
    async (productId: string, quantity: number) => {
      await wrap(async () => {
        await api.setCartItem(productId, quantity);
        await refreshCart();
      });
    },
    [wrap, refreshCart],
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      await wrap(async () => {
        await api.removeCartItem(productId);
        await refreshCart();
      });
    },
    [wrap, refreshCart],
  );

  const loadCheckoutOptions = useCallback(async () => {
    const opts = await wrap(() => api.getCheckoutOptions());
    if (mountedRef.current) setState((s) => ({ ...s, checkoutOptions: opts }));
  }, [wrap]);

  const createQuoteFn = useCallback(
    async (delivery: Delivery) => {
      const cart = await wrap(async () => {
        const c = await api.getCart();
        const q = await api.createQuote(c.version, delivery);
        if (mountedRef.current) setState((s) => ({ ...s, cart: c, quote: q }));
        return c;
      });
    },
    [wrap],
  );

  const placeOrder = useCallback(
    async (customer: Customer, paymentMethod: 'card' | 'cash_on_delivery') => {
      const { quote } = state;
      if (!quote) throw new Error('No quote');
      const key = newIdempotencyKey();
      const order = await wrap(async () => {
        const o = await api.createOrder({ quoteId: quote.id, customer, paymentMethod }, key);
        if (mountedRef.current) {
          setState((s) => ({ ...s, order: o, cart: null, quote: null }));
          saveSession({ orderId: o.id });
        }
        return o;
      });
    },
    [wrap, state.quote],
  );

  const startPayment = useCallback(async () => {
    const { order } = state;
    if (!order) throw new Error('No order');
    const key = newIdempotencyKey();
    const payment = await wrap(async () => {
      const p = await api.createPayment(order.id, key);
      if (mountedRef.current) {
        setState((s) => ({ ...s, payment: p }));
        saveSession({ paymentId: p.id });
      }
      return p;
    });
  }, [wrap, state.order]);

  const simulatePay = useCallback(
    async (scenario: Scenario) => {
      const { payment } = state;
      if (!payment) throw new Error('No payment');
      const sim = await wrap(async () => {
        const s = await api.simulatePayment(payment.id, scenario);
        if (mountedRef.current) setState((st) => ({ ...st, simulation: s }));
        return s;
      });
    },
    [wrap, state.payment],
  );

  const pollPayment = useCallback(async (): Promise<boolean> => {
    const { payment, order } = state;
    if (!payment || !order) return true;
    try {
      const [p, o] = await Promise.all([api.getPayment(payment.id), api.getOrder(order.id)]);
      if (!mountedRef.current) return true;
      setState((s) => ({ ...s, payment: p, order: o }));
      if (p.status === 'succeeded' || p.status === 'failed' || p.status === 'cancelled') {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [state.payment, state.order]);

  const retryPayment = useCallback(async () => {
    setState((s) => ({ ...s, payment: null, simulation: null, error: null }));
    saveSession({ paymentId: null });
  }, []);

  const resetOrder = useCallback(() => {
    setState((s) => ({
      ...s,
      order: null,
      payment: null,
      simulation: null,
      quote: null,
      cart: null,
      page: 'catalog',
      error: null,
    }));
    clearSession();
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  const ctx: AppCtx = {
    ...state,
    navigate,
    loadProducts,
    addToCart,
    updateCartItem,
    removeFromCart,
    loadCheckoutOptions,
    createQuote: createQuoteFn,
    placeOrder,
    startPayment,
    simulatePay,
    pollPayment,
    retryPayment,
    resetOrder,
    clearError,
  };

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}
