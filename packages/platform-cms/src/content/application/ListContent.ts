import { Effect } from "effect"
import { ContentRepository } from "../domain/ContentRepository"

export const listContent = (params?: { limit?: number; offset?: number }) =>
  Effect.gen(function* (_) {
    const repo = yield* _(ContentRepository)
    return yield* _(repo.list(params))
  })
