export { API_BASE_URL_TOKEN, FRONTEND_BASE_URL_TOKEN } from './tokens';

function resolveApiBase(): string {
  return (
    (typeof window !== 'undefined' && (window as any).__API_BASE_URL__) ||
    (typeof process !== 'undefined' && (process as any).env && (process as any).env.API_BASE_URL) ||
    'https://127.0.0.1:8000'
  );
}

export function toAbs(u?: string | null): string | null {
  if (!u) return null;
  if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:')) return u;
  if (u.startsWith('/api/')) return `${resolveApiBase()}${u}`;
  return u;
}
