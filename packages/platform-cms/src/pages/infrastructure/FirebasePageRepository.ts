import { Effect, Layer, Either } from "effect"
import { db } from "@kemotsho/core/infra/firebase/admin"
import { PageRepository } from "../domain/PageRepository"
import { Page, PageId } from "../domain/Page"
import { Slug } from "@kemotsho/platform-cms/content/domain/Content"
import { NotFound, UnexpectedError } from "@kemotsho/core/domain/errors"
import { Schema } from "effect"

// Helper to safe convert Firestore Timestamps
const toDate = (val: any) => {
    if (!val) return undefined 
    if (typeof val.toDate === 'function') return val.toDate()
    if (val instanceof Date) return val
    if (typeof val === 'string') return new Date(val)
    return undefined
}

const normalizePage = (doc: FirebaseFirestore.DocumentData, id: string): any => {
    const data = doc
    
    // Ensure SEO structure
    let seo = null
    if (data.seo && typeof data.seo === 'object') {
        seo = {
            title: data.seo.title ?? null,
            description: data.seo.description ?? null
        }
    } else {
        seo = { title: null, description: null }
    }

    return {
        id: id,
        slug: data.slug || "",
        title: data.title || "Untitled",
        sections: Array.isArray(data.sections) ? data.sections : [],
        seo: seo,
        isPublished: data.isPublished ?? false,
        updatedAt: toDate(data.updatedAt)?.toISOString() ?? new Date().toISOString()
    }
}

const make = Effect.succeed({
  findById: (id: PageId) =>
    Effect.tryPromise({
      try: async () => {
        const snap = await db.collection("pages").doc(id).get()
        if (!snap.exists) {
            throw new Error("NOT_FOUND")
        }
        return normalizePage(snap.data()!, snap.id)
      },
      catch: (error) => {
        if (error instanceof Error && error.message === "NOT_FOUND") {
          return new NotFound({ entity: "Page", id })
        }
        return new UnexpectedError({ error })
      }
    }).pipe(
      Effect.flatMap(Schema.decodeUnknown(Page)),
      Effect.mapError(e => e._tag === "ParseError" ? new UnexpectedError({ error: e }) : e)
    ),

  findBySlug: (slug: Slug) =>
    Effect.tryPromise({
      try: async () => {
        const snap = await db.collection("pages").where("slug", "==", slug).limit(1).get()
        if (snap.empty) {
          throw new Error("NOT_FOUND")
        }
        const doc = snap.docs[0]
        if (!doc) {
           throw new Error("NOT_FOUND")
        }
        return normalizePage(doc.data(), doc.id)
      },
      catch: (error) => {
        if (error instanceof Error && error.message === "NOT_FOUND") {
          return new NotFound({ entity: "Page", id: slug }) // Slug as ID proxy
        }
        return new UnexpectedError({ error })
      }
    }).pipe(
      Effect.flatMap(Schema.decodeUnknown(Page)),
      Effect.mapError(e => e._tag === "ParseError" ? new UnexpectedError({ error: e }) : e)
    ),

  save: (page: Page) =>
    Effect.gen(function* (_) {
       const encoded = yield* _(Schema.encode(Page)(page))
       
       yield* _(Effect.tryPromise({
          try: async () => {
              await db.collection("pages").doc(page.id).set(encoded, { merge: true })
          },
          catch: (error) => new UnexpectedError({ error })
       }))
       
       return page
    }).pipe(
       Effect.mapError(e => e._tag === "ParseError" ? new UnexpectedError({ error: e }) : e)
    ),

  list: () =>
     Effect.tryPromise({
        try: async () => {
            const snap = await db.collection("pages").orderBy("updatedAt", "desc").get()
            return snap.docs.map(doc => normalizePage(doc.data(), doc.id))
        },
        catch: (error) => new UnexpectedError({ error })
     }).pipe(
        // Soft validation: Decode each item individually
        Effect.flatMap((rawItems: any[]) => 
             Effect.forEach(rawItems, (item) => 
                Schema.decodeUnknown(Page)(item).pipe(
                    Effect.either
                )
             )
        ),
        Effect.map((results) => {
            const validItems: Page[] = []
            results.forEach(res => {
                if (Either.isLeft(res)) {
                    console.error(`[ListPages] Skipping invalid item:`, res.left)
                } else {
                    validItems.push(res.right)
                }
            })
            return validItems
        })
     )
})

export const FirebasePageRepositoryLive = Layer.effect(PageRepository, make)
