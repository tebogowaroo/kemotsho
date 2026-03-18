import { Effect } from "effect"
import { PageRepository } from "../domain/PageRepository"
import { Slug } from "@kemotsho/platform-cms/content/domain/Content"
import { PageId } from "../domain/Page"

export const getPageBySlug = (slug: Slug) =>
    Effect.gen(function*(_) {
        const repo = yield* _(PageRepository)
        return yield* _(repo.findBySlug(slug))
    })

export const getPageById = (id: PageId) =>
    Effect.gen(function*(_) {
        const repo = yield* _(PageRepository)
        return yield* _(repo.findById(id))
    })
