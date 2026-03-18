import 'server-only'
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@kemotsho/core/infra/firebase/admin"
import { Effect, Exit } from "effect"
import { Schema } from "effect"
import { AppRuntime } from "@kemotsho/core/lib/runtime"

// Define a schema for the session user
const SessionUser = Schema.Struct({
    uid: Schema.String,
    email: Schema.String,
    role: Schema.optional(Schema.String)
})

/*
 * Data Access Layer (DAL) for Session Verification
 * This runs on the server (Node.js runtime) and can use firebase-admin
 */
export const verifySession = async () => {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")?.value

    if (!sessionCookie) {
        return null
    }

    // Verify via Firebase Admin
    try {
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)
        
        // Map roles array to primary role logic
        const roles = (decodedClaims.roles as string[]) || []
        const isAdmin = roles.includes('admin') || roles.includes('sys:admin')
        const primaryRole = isAdmin ? 'admin' : (roles[0] || 'subscriber')

        return {
            isAuth: true,
            userId: decodedClaims.uid,
            email: decodedClaims.email,
            role: primaryRole,
            roles: roles // Added full roles access just in case
        }
    } catch (error) {
        console.error("Session verification failed:", error)
        return null
    }
}

/*
 * Guard function for Server Components
 * Redirects if not authorized
 */
export const requireAuth = async () => {
    const session = await verifySession()
    if (!session) {
        redirect("/login")
    }
    return session
}

/*
 * Guard for Admin Access
 */
export const requireAdmin = async () => {
    const session = await requireAuth()
    if (session.role !== 'admin') {
        // Build a friendly "Forbidden" page or redirect
        redirect("/") 
    }
    return session
}
