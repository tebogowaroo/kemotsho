import { Effect, Clock, Option } from "effect"
import { PageRepository } from "../domain/PageRepository"
import { Page, PageId } from "../domain/Page"
import { Slug } from "@kemotsho/platform-cms/content/domain/Content"
import { Schema } from "effect"

export const CreatePageInput = Schema.Struct({
    title: Schema.String,
    slug: Slug,
    seoTitle: Schema.optional(Schema.String),
    seoDescription: Schema.optional(Schema.String)
})

export const createPage = (input: typeof CreatePageInput.Type) => 
    Effect.gen(function*(_) {
        const repo = yield* _(PageRepository)
        const now = yield* _(Clock.currentTimeMillis)
        
        // TODO: Validate Slug Uniqueness?
        // Firestore rules or a prior check can handle this.
        
        const page: Page = {
            id: PageId.make(crypto.randomUUID()),
            slug: input.slug,
            title: input.title,
            sections: [], // Start empty
            seo: {
                title: input.seoTitle ? Option.some(input.seoTitle) : Option.none(),
                description: input.seoDescription ? Option.some(input.seoDescription) : Option.none()
            },
            isPublished: false,
            updatedAt: new Date(now)
        }
        
        return yield* _(repo.save(page))
    })
