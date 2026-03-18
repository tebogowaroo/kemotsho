import { Schema } from "effect"
import { makeId } from "@kemotsho/core/domain/ids"
import { UserId, UserRole } from "@kemotsho/platform-cms/identity/domain/User"

/*
 * 1. Value Objects
 */
export const ContentId = makeId("ContentId")
export type ContentId = Schema.Schema.Type<typeof ContentId>

export const Title = Schema.String.pipe(
  Schema.minLength(3),
  Schema.maxLength(120),
  Schema.brand("Title")
)

export const Slug = Schema.String.pipe(
  // Allow root "/", simple slugs "about", and paths "about/us"
  // Must accept: "/", "foo", "foo-bar", "foo/bar", "/foo"
  Schema.pattern(/^(\/|(\/?[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*))$/),
  Schema.brand("Slug")
)
export type Slug = Schema.Schema.Type<typeof Slug>

export const MarkdownContent = Schema.String.pipe(
  Schema.minLength(1),
  Schema.brand("MarkdownContent")
)

export const ImageRef = Schema.Struct({
  storagePath: Schema.String,
  altText: Schema.String,
  width: Schema.OptionFromNullOr(Schema.Number),
  height: Schema.OptionFromNullOr(Schema.Number)
})

export const SeoMetadata = Schema.Struct({
  title: Schema.OptionFromNullOr(Schema.String),
  description: Schema.OptionFromNullOr(Schema.String),
  keywords: Schema.OptionFromNullOr(Schema.Array(Schema.String))
})

/*
 * 2. Enums / Unions
 */
export const ContentKind = Schema.Literal(
  "blog",
  "news",
  "circular",
  "service",
  "product",
  "profile"
)

export const ContentStatus = Schema.Literal("draft", "review", "published", "archived")

export const Visibility = Schema.Literal("public", "restricted")

/*
 * 3. Aggregates
 */
export const ContentItem = Schema.Struct({
  id: ContentId,
  kind: ContentKind,
  slug: Slug,
  title: Title,
  excerpt: Schema.OptionFromNullOr(Schema.String),
  body: MarkdownContent,
  
  media: Schema.OptionFromNullOr(Schema.Struct({
    featured: Schema.OptionFromNullOr(ImageRef),
    thumbnail: Schema.OptionFromNullOr(ImageRef),
    gallery: Schema.OptionFromNullOr(Schema.Array(ImageRef))
  })),

  seo: Schema.OptionFromNullOr(SeoMetadata),

  lifecycle: Schema.Struct({
    status: ContentStatus,
    publishedAt: Schema.OptionFromNullOr(Schema.Date),
    scheduledAt: Schema.OptionFromNullOr(Schema.Date),
    expiresAt: Schema.OptionFromNullOr(Schema.Date)
  }),

  access: Schema.Struct({
    visibility: Visibility,
    roles: Schema.OptionFromNullOr(Schema.Array(UserRole))
  }),

  taxonomy: Schema.OptionFromNullOr(Schema.Struct({
    categories: Schema.OptionFromNullOr(Schema.Array(Schema.String)),
    tags: Schema.OptionFromNullOr(Schema.Array(Schema.String))
  })),

  audit: Schema.Struct({
    createdBy: UserId,
    updatedBy: Schema.OptionFromNullOr(UserId),
    createdAt: Schema.Date,
    updatedAt: Schema.Date
  })
})

export type ContentItem = Schema.Schema.Type<typeof ContentItem>
