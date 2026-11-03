// src/app/api/compliance/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_COOKIE } from '@/lib/auth';

const BACKEND =
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const SEGMENT = /^[A-Za-z0-9_-]+$/;

function extractDetail(data: unknown, fallback: string): string {
  const detail = (data as { detail?: unknown })?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string; loc?: unknown[] };
    if (first?.msg) {
      const field = Array.isArray(first.loc) ? String(first.loc[first.loc.length - 1]) : '';
      const msg = first.msg.replace(/^Value error, /, '');
      return field && field !== 'body' ? `${field}: ${msg}` : msg;
    }
  }
  return fallback;
}

type Ctx = { params: Promise<{ path: string[] }> };

async function forward(req: NextRequest, ctx: Ctx) {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });

  const { path } = await ctx.params;
  if (!path.length || !path.every((s) => SEGMENT.test(s))) {
    return NextResponse.json({ detail: 'Invalid path' }, { status: 400 });
  }

  const hasBody = req.method === 'POST' || req.method === 'PATCH';
  const init: RequestInit = {
    method: req.method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    },
    cache: 'no-store',
  };
  if (hasBody) init.body = await req.text();

  try {
    const res = await fetch(
      `${BACKEND}/api/v1/compliance/${path.join('/')}${req.nextUrl.search}`,
      init
    );
    if (res.status === 204) return new NextResponse(null, { status: 204 });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { detail: extractDetail(data, 'Request failed') },
        { status: res.status }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: 'Server unavailable' }, { status: 503 });
  }
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;