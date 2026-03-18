"use server"

import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { registerUser } from "@kemotsho/platform-cms/identity/application/RegisterUser"
import { CreateUser, UserId } from "@kemotsho/platform-cms/identity/domain/User"
import { Schema } from "effect"
import { Effect, Exit, Cause, Option } from "effect"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@kemotsho/core/infra/firebase/admin"
import { CustomerRepository } from "@kemotsho/module-commerce/customers/domain/Customer"
import { FirebaseCustomerRepositoryLive } from "@kemotsho/module-commerce/customers/infrastructure/FirebaseCustomerRepository"

export async function logoutAction() {
  const cookieStore = await cookies()
  // Explicitly set maxAge to 0 to force deletion across all paths
  cookieStore.set("session", "", { maxAge: 0, path: "/" })
  redirect("/login")
}

/*
 * Server Action: Create Session
 * Verifies ID Token and sets Session Cookie
 */
/**
 * @deprecated MFA Required. Use initiateLoginAction + verifyMfaAction.
 */
export async function createSessionAction(input: unknown) {
    console.warn("Attempt to use deprecated createSessionAction blocked. MFA enforced.");
    return { success: false, error: "Security Policy: Multi-Factor Authentication is required." }
}

/*
 * Server Action: Register User
 * Callable from Client Components (Forms)
 */
export async function registerUserAction(input: unknown) {
  // 1. Define the workflow
  const program = Effect.gen(function* (_) {
    // Validate Input at the boundary (Parse, don't validate)
    const payload = yield* _(Schema.decodeUnknown(CreateUser)(input))

    // Run Use Case
    const user = yield* _(registerUser(payload))

    return user
  })

  // 2. Execute via Runtime
  // runPromiseExit gives us a typed Exit<Success, Cause> result
  const result = await AppRuntime.runPromiseExit(program)
  console.log("Register User Result:", JSON.stringify(result, null, 2)) // DEBUG LOG

  // 3. Serialize result for the client (Next.js server actions must return plain JSON)
  if (Exit.isSuccess(result)) {
    // We must serialize to plain JSON to remove any class methods (like toJSON, pipe, etc) 
    // that Effect entities might have, which confuse Next.js serialization.
    return { success: true, data: JSON.parse(JSON.stringify(result.value)) }
  } else {
    // Extract failure details safely
    const failure = Cause.failureOption(result.cause)
    if (failure._tag === "Some") {
        const error = failure.value
        // You can switch on error._tag here to return specific messages
        return { success: false, error: "Operation failed", details: JSON.parse(JSON.stringify(error)) }
    }
    return { success: false, error: "Unexpected system error" }
  }
}

/*
 * Server Action: Claim Guest Account
 * Upgrades a Guest Customer to a Registered User
 */
export async function claimGuestAccountAction(input: unknown) {
    const program = Effect.gen(function* (_) {
        // 1. Validate Input
        const { idToken, customerId } = yield* _(
            Schema.decodeUnknown(Schema.Struct({ 
                idToken: Schema.String,
                customerId: Schema.String
            }))(input)
        )

        // 2. Verify Token & Get Email
        const decodedToken = yield* _(
            Effect.tryPromise({
                try: () => auth.verifyIdToken(idToken),
                catch: (e) => new Error(`Invalid Token: ${e}`)
            })
        )
        
        const userId = UserId.make(decodedToken.uid)
        const email = decodedToken.email
        if (!email) return yield* Effect.fail(new Error("Token must have email"))

        // 3. Register User Profile (Identity)
        yield* registerUser({
            id: userId,
            email: email,
            displayName: Option.none()
        })

        // 4. Link Customer Record (Commerce)
        const customerRepo = yield* _(CustomerRepository)
        yield* _(customerRepo.update(customerId, {
            userId: Option.some(userId)
        }))

        // 5. Create Session
        const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
        const sessionCookie = yield* _(
            Effect.tryPromise({
                try: () => auth.createSessionCookie(idToken, { expiresIn }),
                catch: (e) => new Error(`Firebase Session Error: ${e}`)
            })
        )

        const cookieStore = yield* _(Effect.tryPromise(() => cookies()))
        yield* _(Effect.sync(() => {
             cookieStore.set("session", sessionCookie, {
                maxAge: expiresIn / 1000,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                path: "/",
                sameSite: "lax",
            })
        }))
    })

    // Compose Dependencies
    const runnable = program.pipe(
        Effect.provide(FirebaseCustomerRepositoryLive)
    )

    const result = await AppRuntime.runPromiseExit(runnable)

    if (Exit.isSuccess(result)) {
        return { success: true }
    } else {
        const failure = Cause.failureOption(result.cause)
        console.error("Claim Account Failed:", failure)
        return { success: false, error: "Failed to claim account. Please contact support." }
    }
}
