// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { TOKEN_COOKIE } from '@/lib/auth';

const BACKEND =
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function POST(req: Request) {
  let body: { email?: unknown; password?: unknown; remember?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid request.' }, { status: 400 });
  }

  const { email, password, remember } = body;
  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ detail: 'Email and password are required.' }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, remember_me: remember === true }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { detail: 'Cannot reach the server. Please try again shortly.' },
      { status: 503 }
    );
  }

  if (res.status === 401) {
    return NextResponse.json(
      { detail: 'Email or password is incorrect. Check your details and try again.' },
      { status: 401 }
    );
  }
  if (!res.ok) {
    return NextResponse.json(
      { detail: 'Login failed. Please try again later.' },
      { status: 502 }
    );
  }

  const data = await res.json();
  const response = NextResponse.json({ user: data.user });

  response.cookies.set({
    name: TOKEN_COOKIE,
    value: data.access_token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(remember === true ? { maxAge: data.expires_in } : {}),
  });

  return response;
}