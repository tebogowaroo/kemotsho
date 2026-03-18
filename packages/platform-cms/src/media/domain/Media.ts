import { Schema } from "effect"
import { makeId } from "@kemotsho/core/domain/ids"
import { UserId } from "@kemotsho/platform-cms/identity/domain/User"

/*
 * 1. Value Objects
 */
export const MediaId = makeId("MediaId")
export type MediaId = Schema.Schema.Type<typeof MediaId>

/*
 * 2. Media Item Entity
 */
export const MediaItem = Schema.Struct({
  id: MediaId,
  originalFilename: Schema.String,
  storagePath: Schema.String, // GS Path
  publicUrl: Schema.String,
  mimeType: Schema.String,
  size: Schema.Number, // Bytes
  
  // Metadata
  altText: Schema.OptionFromNullOr(Schema.String),
  caption: Schema.OptionFromNullOr(Schema.String),
  dimensions: Schema.OptionFromNullOr(Schema.Struct({
    width: Schema.Number,
    height: Schema.Number
  })),

  audit: Schema.Struct({
    uploadedBy: UserId,
    createdAt: Schema.Date,
    updatedAt: Schema.Date
  })
})

export type MediaItem = Schema.Schema.Type<typeof MediaItem>

/*
 * 3. Create DTO
 */
export const CreateMedia = Schema.Struct({
  originalFilename: Schema.String,
  storagePath: Schema.String,
  mimeType: Schema.String,
  size: Schema.Number,
  altText: Schema.OptionFromNullOr(Schema.String),
  width: Schema.optional(Schema.Number),
  height: Schema.optional(Schema.Number)
})
export type CreateMedia = Schema.Schema.Type<typeof CreateMedia>
