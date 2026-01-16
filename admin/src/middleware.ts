import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to prevent browser caching of admin panel pages
 * This ensures users always see the latest content without needing to add query parameters
 */
export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Set comprehensive cache-control headers to prevent any caching
    response.headers.set(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    );

    // HTTP/1.0 backward compatibility
    response.headers.set('Pragma', 'no-cache');

    // Ensure immediate expiration
    response.headers.set('Expires', '0');

    return response;
}

// Apply middleware to all routes
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
