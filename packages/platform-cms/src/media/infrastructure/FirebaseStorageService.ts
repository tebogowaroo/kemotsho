// src/modules/media/infrastructure/FirebaseStorageService.ts
import { Effect, Layer } from "effect"
import { app } from "@kemotsho/core/infra/firebase/admin"
import { getStorage } from "firebase-admin/storage"
import { MediaService } from "../domain/MediaService"
import { UnexpectedError } from "@kemotsho/core/domain/errors"

const make = Effect.succeed({
  getUploadUrl: (fileName: string, contentType: string) =>
    Effect.tryPromise({
      try: async () => {
        const bucket = getStorage(app).bucket()
        const storagePath = `uploads/${crypto.randomUUID()}-${fileName}`
        const file = bucket.file(storagePath)

        const [uploadUrl] = await file.getSignedUrl({
          action: "write",
          expires: Date.now() + 1000 * 60 * 15, // 15 minutes
          contentType
        })

        return { uploadUrl, storagePath }
      },
      catch: (error) => new UnexpectedError({ error })
    }),

  listFiles: (prefix?: string) =>
    Effect.tryPromise({
      try: async () => {
        const bucket = getStorage(app).bucket()
        const [files] = await bucket.getFiles({
            prefix: prefix || "uploads/", // Ensure this matches getUploadUrl
            maxResults: 50
        })
        
        return await Promise.all(files.map(async (file) => {
             const [url] = await file.getSignedUrl({
                action: "read",
                expires: Date.now() + 1000 * 60 * 60 * 24 // 24 hours
             })
             // Return the storage path (file.name) as the unique ID/Name
             return { name: file.name, url } 
        }))
      },
      catch: (error) => new UnexpectedError({ error })
    }),

  getPublicUrl: (storagePath: string) =>
    Effect.tryPromise({
        try: async () => {
             const bucket = getStorage(app).bucket()
             // Ensure strict path matching. 
             // If storagePath relies on partial matching or has encoding issues, correct here.
             
             // Sanitize path: 
             // 1. Remove leading slash if present
             const cleanPath = storagePath.startsWith('/') ? storagePath.slice(1) : storagePath
             
             const file = bucket.file(cleanPath)

             // Check if file exists implicitly by trying to sign URL (it won't fail if missing, but it's a good step)
             // We can also check exists() but that's an extra network call.
             
             const [url] = await file.getSignedUrl({
                action: "read",
                expires: Date.now() + 1000 * 60 * 60 * 24 // 24 hours
             })
             return url
        },
        catch: (error) => new UnexpectedError({ error })
    })
})

export const FirebaseStorageServiceLive = Layer.effect(MediaService, make)
