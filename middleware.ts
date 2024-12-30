import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/dashboard/:path*'];
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
    try {
        const currentPath = request.nextUrl.pathname;
        const accessToken = request.cookies.get('accessToken')?.value;
        const isAuthenticated = !!accessToken;

        const matchesProtectedRoute = (currentPath: string) => {
            return protectedRoutes.some(pattern => {
                if (pattern.includes(':path*')) {
                    const basePath = pattern.replace(':path*', '');
                    return currentPath.startsWith(basePath);
                }
                return pattern === currentPath;
            });
        };

        const isProtectedRoute = matchesProtectedRoute(currentPath);
        const isAuthRoute = authRoutes.includes(currentPath);

        const dashboardUrl = new URL('/dashboard', request.url);
        const loginUrl = new URL('/login', request.url);

        // If user is authenticated
        if (isAuthenticated) {
            // Redirect away from auth routes to dashboard
            if (isAuthRoute) {
                return NextResponse.redirect(dashboardUrl);
            }
            // Allow access to protected routes and other routes
            return NextResponse.next();
        } else {
            // If user is not authenticated
            // Allow access to auth routes
            if (isAuthRoute) {
                return NextResponse.next();
            }
            // Block access to protected routes and redirect to login
            if (isProtectedRoute) {
                loginUrl.searchParams.set('callbackUrl', currentPath);
                return NextResponse.redirect(loginUrl);
            }
            // Allow access to public routes
            return NextResponse.next();
        }
    } catch (error) {
        console.error('Middleware error:', error);
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

export const config = {
    matcher: [
        '/login',
        '/register',
        '/dashboard',
        '/dashboard/:path*',
        '/dashboard/:path*/:path*'
    ],
};
