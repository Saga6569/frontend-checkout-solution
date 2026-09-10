const BASE = '/api';

let token: string | null = null;

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem('token', t);
  else localStorage.removeItem('token');
}

export class ApiError {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly fields: { path: string; message: string }[] | undefined,
    public readonly requestId: string,
  ) {}
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (init.body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const requestId = res.headers.get('X-Request-Id') ?? '';

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const err = body?.error;
    throw new ApiError(
      err?.code ?? `HTTP_${res.status}`,
      err?.message ?? `Ошибка ${res.status}`,
      err?.fields,
      requestId,
    );
  }

  return (body as { data: T }).data;
}
