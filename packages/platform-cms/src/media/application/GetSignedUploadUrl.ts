import { Effect } from "effect"
import { MediaService } from "../domain/MediaService"
import { Schema } from "effect"

export const UploadRequest = Schema.Struct({
    fileName: Schema.String,
    contentType: Schema.String
})

export const getSignedUploadUrl = (input: typeof UploadRequest.Type) =>
  Effect.gen(function* (_) {
    const service = yield* _(MediaService)
    
    // In a real app, we would validate file extensions/types against a whitelist here
    // e.g., only allow image/jpeg, image/png

    return yield* _(service.getUploadUrl(input.fileName, input.contentType))
  })
