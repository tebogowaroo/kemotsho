"use server"

import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { getSignedUploadUrl, UploadRequest } from "@kemotsho/platform-cms/media/application/GetSignedUploadUrl"
import { listMedia } from "@kemotsho/platform-cms/media/application/ListMedia"
import { createMedia } from "@kemotsho/platform-cms/media/application/CreateMedia"
import { CreateMedia, MediaItem } from "@kemotsho/platform-cms/media/domain/Media"
import { Schema } from "effect"
import { Effect, Exit, Cause } from "effect"
import { getCurrentUser } from "@kemotsho/core/lib/auth"

export async function getUploadUrlAction(input: unknown) {
  const program = Effect.gen(function* (_) {
    yield* _(getCurrentUser) // Ensure Auth
    const payload = yield* _(Schema.decodeUnknown(UploadRequest)(input))
    return yield* _(getSignedUploadUrl(payload))
  })

  const result = await AppRuntime.runPromiseExit(program)
// ... same error handling


  if (Exit.isSuccess(result)) {
    return { success: true, data: result.value }
  } else {
     const failure = Cause.failureOption(result.cause)
    if (failure._tag === "Some") {
        return { success: false, error: "System Error", details: failure.value }
    }
    return { success: false, error: "Unexpected Error" }
  }
}

import { getPublicUrl } from "@kemotsho/platform-cms/media/application/GetPublicUrl"

export async function getPublicUrlAction(storagePath: string) {
    const program = getPublicUrl(storagePath)
    const result = await AppRuntime.runPromiseExit(program)

    if (Exit.isSuccess(result)) {
        return { success: true, url: result.value }
    }
    
    return { success: false, error: "Failed to get URL" }
}

export async function createMediaAction(input: unknown) {
    const program = Effect.gen(function* (_) {
      const user = yield* _(getCurrentUser)
      const payload = yield* _(Schema.decodeUnknown(CreateMedia)(input))
      // Inject user ID
      const useCaseInput = { ...payload, uploaderId: user.uid as any }
      
      const item = yield* _(createMedia(useCaseInput))
      // Encode back to JSON safe
      return yield* _(Schema.encode(MediaItem)(item))
    })
  
    const result = await AppRuntime.runPromiseExit(program)
  
    if (Exit.isSuccess(result)) {
      return { success: true, data: result.value }
    } else {
        const failure = Cause.failureOption(result.cause)
        if (failure._tag === "Some") {
             const errorValue = failure.value as any
             let serializedError = errorValue
             // Handle wrapping errors
             if (errorValue && typeof errorValue === 'object' && errorValue.error instanceof Error) {
                 serializedError = {
                     ...errorValue,
                     error: {
                         message: errorValue.error.message,
                         stack: errorValue.error.stack,
                         name: errorValue.error.name
                     }
                 }
             }

            return { success: false, error: "Failed to register media", details: JSON.parse(JSON.stringify(serializedError)) }
        }
        
        console.error("Create Media Action Died:", Cause.pretty(result.cause))
        return { success: false, error: "Unexpected Error", details: Cause.pretty(result.cause) }
    }
}

export async function listMediaAction() {
    const program = Effect.gen(function* (_) {
        yield* _(getCurrentUser)
        const items = yield* _(listMedia())
        return yield* _(Schema.encode(Schema.Array(MediaItem))(items))
    })

    const result = await AppRuntime.runPromiseExit(program)
    
    if (Exit.isSuccess(result)) {
        return { success: true, data: result.value }
    } else {
        const failure = Cause.failureOption(result.cause)
        if (failure._tag === "Some") {
            return { success: false, error: "Failed to list media", details: failure.value }
        }
        return { success: false, error: "Unexpected Error" }
    }
}
