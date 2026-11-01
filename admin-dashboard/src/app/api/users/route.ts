// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_COOKIE } from '@/lib/auth';

const BACKEND =
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// FastAPI validation errors (422) → Next.js validation errors (400)
function extractDetail(data: unknown, fallback: string): string {
  const detail = (data as { detail?: unknown })?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const msg = (detail[0] as { msg?: string })?.msg;
    if (msg) return msg.replace(/^Value error, /, '');
  }
  return fallback;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });

  try {
    const res = await fetch(`${BACKEND}/api/v1/users/`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ detail: extractDetail(data, 'Failed to load users') }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ detail: 'Server unavailable' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid request.' }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND}/api/v1/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ detail: extractDetail(data, 'Failed to create user') }, { status: res.status });
    }
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ detail: 'Server unavailable' }, { status: 503 });
  }
}