import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from './lib/rate-limit';

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const { success } = await rateLimit(req);
    if (!success) return new NextResponse('Too Many Requests', { status: 429 });
  }
  return NextResponse.next();
}
