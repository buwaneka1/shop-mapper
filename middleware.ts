import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession, updateSession } from '@/lib/auth'

export async function middleware(request: NextRequest) {
    // 1. Update session if exists
    await updateSession(request);

    const session = request.cookies.get('session');

    // 2. Redirect to /login if trying to access dashboard (/) without session
    if (!session && request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 3. Redirect to / if at /login and already logged in
    if (session && request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/', '/login'],
}
