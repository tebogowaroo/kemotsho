// src/modules/media/application/CreateMedia.ts
import { Effect, Clock, Option } from "effect"
import { MediaRepository } from "../domain/MediaRepository"
import { MediaItem, MediaId, CreateMedia as CreateMediaDTO } from "../domain/Media"
import { MediaService } from "../domain/MediaService"
import { UserId } from "@kemotsho/platform-cms/identity/domain/User"
import { getStorage } from "firebase-admin/storage"
import { app } from "@kemotsho/core/infra/firebase/admin"
import { UnexpectedError } from "@kemotsho/core/domain/errors"

export const createMedia = (input: typeof CreateMediaDTO.Type & { uploaderId: UserId }) =>
  Effect.gen(function* (_) {
    const repo = yield* _(MediaRepository)
    // We might need MediaService for URL signing if not already signed?
    // But typically the file is ALREADY uploaded. We just need to register it.
    
    // Generate Signed URL for public access (Long Lived) or just use the canonical public URL if available?
    // For now, let's generate a signed URL for 1 year or use a public bucket logic.
    // Let's assume we generate a signed URL here.
    const signedUrl = yield* _(Effect.tryPromise({
        try: async () => {
             const bucket = getStorage(app).bucket()
             const file = bucket.file(input.storagePath)
             const [url] = await file.getSignedUrl({
                action: "read",
                expires: Date.now() + 1000 * 60 * 60 * 24 * 365 // 1 Year
             })
             return url
        },
        catch: (error) => new UnexpectedError({ error })
    }))

    const now = yield* _(Clock.currentTimeMillis)
    
    const mediaItem: MediaItem = {
        id: MediaId.make(crypto.randomUUID()),
        originalFilename: input.originalFilename,
        storagePath: input.storagePath,
        mimeType: input.mimeType,
        size: input.size,
        publicUrl: signedUrl,
        
        altText: input.altText,
        caption: Option.none(), // Not in DTO yet
        
        dimensions: (input.width && input.height) ? Option.some({
            width: input.width,
            height: input.height
        }) : Option.none(),

        audit: {
            uploadedBy: input.uploaderId,
            createdAt: new Date(now),
            updatedAt: new Date(now)
        }
    }

    const saved = yield* _(repo.save(mediaItem))
    return saved
  })
