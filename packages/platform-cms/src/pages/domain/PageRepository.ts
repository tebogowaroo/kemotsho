import { Context, Effect } from "effect"
import { Page, PageId } from "./Page"
import { Slug } from "@kemotsho/platform-cms/content/domain/Content"
import { NotFound, UnexpectedError } from "@kemotsho/core/domain/errors"

export class PageRepository extends Context.Tag("pages/PageRepository")<
  PageRepository,
  {
    readonly findById: (id: PageId) => Effect.Effect<Page, NotFound | UnexpectedError>
    readonly findBySlug: (slug: Slug) => Effect.Effect<Page, NotFound | UnexpectedError>
    readonly save: (page: Page) => Effect.Effect<Page, UnexpectedError>
    readonly list: () => Effect.Effect<readonly Page[], UnexpectedError>
  }
>() {}
