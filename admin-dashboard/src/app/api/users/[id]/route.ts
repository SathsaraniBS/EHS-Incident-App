// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_COOKIE } from '@/lib/auth';

const BACKEND =
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

function extractDetail(data: unknown, fallback: string): string {
  const detail = (data as { detail?: unknown })?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const msg = (detail[0] as { msg?: string })?.msg;
    if (msg) return msg.replace(/^Value error, /, '');
  }
  return fallback;
}

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });

  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ detail: 'Invalid user id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid request.' }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND}/api/v1/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ detail: extractDetail(data, 'Failed to update user') }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ detail: 'Server unavailable' }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });

  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ detail: 'Invalid user id' }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND}/api/v1/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.status === 204) return new NextResponse(null, { status: 204 });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(
      { detail: extractDetail(data, 'Failed to delete user') },
      { status: res.status }
    );
  } catch {
    return NextResponse.json({ detail: 'Server unavailable' }, { status: 503 });
  }
}