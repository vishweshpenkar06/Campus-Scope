import { NextRequest, NextResponse } from 'next/server';
import { allow, clientIp } from './lib/rate-limit';

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const ip = clientIp(req);
    const success = allow(ip);
    if (!success) return new NextResponse('Too Many Requests', { status: 429 });
  }
  return NextResponse.next();
}
