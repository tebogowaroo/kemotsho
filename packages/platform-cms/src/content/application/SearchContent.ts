import { Effect } from "effect"
import { ContentRepository } from "../domain/ContentRepository"
import { ContentKind } from "../domain/Content"

export const searchContent = (
    params: {
        kind?: typeof ContentKind.Type
        term?: string
        page: number
        limit: number
    }
) => Effect.gen(function* (_) {
    const repo = yield* _(ContentRepository)
    return yield* _(repo.search(params))
})
