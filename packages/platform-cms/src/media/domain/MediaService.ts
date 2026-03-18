// src/modules/media/domain/MediaService.ts
import { Context, Effect } from "effect"
import { UnexpectedError } from "@kemotsho/core/domain/errors"

export class MediaService extends Context.Tag("media/MediaService")<
  MediaService,
  {
    readonly getUploadUrl: (
        fileName: string, 
        contentType: string
    ) => Effect.Effect<{ uploadUrl: string; storagePath: string }, UnexpectedError>

    readonly listFiles: (
        prefix?: string
    ) => Effect.Effect<readonly { name: string; url: string }[], UnexpectedError>

    readonly getPublicUrl: (
        storagePath: string
    ) => Effect.Effect<string, UnexpectedError>
  }
>() {}
