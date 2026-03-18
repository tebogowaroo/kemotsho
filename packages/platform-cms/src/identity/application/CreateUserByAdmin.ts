import { Effect } from "effect"
import { UserRepository } from "../domain/UserRepository"
import { CreateUser, User, UserRole } from "../domain/User"
import { auth } from "@kemotsho/core/infra/firebase/admin"
import { UnexpectedError } from "@kemotsho/core/domain/errors"

export const createUserByAdmin = (input: typeof CreateUser.Type & { roles: readonly typeof UserRole.Type[] }) =>
  Effect.gen(function* (_) {
    const repo = yield* _(UserRepository)

    // 1. Create in Firebase Auth (Admin SDK)
    const authUser = yield* _(
      Effect.tryPromise({
        try: () => auth.createUser({
          email: input.email,
          ...(input.displayName._tag === "Some" ? { displayName: input.displayName.value } : {}),
          // We can set a temporary password or email link logic here. 
          // For now, let's assume we set a default one or just create the user. 
          // Firebase Admin create allows setting password.
          password: "temporaryPassword123!" // TODO: Generate random or send reset email
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

    return updatedUser
  })
