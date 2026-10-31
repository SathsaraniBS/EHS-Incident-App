// lib/auth.ts
export const SESSION_COOKIE = 'bondville_user';

export type Role = 'admin' | 'client';

export interface Session {
  email: string;
  role: Role;
  name: string;
}

/** The home page to navigate to upon login, based on the user's role */
export const homeForRole = (role: Role): string =>
  role === 'admin' ? '/' : '/sections';

/**
 * The session cookie is set.
 * Since there is no `max-age`, it gets deleted when the browser is closed (session cookie).
 */
export function setSession(session: Session): void {
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(
    JSON.stringify(session)
  )}; path=/; SameSite=Lax`;
}

export function getSession(): Session | null {
  if (typeof document === 'undefined') return null;

  const prefix = `${SESSION_COOKIE}=`;
  const match = document.cookie.split('; ').find((row) => row.startsWith(prefix));
  if (!match) return null;

  try {
    return JSON.parse(decodeURIComponent(match.slice(prefix.length))) as Session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}