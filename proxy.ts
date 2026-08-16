import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './app/lib/session';
import { cookies } from 'next/headers';

// Specify protected and public routes
const protectedRoutes = ['/results', '/results/basic', '/collect-info', '/dashboard'];
const publicRoutes = ['/login', '/signup', '/'];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Check if the current route is protected or public
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);

  // Decrypt the session from the cookie
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const session = await decrypt(sessionCookie);

  // Redirect to /login if the user is not authenticated and trying to access a protected route
  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // Redirect to / (or dashboard) if the user is authenticated and trying to access login/signup
  if (isPublicRoute && session?.userId && (path === '/login' || path === '/signup')) {
    return NextResponse.redirect(new URL('/results', req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Proxy should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|data|favicon.ico|.*\\.png$).*)'],
};
