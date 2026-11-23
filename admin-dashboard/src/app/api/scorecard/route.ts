// src/app/api/scorecard/route.ts
// The browser calls this route (same origin). It reads the login cookie, which JavaScript
// in the page cannot read, and forwards the request to FastAPI with a Bearer token.
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

export async function GET(req: NextRequest) {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });

  // Optional ?cycle_id=<number>. Anything that is not plain digits is ignored.
  const cycleId = req.nextUrl.searchParams.get('cycle_id');
  const query = cycleId && /^\d+$/.test(cycleId) ? `?cycle_id=${cycleId}` : '';

  try {
    const res = await fetch(`${BACKEND}/api/v1/scorecard${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { detail: extractDetail(data, 'Failed to load the scorecard') },
        { status: res.status },
      );
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ detail: 'Server unavailable' }, { status: 503 });
  }
}