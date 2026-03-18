import { Effect } from "effect"
import { UserRepository } from "../domain/UserRepository"
import { UserId } from "../domain/User"
import { auth } from "@kemotsho/core/infra/firebase/admin"
import { UnexpectedError, NotFound } from "@kemotsho/core/domain/errors"

export const unsubscribeUser = (userId: UserId) =>
  Effect.gen(function* (_) {
    const repo = yield* _(UserRepository)

    // 1. Get User
    const user = yield* _(repo.findById(userId))

    // 2. Revoke Refresh Tokens (Force Logout)
    yield* _(
        Effect.tryPromise({
            try: () => auth.revokeRefreshTokens(userId),
            catch: (error) => new UnexpectedError({ error })
        })
    )

    // 3. Disable User in Firebase Auth
    yield* _(
        Effect.tryPromise({
            try: () => auth.updateUser(userId, { disabled: true }),
            catch: (error) => new UnexpectedError({ error })
        })
    )

    // 4. Update Status in Firestore
    const updatedUser = { ...user, status: "suspended" as const, roles: [] as const } // Remove roles? Or just suspend?
    // Let's just set status to suspended.
    const suspendedUser = { ...user, status: "suspended" as const }
    yield* _(repo.update(suspendedUser))

    return suspendedUser
  })
