import { Effect, Option } from "effect"
import { UserRepository } from "../domain/UserRepository"
import { UpdateUser, User } from "../domain/User"
import { auth } from "@kemotsho/core/infra/firebase/admin"
import { UnexpectedError } from "@kemotsho/core/domain/errors"

export const updateUser = (input: UpdateUser) =>
  Effect.gen(function* (_) {
    const repo = yield* _(UserRepository)

    // 1. Get Existing User (Ensure existence)
    const existingUser = yield* _(repo.findById(input.id))

    // 2. Update Firebase Auth Profile (DisplayName & Disabled Status)
    yield* _(
        Effect.tryPromise({
            try: () => auth.updateUser(input.id, { 
                displayName: Option.getOrNull(input.displayName),
                disabled: input.status !== "active"
            }),
            catch: (error) => new UnexpectedError({ error })
        })
    )

    // 3. Update Custom Claims (Roles)
    // Only update if roles have changed to save bandwidth, but simple set is fine too.
    yield* _(
        Effect.tryPromise({
            try: () => auth.setCustomUserClaims(input.id, { roles: input.roles }),
            catch: (error) => new UnexpectedError({ error })
        })
    )

    // 4. Update Firestore Record
    const userToSave: User = {
        ...existingUser,
        displayName: input.displayName,
        roles: input.roles,
        status: input.status,
        updatedAt: new Date()
    }

    const saved = yield* _(repo.update(userToSave))
    return saved
  })
