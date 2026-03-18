
"use server"

import { auth } from "@kemotsho/core/infra/firebase/admin"
import { Effect } from "effect"
import { registerUserAction } from "@/app/actions/auth"
import { sendInviteEmail } from "@kemotsho/core/lib/email"

export async function inviteUserAction(email: string, displayName: string) {
    try {
        // 1. Create User in Firebase Auth (Admin SDK allows creating without password)
        // We will skip password, so they must use reset link or email link login.
        // Actually, creating a user without password means they can't login with password yet.
        // We can generate a random password? Or better, use generatePasswordResetLink immediately.
        
        // Let's create with random password for security, then email them reset link.
        // Or just create.
        
        // Wait, best practice for "Invite":
        // 1. Create user with dummy random password.
        // 2. Generate Password Reset Link.
        // 3. Return Link (to display or email).
        
        // BUT, sending email requires an email provider (Postmark/Resend).
        // For this demo, we might just return the user UID and success.
        
        const user = await auth.createUser({
            email,
            displayName,
            emailVerified: true // We trust the admin
        })
        
        // Register the User Profile in our DB
        await registerUserAction({
            id: user.uid,
            email: email,
            displayName: displayName
        })
        
        // Generate Reset Link
        const link = await auth.generatePasswordResetLink(email)
        
        // Send email via Resend
        await sendInviteEmail({
            to: email,
            displayName,
            inviteLink: link
        })
        
        return { success: true, uid: user.uid, inviteLink: link }
        
    } catch (e: any) {
        console.error("Invite User Failed:", e)
        if (e.code === 'auth/email-already-exists') {
             // If user exists, we should probably fetch them?
             const user = await auth.getUserByEmail(email)
             return { success: true, uid: user.uid, existing: true }
        }
        return { success: false, error: e.message }
    }
}
