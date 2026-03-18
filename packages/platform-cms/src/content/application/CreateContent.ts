import { Effect, Clock, Option } from "effect"
import { ContentRepository } from "../domain/ContentRepository"
import { ContentItem, ContentId } from "../domain/Content"
import { Schema } from "effect"
import { UnexpectedError } from "@kemotsho/core/domain/errors"

// Input Schema for creating content (partial aggregate)
export const CreateContentRef = Schema.Struct({
  kind: ContentItem.fields.kind,
  slug: ContentItem.fields.slug,
  title: ContentItem.fields.title,
  excerpt: Schema.optional(Schema.String.pipe(Schema.maxLength(160))),
  body: ContentItem.fields.body,
  authorId: ContentItem.fields.audit.fields.createdBy,
  featuredImagePath: Schema.optional(Schema.String),
  featuredImageAlt: Schema.optional(Schema.String)
})

export const createContent = (input: typeof CreateContentRef.Type) =>
  Effect.gen(function* (_) {
    const repo = yield* _(ContentRepository)
    const now = yield* _(Clock.currentTimeMillis)
    const date = new Date(now)

    // Handle featured image construction
    const featuredImage = input.featuredImagePath ? Option.some({
        storagePath: input.featuredImagePath,
        altText: input.featuredImageAlt || "",
        width: Option.none(),
        height: Option.none()
    }) : Option.none()

    const media = Option.isSome(featuredImage) ? Option.some({
        featured: featuredImage,
        thumbnail: Option.none(),
        gallery: Option.none()
    }) : Option.none()

    // Construct the full aggregate
    // In a real app, this logic might be more complex (defaulting fields based on Kind)
    const content: ContentItem = {
      id: ContentId.make(crypto.randomUUID()), // Generate ID
      kind: input.kind,
      slug: input.slug,
      title: input.title,
      body: input.body,
      excerpt: input.excerpt ? Option.some(input.excerpt) : Option.none(),
      
      media: media,
      seo: Option.none(),
      
      lifecycle: {
        status: "draft",
        publishedAt: Option.none(),
        scheduledAt: Option.none(),
        expiresAt: Option.none()
      },

      access: {
        visibility: "public",
        roles: Option.none()
      },

      taxonomy: Option.none(),

      audit: {
        createdBy: input.authorId,
        updatedBy: Option.none(),
        createdAt: date,
        updatedAt: date
      }
    }

    // Persist
    const saved = yield* _(repo.save(content))
    return saved
  })
