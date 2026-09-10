export function loadSession() {
  return {
    token: localStorage.getItem('token'),
    orderId: localStorage.getItem('orderId'),
    paymentId: localStorage.getItem('paymentId'),
  };
}

export function saveSession(fields: {
  token?: string | null;
  orderId?: string | null;
  paymentId?: string | null;
}) {
  if (fields.token !== undefined) {
    if (fields.token) localStorage.setItem('token', fields.token);
    else localStorage.removeItem('token');
  }
  if (fields.orderId !== undefined) {
    if (fields.orderId) localStorage.setItem('orderId', fields.orderId);
    else localStorage.removeItem('orderId');
  }
  if (fields.paymentId !== undefined) {
    if (fields.paymentId) localStorage.setItem('paymentId', fields.paymentId);
    else localStorage.removeItem('paymentId');
  }
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('orderId');
  localStorage.removeItem('paymentId');
}
