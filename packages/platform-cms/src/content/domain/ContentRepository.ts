import { Context, Effect } from "effect"
import { ContentItem, ContentId, Slug, ContentKind } from "./Content"
import { NotFound, UnexpectedError } from "@kemotsho/core/domain/errors"

export class ContentRepository extends Context.Tag("content/ContentRepository")<
  ContentRepository,
  {
    readonly findById: (id: ContentId) => Effect.Effect<ContentItem, NotFound | UnexpectedError>
    
    // SEO friendly lookup
    readonly findBySlug: (slug: Slug) => Effect.Effect<ContentItem, NotFound | UnexpectedError>
    
    readonly save: (content: ContentItem) => Effect.Effect<ContentItem, UnexpectedError>
    
    readonly delete: (id: ContentId) => Effect.Effect<void, NotFound | UnexpectedError>
    
    // Basic list for now, effectively a "scan"
    readonly list: (
        params?: { limit?: number; offset?: number }
    ) => Effect.Effect<readonly ContentItem[], UnexpectedError>

    readonly listByKind: (
      kind: typeof ContentKind.Type,
      options?: { limit?: number }
    ) => Effect.Effect<readonly ContentItem[], UnexpectedError>

    readonly search: (params: {
        kind?: typeof ContentKind.Type
        term?: string
        page: number
        limit: number
    }) => Effect.Effect<{ items: readonly ContentItem[]; total: number }, UnexpectedError>
  }
>() {}
