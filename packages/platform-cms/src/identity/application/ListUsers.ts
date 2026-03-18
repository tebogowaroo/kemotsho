import { Effect } from "effect"
import { UserRepository } from "../domain/UserRepository"

export const listUsers = (params?: { limit?: number; offset?: number }) =>
  Effect.gen(function* (_) {
    const repo = yield* _(UserRepository)
    return yield* _(repo.list(params))
  })
