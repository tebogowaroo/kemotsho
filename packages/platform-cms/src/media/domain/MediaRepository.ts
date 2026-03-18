// src/modules/media/domain/MediaRepository.ts
import { Context, Effect } from "effect"
import { MediaItem, MediaId } from "./Media"
import { NotFound, UnexpectedError } from "@kemotsho/core/domain/errors"

export class MediaRepository extends Context.Tag("media/MediaRepository")<
  MediaRepository,
  {
    readonly save: (media: MediaItem) => Effect.Effect<MediaItem, UnexpectedError>
    readonly findById: (id: MediaId) => Effect.Effect<MediaItem, NotFound | UnexpectedError>
    readonly list: (params?: { limit?: number; offset?: number }) => Effect.Effect<readonly MediaItem[], UnexpectedError>
    readonly delete: (id: MediaId) => Effect.Effect<void, UnexpectedError>
  }
>() {}
