import { Effect, Clock, Option } from "effect"
import { PageRepository } from "../domain/PageRepository"
import { Page, PageId, PageSection } from "../domain/Page"
import { Schema } from "effect"
import { NotFound, UnexpectedError } from "@kemotsho/core/domain/errors"

export const UpdatePageInput = Schema.Struct({
    id: PageId,
    title: Schema.optional(Schema.String),
    sections: Schema.optional(Schema.Array(PageSection)),
    isPublished: Schema.optional(Schema.Boolean),
    seoTitle: Schema.optional(Schema.String),
    seoDescription: Schema.optional(Schema.String)
})

export const updatePage = (input: typeof UpdatePageInput.Type) =>
    Effect.gen(function*(_) {
        const repo = yield* _(PageRepository)
        const now = yield* _(Clock.currentTimeMillis)
        
        const existing = yield* _(repo.findById(input.id))
        
        const updated: Page = {
            ...existing,
            title: input.title ?? existing.title,
            sections: input.sections ?? existing.sections,
            isPublished: input.isPublished ?? existing.isPublished,
            seo: {
                title: input.seoTitle !== undefined 
                    ? (input.seoTitle ? Option.some(input.seoTitle) : Option.none())
                    : existing.seo.title,
                description: input.seoDescription !== undefined
                    ? (input.seoDescription ? Option.some(input.seoDescription) : Option.none())
                    : existing.seo.description
            },
            updatedAt: new Date(now)
        }
        
        return yield* _(repo.save(updated))
    })
