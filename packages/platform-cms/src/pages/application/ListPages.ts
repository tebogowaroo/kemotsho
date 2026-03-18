import { Effect } from "effect"
import { PageRepository } from "../domain/PageRepository"

export const listPages = () =>
    Effect.gen(function*(_) {
        const repo = yield* _(PageRepository)
        return yield* _(repo.list())
    })
