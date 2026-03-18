import { Effect, Layer, Either } from "effect"
import { db } from "@kemotsho/core/infra/firebase/admin"
import { ContentRepository } from "../domain/ContentRepository"
import { ContentItem, ContentId, Slug } from "../domain/Content"
import { NotFound, UnexpectedError } from "@kemotsho/core/domain/errors"
import { Schema } from "effect"

// Helper to safe convert Firestore Timestamps to JS Integers/Agostic Dates
const toDate = (val: any) => {
    if (!val) return undefined 
    if (typeof val.toDate === 'function') return val.toDate()
    if (val instanceof Date) return val
    if (typeof val === 'string') return new Date(val)
    return undefined
}

// Helper for ImageRef
const normalizeImage = (img: any) => {
    if (!img || typeof img !== 'object') return null
    return {
        storagePath: img.storagePath || "",
        altText: img.altText || "",
        width: img.width ?? null,
        height: img.height ?? null
    }
}

// Normalizer
const normalizeContent = (doc: FirebaseFirestore.DocumentData, id: string): any => {
    const data = doc
    
    // Deep Normalization to satisfy Schema.Struct strictness
    
    // 1. Media
    let media = null
    if (data.media) {
        media = {
             featured: normalizeImage(data.media.featured),
             thumbnail: normalizeImage(data.media.thumbnail),
             gallery: Array.isArray(data.media.gallery) ? data.media.gallery.map(normalizeImage) : null
        }
    }

    // 2. SEO
    let seo = null
    if (data.seo && typeof data.seo === 'object') {
        seo = {
            title: typeof data.seo.title === 'string' ? data.seo.title : null,
            description: typeof data.seo.description === 'string' ? data.seo.description : null,
            keywords: Array.isArray(data.seo.keywords) ? data.seo.keywords : null
        }
    }

    // 3. Taxonomy
    let taxonomy = null
    if (data.taxonomy) {
        taxonomy = {
            categories: Array.isArray(data.taxonomy.categories) ? data.taxonomy.categories : null,
            tags: Array.isArray(data.taxonomy.tags) ? data.taxonomy.tags : null
        }
    }

    return {
        id: id,
        kind: data.kind || "blog", // Default fallback if missing
        slug: data.slug || "",
        title: data.title || "Untitled",
        excerpt: typeof data.excerpt === 'string' ? data.excerpt : null,
        body: data.body || "",
        
        media,
        seo,
        taxonomy,

        // Ensure access object structure
        access: {
            visibility: data.access?.visibility ?? "public",
            roles: Array.isArray(data.access?.roles) ? data.access.roles : null
        },

        // Normalize Dates
        lifecycle: {
            status: data.lifecycle?.status ?? "draft",
            publishedAt: toDate(data.lifecycle?.publishedAt)?.toISOString() ?? null,
            scheduledAt: toDate(data.lifecycle?.scheduledAt)?.toISOString() ?? null,
            expiresAt: toDate(data.lifecycle?.expiresAt)?.toISOString() ?? null,
        },
        audit: {
            createdBy: typeof data.audit?.createdBy === 'string' ? data.audit.createdBy : "system",
            updatedBy: typeof data.audit?.updatedBy === 'string' ? data.audit.updatedBy : null,
            createdAt: toDate(data.audit?.createdAt)?.toISOString() ?? new Date().toISOString(),
            updatedAt: toDate(data.audit?.updatedAt)?.toISOString() ?? new Date().toISOString(),
        }
    }
}

const make = Effect.succeed({
  findById: (id: ContentId) =>
    Effect.tryPromise({
      try: async () => {
        const snap = await db.collection("content_items").doc(id).get()
        if (!snap.exists) {
          throw new Error("NOT_FOUND")
        }
        return normalizeContent(snap.data()!, snap.id)
      },
      catch: (error) => {
        if (error instanceof Error && error.message === "NOT_FOUND") {
          return new NotFound({ entity: "ContentItem", id })
        }
        return new UnexpectedError({ error })
      }
    }).pipe(
      Effect.flatMap(Schema.decodeUnknown(ContentItem)),
      Effect.mapError((error) => 
        error._tag === "ParseError" 
          ? new UnexpectedError({ error }) 
          : error
      )
    ),

  findBySlug: (slug: Slug) =>
    Effect.tryPromise({
      try: async () => {
        const snap = await db.collection("content_items")
          .where("slug", "==", slug)
          .limit(1)
          .get()
        
        if (snap.empty) {
           throw new Error("NOT_FOUND")
        }
        const doc = snap.docs[0]
        
        // Safety check for TS
        if (!doc) {
           throw new Error("NOT_FOUND")
        }

        return normalizeContent(doc.data(), doc.id)
      },
      catch: (error) => {
         if (error instanceof Error && error.message === "NOT_FOUND") {
          return new NotFound({ entity: "ContentItem", id: slug }) // slug as ID approx
        }
        return new UnexpectedError({ error })
      }
    }).pipe(
      Effect.flatMap(Schema.decodeUnknown(ContentItem)),
      Effect.mapError((error) => 
        error._tag === "ParseError" 
          ? new UnexpectedError({ error }) 
          : error
      )
    ),

  save: (content: ContentItem) =>
    Schema.encode(ContentItem)(content).pipe(
      Effect.flatMap((encoded) => 
        Effect.tryPromise({
          try: async () => {
            // Add normalized field for case-insensitive search
            const docData = {
                ...(encoded as object),
                _searchTitle: content.title.toLowerCase()
            }
            await db.collection("content_items").doc(content.id).set(docData, { merge: true })
            return content
          },
          catch: (error) => new UnexpectedError({ error })
        })
      ),
      Effect.mapError((error) => 
        error._tag === "ParseError" 
          ? new UnexpectedError({ error }) 
          : error
      )
    ),

  delete: (id: ContentId) =>
    Effect.tryPromise({
        try: async () => {
             await db.collection("content_items").doc(id).delete()
        },
        catch: (error) => new UnexpectedError({ error })
    }),

  list: (params?: { limit?: number; offset?: number }) =>
     Effect.tryPromise({
        try: async () => {
            let query: FirebaseFirestore.Query = db.collection("content_items")
            
            if (params?.limit) query = query.limit(params.limit)
            if (params?.offset) query = query.offset(params.offset)
            
            const snap = await query.get()
            return snap.docs.map(doc => normalizeContent(doc.data(), doc.id))
        },
        catch: (error) => new UnexpectedError({ error })
     }).pipe(
      // Soft validation: Decode each item individually, log errors, but return valid items.
      Effect.flatMap((rawItems: any[]) => 
         Effect.forEach(rawItems, (item) => 
            Schema.decodeUnknown(ContentItem)(item).pipe(
                Effect.either
            )
         )
      ),
      Effect.map((results) => {
          const validItems: ContentItem[] = []
          results.forEach(res => {
              if (Either.isLeft(res)) {
                  console.error(`[ListContent] Skipping invalid item:`, res.left)
              } else {
                  validItems.push(res.right)
              }
          })
          return validItems
      })
    ),

    listByKind: (kind: string, params?: { limit?: number }) =>
      Effect.tryPromise({
        try: async () => {
          let query: FirebaseFirestore.Query = db.collection("content_items")
            .where("kind", "==", kind)
            .where("lifecycle.status", "==", "published")
            .orderBy("lifecycle.publishedAt", "desc")

          if (params?.limit) query = query.limit(params.limit)

          const snap = await query.get()
          return snap.docs.map(doc => normalizeContent(doc.data(), doc.id))
        },
        catch: (error) => new UnexpectedError({ error })
      }).pipe(
        // Use same soft validation logic
        Effect.flatMap((rawItems: any[]) =>
          Effect.forEach(rawItems, (item) =>
            Schema.decodeUnknown(ContentItem)(item).pipe(
              Effect.either
            )
          )
        ),
        Effect.map((results) => {
          const validItems: ContentItem[] = []
          results.forEach(res => {
            if (Either.isLeft(res)) {
              // Be silent or log warning?
            } else {
              validItems.push(res.right)
            }
          })
          return validItems
        })
      ),

    search: (params: { kind?: any; term?: string; page: number; limit: number }) => {
      const { kind, term, page, limit } = params
      return Effect.tryPromise({
        try: async () => {
          let query: FirebaseFirestore.Query = db.collection("content_items")
            .where("lifecycle.status", "==", "published")
            
          if (kind) {
            query = query.where("kind", "==", kind)
          }

          if (term) {
            // Case-insensitive search using normalized field
            const termLower = term.toLowerCase()
            query = query
              .where("_searchTitle", ">=", termLower)
              .where("_searchTitle", "<=", termLower + "\uf8ff")
              .orderBy("_searchTitle")
          } else {
            query = query.orderBy("lifecycle.publishedAt", "desc")
          }

          // Count
          const countSnap = await query.count().get()
          const total = countSnap.data().count

          // Paginate
          const offset = (page - 1) * limit
          query = query.offset(offset).limit(limit)

          const snap = await query.get()
          const items = snap.docs.map(doc => normalizeContent(doc.data(), doc.id))
          
          return { items, total }
        },
        catch: (error) => new UnexpectedError({ error })
      }).pipe(
          Effect.flatMap(({ items: rawItems, total }) => 
             Effect.forEach(rawItems, (item) => 
               Schema.decodeUnknown(ContentItem)(item).pipe(
                  Effect.either
               )
             ).pipe(
                Effect.map(results => {
                   const validItems: ContentItem[] = []
                   results.forEach(res => {
                       if (Either.isRight(res)) validItems.push(res.right)
                   })
                   return { items: validItems, total }
                })
             )
          )
      )
    }
})

export const FirebaseContentRepositoryLive = Layer.effect(ContentRepository, make)
