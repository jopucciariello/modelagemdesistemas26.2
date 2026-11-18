import { API_URL } from '@/lib/config';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setApiToken(value: string | null) {
  token = value;
}

/** Chamado quando a API responde 401 (token expirado ou inválido). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new ApiError(0, 'EXPO_PUBLIC_API_URL não configurada');
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (res.status === 401) {
    onUnauthorized?.();
    throw new ApiError(401, 'Sessão expirada');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(res.status, body?.error ?? `Erro ${res.status}`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export type Me = { id: string; name: string; email: string; role: 'ATLETA' | 'ADMIN' };
