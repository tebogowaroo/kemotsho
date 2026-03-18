import { Effect } from "effect"
import { ContentRepository } from "../domain/ContentRepository"
import { ContentKind } from "../domain/Content"

export const listContentByKind = (kind: typeof ContentKind.Type, limit: number = 3) =>
  Effect.gen(function* (_) {
    const repo = yield* _(ContentRepository)
    return yield* _(repo.listByKind(kind, { limit }))
  })
