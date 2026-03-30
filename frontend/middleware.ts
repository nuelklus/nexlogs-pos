import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Add security headers
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Cache headers for static assets
  if (request.nextUrl.pathname.includes('/_next/static/') || 
      request.nextUrl.pathname.includes('/images/') ||
      request.nextUrl.pathname.includes('/favicon')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Cache headers for API responses (shorter duration)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  }

  // Performance hints
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
