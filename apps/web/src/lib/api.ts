const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

interface FetchOpts extends RequestInit {
  token?: string;
}

let refreshing: Promise<string | null> | null = null;

async function attemptRefresh(): Promise<string | null> {
  const { useAuth } = await import('./auth');
  const state = useAuth.getState();
  if (!state.refreshToken) return null;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: state.refreshToken }),
        });
        if (!res.ok) {
          await state.logout();
          // Session morte : redirige vers /connexion plutôt que d'afficher des 401 silencieuses.
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/connexion')) {
            const next = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `/connexion?next=${next}`;
          }
          return null;
        }
        const j = (await res.json()) as { accessToken: string; refreshToken: string };
        await state.setTokens(j.accessToken, j.refreshToken);
        return j.accessToken;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

export async function api<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { token, headers, ...rest } = opts;

  const doFetch = (t: string | undefined) =>
    fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...headers,
      },
      cache: rest.cache ?? 'no-store',
    });

  let res = await doFetch(token);
  if (res.status === 401 && token) {
    const newToken = await attemptRefresh();
    if (newToken) res = await doFetch(newToken);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${detail || res.statusText}`);
  }

  // 204, Content-Length: 0, ou body vide → pas de JSON à parser.
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const apiGet = <T,>(path: string, token?: string) => api<T>(path, { token });
export const apiPost = <T,>(path: string, body: unknown, token?: string) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(body), token });
export const apiDelete = <T,>(path: string, token?: string) =>
  api<T>(path, { method: 'DELETE', token });
