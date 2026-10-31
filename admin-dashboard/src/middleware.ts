// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, type Session } from '@/lib/auth';

function readSession(req: NextRequest): Session | null {
  const raw = req.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    try {
      parsed = JSON.parse(decodeURIComponent(raw));
    } catch {
      return null;
    }
  }

  const s = parsed as Partial<Session> | null;
  if (s && (s.role === 'admin' || s.role === 'client') && s.email) {
    return s as Session;
  }
  return null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = readSession(req);
  const isLoginPage = pathname === '/login';

  // 1) If not logged in -> /login
  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 2) If a logged-in user attempts to access /login -> redirect to their home page
  if (session && isLoginPage) {
    const home = session.role === 'admin' ? '/' : '/sections';
    return NextResponse.redirect(new URL(home, req.url));
  }

  // 3) The 'Client' role does not have access to Admin pages.
  if (session?.role === 'client' && !pathname.startsWith('/sections')) {
    return NextResponse.redirect(new URL('/sections', req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skips static files, _next, images, favicons, and files with extensions.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};