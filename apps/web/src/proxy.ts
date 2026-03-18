import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { decodeJwt } from "jose"

/**
 * Helper to determine if a user has access to the backoffice (Admin area).
 * In this domain-driven architecture, we treat anyone who is NOT explicitly 
 * a customer/patient as a staff member.
 */
function isBackofficeUser(roles: string[]) {
  return roles.some(role => 
    role === 'admin' || 
    role === 'sys:admin' || 
    (
      role !== 'subscriber' &&
      !role.endsWith(':customer') && 
      !role.endsWith(':subscriber') && 
      !role.endsWith(':patient')
    )
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get("session")?.value
  
  // Debug: Log EVERY request hitting middleware
  if (!pathname.startsWith("/_next") && !pathname.includes("favicon")) {
     console.log(`[Middleware] Incoming: ${pathname} | Session Cookie: ${session ? "YES" : "NO"} (${session?.substring(0, 10)}...)`)
  }

  // 1. Guest Guard: Redirect logged-in users away from Auth pages
  if ((pathname === "/login" || pathname === "/register") && session) {
      console.log(`[Middleware] Guest Guard triggered for ${pathname}`)
      try {
          const claims = decodeJwt(session)
          // If expired, let them login
          if (!claims.exp || claims.exp >= Math.floor(Date.now() / 1000)) {
              const roles = (claims.roles as string[]) || []
              
              // Determine if user has any Staff/Admin access
              const isStaff = isBackofficeUser(roles)
              
              const redirectTarget = isStaff ? "/admin/dashboard" : "/account/orders"
              console.log(`[Middleware] Redirecting to: ${redirectTarget} (Staff=${isStaff})`)
              return NextResponse.redirect(new URL(redirectTarget, request.url))
          }
      } catch (e) {
          // Ignore invalid tokens here, let them stay on login
          console.error(`[Middleware] Error decoding session in Guest Guard`, e)
      }
  }
  
  // 2. Protect routes
  const isAdminRoute = pathname.startsWith("/admin");
  const isAccountRoute = pathname.startsWith("/account");

  if (isAdminRoute || isAccountRoute) {
    if (!session) {
      console.log(`[Middleware] No session for protected route ${pathname}. Redirecting to /login`)
      // Redirect to login if no session
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname);
      
      return NextResponse.redirect(loginUrl)
    }

    // 3. Validate Token Format & Extract Roles
    try {
        const claims = decodeJwt(session)
        
        // Check Expiration
        if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) {
            const loginUrl = new URL("/login", request.url)
            loginUrl.searchParams.set("redirect", pathname)
            const response = NextResponse.redirect(loginUrl)
            response.cookies.delete("session")
            return response
        }
        
        const roles = (claims.roles as Array<string>) || []
        const canAccessBackoffice = isBackofficeUser(roles)

        // Debug: Log access attempts to admin
        console.log(`[Middleware Debug] Path: ${pathname}`)
        console.log(`[Middleware Debug] User ID: ${claims.uid || claims.sub}`)
        console.log(`[Middleware Debug] Claims:`, JSON.stringify(claims, null, 2))
        console.log(`[Middleware Debug] Roles: [${roles.join(', ')}]`)
        console.log(`[Middleware Debug] Can Access Backoffice: ${canAccessBackoffice}`)

        if (isAdminRoute) {
             console.log(`[Middleware] Admin Access Attempt: Path=${pathname}, Roles=[${roles.join(', ')}], Access=${canAccessBackoffice}`)
        }

        // Rule A: Backoffice Guard
        if (isAdminRoute && !canAccessBackoffice) {
             console.log(`[Middleware] Access Denied. Redirecting to /account/orders`)
             return NextResponse.redirect(new URL('/account/orders', request.url))
        }

    } catch (error) {
        console.error("Middleware Decode Error:", error)
        // If token is malformed, force re-login
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("redirect", pathname)
        const response = NextResponse.redirect(loginUrl)
        response.cookies.delete("session")
        return response
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

