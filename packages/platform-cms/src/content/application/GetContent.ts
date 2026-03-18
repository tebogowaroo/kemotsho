import { Effect } from "effect"
import { ContentRepository } from "../domain/ContentRepository"
import { ContentId, Slug } from "../domain/Content"

export const getContent = (id: ContentId) =>
  Effect.gen(function* (_) {
    const repo = yield* _(ContentRepository)
    const item = yield* _(repo.findById(id))
    return item
  })

export const getContentBySlug = (slug: Slug) =>
  Effect.gen(function* (_) {
    const repo = yield* _(ContentRepository)
    return yield* _(repo.findBySlug(slug))
  })
