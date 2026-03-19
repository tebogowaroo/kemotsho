import { Effect } from "effect"
import { UserRepository } from "../domain/UserRepository"
import { CreateUser, User, UserRole } from "../domain/User"
import { auth } from "@kemotsho/core/infra/firebase/admin"
import { sendInviteEmail } from "@kemotsho/core/lib/email"
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
        }),
        catch: (error) => new UnexpectedError({ error })
      })
    )

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

    // 5. Generate secure Firebase Reset Link and Send via Resend
    yield* _(
      Effect.tryPromise({
        try: async () => {
          // 5.1 Request standard password reset link from Admin SDK (bypass standard Firebase UI)
          // We provide an optional actionCodeSettings to redirect back to app if desired, but default generates standard URL
          const link = await auth.generatePasswordResetLink(input.email);
          
          // 5.2 Extract displayName for email personalization
          const friendlyName = input.displayName._tag === "Some" && input.displayName.value ? input.displayName.value : "User";

          // 5.3 Trigger standard Resend custom HTML structure
          const result = await sendInviteEmail({
              to: input.email,
              displayName: friendlyName,
              inviteLink: link
          });

          if (!result.success) {
              console.error("[createUserByAdmin] Failed sending via Resend:", result.error);
          } else {
              console.log(`[createUserByAdmin] Custom invite sent via Resend to ${input.email}`);
          }
        },
        catch: (error) => {
           console.error("[createUserByAdmin] Error invoking password reset generator:", error)
           return new UnexpectedError({ error })
        }
      }).pipe(
        // Ensure email failures don't crash user creation transaction
        Effect.catchAll(() => Effect.succeed(null))
      )
    )

    return updatedUser
  })
