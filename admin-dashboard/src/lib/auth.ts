// src/lib/auth.ts
export const TOKEN_COOKIE = 'bondville_token';

export type Role = 'admin' | 'client';

export interface SessionUser {
  id: number;
  email: string;
  full_name: string;
  role: Role;
}

export const homeForRole = (role: Role): string =>
  role === 'admin' ? '/' : '/sections';