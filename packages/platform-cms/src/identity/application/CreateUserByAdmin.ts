import { Effect } from "effect"
import { UserRepository } from "../domain/UserRepository"
import { CreateUser, User, UserRole } from "../domain/User"
import { auth } from "@kemotsho/core/infra/firebase/admin"
import { UnexpectedError } from "@kemotsho/core/domain/errors"

export const createUserByAdmin = (input: typeof CreateUser.Type & { roles: readonly typeof UserRole.Type[] }) =>
  Effect.gen(function* (_) {
    const repo = yield* _(UserRepository)

    // Generate strong random temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10) + "A1!"

    // 1. Create in Firebase Auth (Admin SDK)
    const authUser = yield* _(
      Effect.tryPromise({
        try: () => auth.createUser({
          email: input.email,
          ...(input.displayName._tag === "Some" ? { displayName: input.displayName.value } : {}),
          password: tempPassword

    // 2. Set Custom Claims (Roles)
    yield* _(
        Effect.tryPromise({
            try: () => auth.setCustomUserClaims(authUser.uid, { roles: input.roles }),
            catch: (error) => new UnexpectedError({ error })
        })
    )

    // 3. Create in Firestore with Roles
    // We reuse CreateUser but we likely need a Repo method that supports setting roles initially
    // Or we update the create method or the User entity. 
    // The current repo.create hardcodes roles to ["subscriber"].
    
    // Let's create a specialized Repo method or update the logic.
    // For now, we will use repo.create then repo.update? No, inefficient.
    // Let's assume we add a 'createWithRoles' or modify 'create' in Repo.
    
    // We will call repo.create but we need to pass the ID from Auth
    const user = yield* _(repo.create({ ...input, id: authUser.uid as any })) // Cast ID
    
    // 4. Update the stored user with correct roles (since repo.create defaults to subscriber)
    const updatedUser = { ...user, roles: input.roles }
    yield* _(repo.update(updatedUser))

    // 5. Send Password Reset Email via Firebase Identity Toolkit
    yield* _(
      Effect.tryPromise({
        try: async () => {
          const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
          if (!apiKey) {
            console.warn("[createUserByAdmin] Missing NEXT_PUBLIC_FIREBASE_API_KEY, cannot send reset email")
            return
          }
          
          const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestType: 'PASSWORD_RESET',
              email: input.email
            })
          })

          if (!res.ok) {
             const errorText = await res.text()
             console.error("[createUserByAdmin] Failed to send password reset email:", errorText)
          } else {
             console.log(`[createUserByAdmin] Password reset email sent to ${input.email}`)
          }
        },
        catch: (error) => {
           console.error("[createUserByAdmin] Network error triggering password reset:", error)
           // Non-blocking error, user is still created. We don't want to crash.
           return new UnexpectedError({ error })
        }
      }).pipe(
        // Ignore the error instead of failing the whole transaction if email fails to send
        Effect.catchAll(() => Effect.succeed(null))
      )
    )

    return updatedUser
  })
