import { request } from './client.js';
import type {
  Product,
  Cart,
  Quote,
  Order,
  Payment,
  Simulation,
  Delivery,
  Customer,
  CreateOrder,
  Scenario,
} from '@checkout/contracts';
import type { Static } from '@sinclair/typebox';
import { SessionSchema, SandboxSchema, CheckoutOptionsSchema } from '@checkout/contracts';

// Session
export const createSession = () =>
  request<Static<typeof SessionSchema>>('/sessions', {
    method: 'POST',
    body: '{}',
  });

export const getSession = (id: string) => request<Static<typeof SessionSchema>>(`/sessions/${id}`);

// Products
export const getProducts = () => request<Product[]>('/products');

// Sandbox
export const getSandbox = () => request<Static<typeof SandboxSchema>>('/sandbox');

// Cart
export const getCart = () => request<Cart>('/cart');

export const setCartItem = (productId: string, quantity: number) =>
  request<Cart>(`/cart/items/${productId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });

export const removeCartItem = (productId: string) =>
  request<undefined>(`/cart/items/${productId}`, {
    method: 'DELETE',
  });

// Checkout
export const getCheckoutOptions = () =>
  request<Static<typeof CheckoutOptionsSchema>>('/checkout/options');

export const createQuote = (cartVersion: number, delivery: Delivery) =>
  request<Quote>('/quotes', {
    method: 'POST',
    body: JSON.stringify({ cartVersion, delivery }),
  });

// Orders
export const createOrder = (body: CreateOrder, idempotencyKey: string) =>
  request<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Idempotency-Key': idempotencyKey },
  });

export const getOrder = (orderId: string) => request<Order>(`/orders/${orderId}`);

// Payments
export const createPayment = (orderId: string, idempotencyKey: string) =>
  request<Payment>(`/orders/${orderId}/payments`, {
    method: 'POST',
    body: '{}',
    headers: { 'Idempotency-Key': idempotencyKey },
  });

export const getPayment = (paymentId: string) => request<Payment>(`/payments/${paymentId}`);

export const simulatePayment = (paymentId: string, scenario: Scenario) =>
  request<Simulation>(`/payments/${paymentId}/simulations`, {
    method: 'POST',
    body: JSON.stringify({ scenario }),
  });

export const getSimulation = (paymentId: string, simulationId: string) =>
  request<Simulation>(`/payments/${paymentId}/simulations/${simulationId}`);
