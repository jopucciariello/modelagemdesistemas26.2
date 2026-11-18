import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, ApiError, setApiToken, setUnauthorizedHandler, type Me } from '@/lib/api';
import { API_URL } from '@/lib/config';
import { getItem, removeItem, setItem } from '@/lib/storage';

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = 'gearlog.token';

type AuthState = {
  /** `loading` enquanto lê o token guardado e confere com a API. */
  status: 'loading' | 'signedOut' | 'signedIn';
  user: Me | null;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  /** RF04: usuário e senha (entrar ou criar conta de atleta). */
  signInWithPassword: (b: { mode: 'login' | 'cadastro'; username: string; password: string; name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [user, setUser] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signOut = useCallback(async () => {
    setApiToken(null);
    await removeItem(TOKEN_KEY);
    setUser(null);
    setStatus('signedOut');
  }, []);

  const loadSession = useCallback(
    async (token: string) => {
      setApiToken(token);
      try {
        setUser(await api<Me>('/api/me'));
        setStatus('signedIn');
      } catch {
        await signOut();
      }
    },
    [signOut],
  );

  useEffect(() => {
    setUnauthorizedHandler(() => void signOut());
    (async () => {
      const saved = await getItem(TOKEN_KEY);
      if (saved && API_URL) await loadSession(saved);
      else setStatus('signedOut');
    })();
    return () => setUnauthorizedHandler(null);
  }, [loadSession, signOut]);

  /**
   * Contrato com a API (issue #61): GET {API}/auth/google/app?redirect=<deep link>
   * faz o login Google e volta para `redirect?token=<token>`.
   */
  const signInWithGoogle = useCallback(async () => {
    setError(null);
    if (!API_URL) {
      setError('API não configurada (EXPO_PUBLIC_API_URL).');
      return;
    }
    const redirect = Linking.createURL('auth');
    const result = await WebBrowser.openAuthSessionAsync(
      `${API_URL}/auth/google/app?redirect=${encodeURIComponent(redirect)}`,
      redirect,
    );
    if (result.type !== 'success') return;
    const token = Linking.parse(result.url).queryParams?.token;
    if (typeof token !== 'string' || !token) {
      setError('Login não concluído. Tente de novo.');
      return;
    }
    await setItem(TOKEN_KEY, token);
    await loadSession(token);
  }, [loadSession]);

  const signInWithPassword = useCallback(
    async (b: { mode: 'login' | 'cadastro'; username: string; password: string; name?: string }) => {
      setError(null);
      try {
        const { token } = await api<{ token: string }>('/api/auth/senha', { method: 'POST', body: JSON.stringify(b) });
        await setItem(TOKEN_KEY, token);
        await loadSession(token);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Não foi possível entrar. Tente de novo.');
      }
    },
    [loadSession],
  );

  const value = useMemo(
    () => ({ status, user, error, signInWithGoogle, signInWithPassword, signOut }),
    [status, user, error, signInWithGoogle, signInWithPassword, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora do AuthProvider');
  return ctx;
}
