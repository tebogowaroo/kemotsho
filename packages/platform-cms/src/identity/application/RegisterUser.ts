import { Effect, Context } from "effect"
import { UserRepository } from "../domain/UserRepository"
import { CreateUser, User } from "../domain/User"
import { UnexpectedError } from "@kemotsho/core/domain/errors"

/*
 * Use Case: Register a new user
 * This is a pure Effect that depends on UserRepository
 */
export const registerUser = (input: typeof CreateUser.Type) =>
  Effect.gen(function* (_) {
    const repo = yield* _(UserRepository)

    // 1. In a real app, you might check for duplicates here if the ID wasn't guaranteed unique by Auth provider
    // For Firebase Auth compatibility, the ID is the uid from the token, so it's unique by definition.

    // 2. Create the user in Firestore
    const user = yield* _(repo.create(input))

    // 3. (Optional) Log analytics, send welcome email, etc.
    yield* _(Effect.log(`User registered: ${user.id}`))

    return user
  })
