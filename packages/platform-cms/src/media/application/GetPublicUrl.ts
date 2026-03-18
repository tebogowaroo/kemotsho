import { Effect } from "effect"
import { MediaService } from "../domain/MediaService"

export const getPublicUrl = (storagePath: string) =>
  Effect.gen(function* (_) {
    const service = yield* _(MediaService)
    return yield* _(service.getPublicUrl(storagePath))
  })
