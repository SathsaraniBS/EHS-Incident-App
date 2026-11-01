// src/proxy.ts  (Next.js 16)
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { TOKEN_COOKIE, type Role } from '@/lib/auth';

async function readRole(req: NextRequest): Promise<Role | null> {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set in admin-dashboard/.env.local');
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    });
    return payload.role === 'admin' || payload.role === 'client' ? payload.role : null;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = await readRole(req);
  const isLoginPage = pathname === '/login';

  if (!role && !isLoginPage) {
    const res = NextResponse.redirect(new URL('/login', req.url));
    if (req.cookies.get(TOKEN_COOKIE)) res.cookies.delete(TOKEN_COOKIE);
    return res;
  }

  if (role && isLoginPage) {
    return NextResponse.redirect(new URL(role === 'admin' ? '/' : '/sections', req.url));
  }

  if (role === 'client' && !pathname.startsWith('/sections')) {
    return NextResponse.redirect(new URL('/sections', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};