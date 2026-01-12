import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl;

    // --- 301 Redirects for Flat URLs ---
    // Redirect /product/:slug to /:slug
    if (pathname.startsWith('/product/')) {
        const slug = pathname.replace('/product/', '');
        return NextResponse.redirect(new URL(`/${slug}${search}`, request.url), 301);
    }

    // Redirect /category/:slug to /:slug
    if (pathname.startsWith('/category/')) {
        const slug = pathname.replace('/category/', '');
        return NextResponse.redirect(new URL(`/${slug}${search}`, request.url), 301);
    }

    // Redirect /page/:slug to /:slug
    if (pathname.startsWith('/page/')) {
        const slug = pathname.replace('/page/', '');
        return NextResponse.redirect(new URL(`/${slug}${search}`, request.url), 301);
    }
    // -----------------------------------

    // Check for nocache or purge query parameter (both supported)
    const nocache = request.nextUrl.searchParams.get('nocache');
    const purge = request.nextUrl.searchParams.get('purge');

    if (nocache === 'true' || purge === 'true') {
        // Create the response from NextResponse.next()
        const response = NextResponse.next();

        // Disable all caching when nocache=true is present
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        response.headers.set('X-Cache-Bypass', 'true');

        return response;
    }

    return NextResponse.next();
}

// Run proxy on all routes except static assets and internal requests
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - .well-known (system files like DevTools config)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.well-known).*)',
    ],
};
