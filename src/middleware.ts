import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Rate limit simple en mémoire (par IP) pour les routes API publiques. En production multi-instance, préférer Redis/Upstash. */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 req/min par IP pour /api
const RATE_LIMIT_CONTACT_MAX = 5; // 5 envois contact/signalement par minute

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkRateLimit(ip: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, v] of rateLimitMap.entries()) {
    if (now > v.resetAt) rateLimitMap.delete(key);
  }
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Headers de sécurité sur toutes les réponses
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');

  const path = request.nextUrl.pathname;

  if (path.startsWith('/api/')) {
    if (rateLimitMap.size > 10000) cleanupRateLimitMap();
    const ip = getClientIp(request);
    const isContact = path === '/api/contact';
    const max = isContact ? RATE_LIMIT_CONTACT_MAX : RATE_LIMIT_MAX_REQUESTS;
    if (!checkRateLimit(ip, max, RATE_LIMIT_WINDOW_MS)) {
      return new NextResponse(
        JSON.stringify({ error: 'Trop de requêtes. Réessayez dans une minute.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
