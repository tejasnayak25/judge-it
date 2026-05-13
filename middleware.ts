import { NextResponse, type NextRequest } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value

  // Protect admin and judge routes
  if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/judge')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      // Verify session cookie
      // Note: We can't use adminAuth in Edge middleware directly easily if it uses Node.js APIs
      // But Next.js 15 supports Node.js runtime in middleware if configured, 
      // or we can use a simpler check if we just trust the cookie existence for the redirect, 
      // and verify properly in the page/actions.
      // However, for a "professional" setup, we should verify.
      
      // If this middleware runs in Edge, adminAuth might fail. 
      // Let's assume for now we are using Node.js runtime or we handle it.
      // Actually, standard Firebase Admin doesn't work in Edge. 
      // A common workaround is to use jose to verify the JWT if it's an ID token, 
      // but session cookies are different.
      
      // For now, let's do a basic redirect if no session, and let the layout/page handle the verification.
      // This is safer for Edge compatibility.
      
      return NextResponse.next()
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/judge/:path*',
  ],
}
