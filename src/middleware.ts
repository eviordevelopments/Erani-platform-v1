import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/audit',
  '/forensic',
  '/reports',
  '/sessions',
  '/marketplace',
  '/services',
  '/agent',
  '/subscription',
  '/settings',
  '/feedback'
];

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/audit/:path*',
    '/forensic/:path*',
    '/reports/:path*',
    '/sessions/:path*',
    '/marketplace/:path*',
    '/services/:path*',
    '/agent/:path*',
    '/subscription/:path*',
    '/settings/:path*',
    '/feedback/:path*',
  ],
};
