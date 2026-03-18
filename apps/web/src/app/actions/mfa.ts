"use server"

import { db, auth } from "@kemotsho/core/infra/firebase/admin"
import { sendOtpEmail } from "@kemotsho/core/lib/email"
import { cookies } from "next/headers"

// --- Actions ---

export async function initiateLoginAction(idToken: string) {
    try {
        // 1. Verify ID Token
        const decodedToken = await auth.verifyIdToken(idToken)
        const uid = decodedToken.uid
        const email = decodedToken.email
        
        if (!email) throw new Error("User has no email")

        // 2. Generate 6-digit OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = Date.now() + 5 * 60 * 1000 // 5 mins

        // 3. Save to Firestore (private collection)
        // Note: In production, consider encryption for the stored code
        await db.collection("auth_mfa").doc(uid).set({
            code,
            expiresAt,
            failedAttempts: 0
        })

        // 4. Send Email
        const emailResult = await sendOtpEmail({ to: email, code })
        if (!emailResult.success) {
            console.error("Failed to send OTP", emailResult.error);
            // Don't expose internal email errors to client unless necessary
            throw new Error("Failed to send verification email. Please try again.")
        }

        // 5. Return "Challenge Required"
        return { success: true, requireMfa: true, userId: uid }

    } catch (e: any) {
        console.error("Initiate Login Failed:", e)
        return { success: false, error: e.message }
    }
}

export async function verifyMfaAction(userId: string, code: string, idToken: string) {
    try {
        // 1. Fetch Challenge
        const docRef = db.collection("auth_mfa").doc(userId)
        const doc = await docRef.get()
        
        if (!doc.exists) return { success: false, error: "Invalid or expired code" }
        
        const data = doc.data() as any
        
        // 2. Verify
        if (Date.now() > data.expiresAt) return { success: false, error: "Code expired" }
        
        // Security: Prevent brute force (e.g., max 5 attempts)
        if (data.failedAttempts > 5) {
             await docRef.delete()
             return { success: false, error: "Too many failed attempts. Please login again." }
        }

        if (data.code !== code) {
            // Increment fail count
            await docRef.update({ failedAttempts: (data.failedAttempts || 0) + 1 })
            return { success: false, error: "Incorrect code" }
        }

        // 3. Success! Clear Challenge
        await docRef.delete()

        // 4. Create Session Cookie (Real Login)
        const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn })
        
        const cookieStore = await cookies()
        cookieStore.set("session", sessionCookie, {
                maxAge: expiresIn / 1000,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                path: "/",
                sameSite: "lax",
        })
        
        // Return redirect path
        // Check roles 
        const decoded = await auth.verifyIdToken(idToken)
        const roles = (decoded.roles as string[]) || []
        const isAdmin = roles.includes('admin')
        
        return { success: true, redirectPath: isAdmin ? "/admin/dashboard" : "/account/orders" }

    } catch (e: any) {
        console.error("Verify MFA Failed:", e)
        return { success: false, error: e.message }
    }
}
