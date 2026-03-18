import { Effect, Clock, Option } from "effect"
import { ContentRepository } from "../domain/ContentRepository"
import { ContentItem, ContentId, ContentStatus } from "../domain/Content"
import { Schema } from "effect"
import { NotFound, UnexpectedError } from "@kemotsho/core/domain/errors"

// Input Schema for updating content
export const UpdateContentRef = Schema.Struct({
  id: ContentId,
  slug: Schema.optional(ContentItem.fields.slug),
  title: Schema.optional(ContentItem.fields.title),
  excerpt: Schema.optional(Schema.String.pipe(Schema.maxLength(160))),
  body: Schema.optional(ContentItem.fields.body),
  status: Schema.optional(ContentStatus),
  updaterId: ContentItem.fields.audit.fields.createdBy, // Reusing UserID type
  featuredImagePath: Schema.optional(Schema.String),
  featuredImageAlt: Schema.optional(Schema.String)
})

export const updateContent = (input: typeof UpdateContentRef.Type) =>
  Effect.gen(function* (_) {
    const repo = yield* _(ContentRepository)
    const now = yield* _(Clock.currentTimeMillis)
    const date = new Date(now)

    // 1. Fetch existing
    const existing = yield* _(repo.findById(input.id))

    // 2. Prepare updates
    let newMedia = existing.media

    if (input.featuredImagePath !== undefined) {
         const featuredImage = input.featuredImagePath ? Option.some({
            storagePath: input.featuredImagePath,
            altText: input.featuredImageAlt || "",
            width: Option.none(),
            height: Option.none()
        }) : Option.none()
        
        // Preserve other media fields if they exist
        const prevThumbnail = Option.flatMap(existing.media, m => m.thumbnail)
        const prevGallery = Option.flatMap(existing.media, m => m.gallery)

        newMedia = Option.some({
            featured: featuredImage,
            thumbnail: prevThumbnail,
            gallery: prevGallery
        })
    }

    // Handle Status Change
    const newStatus = input.status ?? existing.lifecycle.status
    let newPublishedAt = existing.lifecycle.publishedAt
    
    // If transitioning to published and no publishedAt date exists, set it
    if (newStatus === "published" && existing.lifecycle.status !== "published" && Option.isNone(existing.lifecycle.publishedAt)) {
        newPublishedAt = Option.some(date)
    }

    const updated: ContentItem = {
        ...existing,
        slug: input.slug ?? existing.slug,
        title: input.title ?? existing.title,
        excerpt: input.excerpt !== undefined ? (input.excerpt ? Option.some(input.excerpt) : Option.none()) : existing.excerpt,
        body: input.body ?? existing.body,
        media: newMedia,
        lifecycle: {
            ...existing.lifecycle,
            status: newStatus,
            publishedAt: newPublishedAt
        },
        audit: {
            ...existing.audit,
            updatedBy: Option.some(input.updaterId),
            updatedAt: date
        }
    }

    // 3. Save
    const saved = yield* _(repo.save(updated))
    return saved
  })
