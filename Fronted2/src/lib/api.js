const configuredBase = import.meta.env.VITE_API_URL?.trim();
export const API_BASE = (configuredBase || (import.meta.env.DEV ? 'http://localhost:8000/api' : '')).replace(/\/$/, '');

export async function api(path, options = {}) {
  if (!API_BASE) throw new Error('The Himtrip API URL is not configured. Set VITE_API_URL to your deployed API base ending in /api.');
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, {
    ...options,
    headers,
    credentials: 'include',
    body: options.body && typeof options.body !== 'string' && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status}). Check that the Himtrip API is running.`);
  return payload;
}
