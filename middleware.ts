import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Proteger ruta /admin — solo admin
    if (pathname.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/chat', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/chat', '/generate', '/gallery', '/admin', '/api/chat/:path*', '/api/generate/:path*', '/api/images/:path*', '/api/history/:path*', '/api/admin/:path*', '/api/upload/:path*'],
};
