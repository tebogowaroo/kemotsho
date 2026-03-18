import { Effect, Layer, Either } from "effect"
import { db, app } from "@kemotsho/core/infra/firebase/admin"
import { MediaRepository } from "../domain/MediaRepository"
import { MediaItem, MediaId } from "../domain/Media"
import { NotFound, UnexpectedError } from "@kemotsho/core/domain/errors"
import { Schema } from "effect"
import { getStorage } from "firebase-admin/storage"

// Helper to safe convert Firestore Timestamps
const toDate = (val: any) => {
    if (!val) return undefined 
    if (typeof val.toDate === 'function') return val.toDate()
    return new Date(val)
}

// Normalizer for Media
const normalizeMedia = (doc: FirebaseFirestore.DocumentData, id: string): any => {
    const data = doc
    return {
        ...data,
        id: id,
        audit: {
            ...data.audit,
            createdAt: data.audit?.createdAt ? toDate(data.audit.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: data.audit?.updatedAt ? toDate(data.audit.updatedAt).toISOString() : new Date().toISOString(),
        }
    }
}

const make = Effect.succeed({
  save: (media: MediaItem) =>
    Schema.encode(MediaItem)(media).pipe(
      Effect.flatMap((encoded) => 
        Effect.tryPromise({
          try: async () => {
            await db.collection("media_items").doc(media.id).set(encoded, { merge: true })
            return media
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

  findById: (id: MediaId) =>
    Effect.tryPromise({
      try: async () => {
        const snap = await db.collection("media_items").doc(id).get()
        if (!snap.exists) {
            throw new Error("NOT_FOUND")
        }
        return normalizeMedia(snap.data()!, snap.id)
      },
      catch: (error) => {
        if (error instanceof Error && error.message === "NOT_FOUND") {
          return new NotFound({ entity: "MediaItem", id })
        }
        return new UnexpectedError({ error })
      }
    }).pipe(
      Effect.flatMap(Schema.decodeUnknown(MediaItem)),
      Effect.mapError((error) => 
        error._tag === "ParseError" 
          ? new UnexpectedError({ error }) 
          : error
      )
    ),

  list: (params?: { limit?: number; offset?: number }) =>
     Effect.tryPromise({
        try: async () => {
             // Basic Firestore query
            let query: FirebaseFirestore.Query = db.collection("media_items")
            // Default sort by recent
            query = query.orderBy("audit.createdAt", "desc")

            if (params?.limit) query = query.limit(params.limit)
            if (params?.offset) query = query.offset(params.offset)
            
            const snap = await query.get()
            return snap.docs.map(doc => normalizeMedia(doc.data(), doc.id))
        },
        catch: (error) => new UnexpectedError({ error })
     }).pipe(
      // Soft validation
      Effect.flatMap((rawItems: any[]) => 
         Effect.forEach(rawItems, (item) => 
            Schema.decodeUnknown(MediaItem)(item).pipe(
                Effect.either
            )
         )
      ),
      Effect.map((results) => {
          const validItems: MediaItem[] = []
          results.forEach(res => {
              if (Either.isLeft(res)) {
                  console.error(`[ListMedia] Skipping invalid item:`, res.left)
              } else {
                  validItems.push(res.right)
              }
          })
          return validItems
      })
    ),

  delete: (id: MediaId) =>
    Effect.tryPromise({
        try: async () => {
             // 1. Get Storage Path first
             const snap = await db.collection("media_items").doc(id).get()
             if(snap.exists) {
                 const data = snap.data()
                 if(data?.storagePath) {
                      const bucket = getStorage(app).bucket()
                      await bucket.file(data.storagePath).delete().catch(e => console.warn("Failed to delete File from Storage", e))
                 }
             }
             // 2. Delete DB record
             await db.collection("media_items").doc(id).delete()
        },
        catch: (error) => new UnexpectedError({ error })
    }),
})

export const FirebaseMediaRepositoryLive = Layer.effect(MediaRepository, make)
