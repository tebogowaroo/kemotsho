import { Effect } from "effect"
import { MediaRepository } from "../domain/MediaRepository"

export const listMedia = (params?: { limit?: number; offset?: number }) => 
    Effect.gen(function* (_) {
        const repo = yield* _(MediaRepository)
        return yield* _(repo.list(params))
    })
