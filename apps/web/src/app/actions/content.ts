"use server"

import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { createContent, CreateContentRef } from "@kemotsho/platform-cms/content/application/CreateContent"
import { updateContent, UpdateContentRef } from "@kemotsho/platform-cms/content/application/UpdateContent"
import { listContent } from "@kemotsho/platform-cms/content/application/ListContent"
import { getContent } from "@kemotsho/platform-cms/content/application/GetContent"
import { ContentId, ContentItem } from "@kemotsho/platform-cms/content/domain/Content"
import { Schema } from "effect"
import { Effect, Exit, Cause } from "effect"
import { getCurrentUser } from "@kemotsho/core/lib/auth"

export async function createContentAction(input: unknown) {
  const program = Effect.gen(function* (_) {
    // 1. Verify Auth
    const user = yield* _(getCurrentUser)

    // Inject Author ID securely (server side)
    const inputWithAuthor = { ...(input as object), authorId: user.uid }

    // 2. Decode & Validate Input
    const payload = yield* _(Schema.decodeUnknown(CreateContentRef)(inputWithAuthor))
    
    // 3. Run Use Case
    const item = yield* _(createContent(payload))
    
    // 4. Encode to JSON (Plain Object) to cross Server/Client boundary
    // This strips Effect classes (Option, etc.) and dates into strings/ISO
    const encoded = yield* _(Schema.encode(ContentItem)(item))
    return JSON.parse(JSON.stringify(encoded))
  })

  // 5. Run safely
  const result = await AppRuntime.runPromiseExit(program)

  if (Exit.isSuccess(result)) {
    return { success: true, data: result.value }
  } else {
    // Basic error handling serialization
    const failure = Cause.failureOption(result.cause)
    if (failure._tag === "Some") {
        return { success: false, error: "Validation or System Error", details: JSON.parse(JSON.stringify(failure.value)) }
    }
    return { success: false, error: "Unexpected Error" }
  }
}

export async function listContentAction() {
    const program = Effect.gen(function* (_) {
        yield* _(getCurrentUser)
        const items = yield* _(listContent({ limit: 50 }))
        // Encode to JSON-safe format (Date -> string, Option -> null)
        const encoded = yield* _(Schema.encode(Schema.Array(ContentItem))(items))
        return JSON.parse(JSON.stringify(encoded))
    })
    
    const result = await AppRuntime.runPromiseExit(program)
    
    if (Exit.isSuccess(result)) {
        return { success: true, data: result.value }
    } else {
        return { success: false, error: "Failed to load content" }
    }
}

export async function updateContentAction(input: unknown) {
  const program = Effect.gen(function* (_) {
    // 1. Verify Auth
    const user = yield* _(getCurrentUser)

    // Inject Updater ID securely
    const inputWithUpdater = { ...(input as object), updaterId: user.uid }

    const payload = yield* _(Schema.decodeUnknown(UpdateContentRef)(inputWithUpdater))
    const item = yield* _(updateContent(payload))
    // Fix: Encode response to JSON
    const encoded = yield* _(Schema.encode(ContentItem)(item))
    return JSON.parse(JSON.stringify(encoded))
  })

  const result = await AppRuntime.runPromiseExit(program)

  if (Exit.isSuccess(result)) {
    return { success: true, data: result.value }
  } else {
    // Basic error handling serialization
    const failure = Cause.failureOption(result.cause)
    if (failure._tag === "Some") {
        return { success: false, error: "Validation or System Error", details: JSON.parse(JSON.stringify(failure.value)) }
    }
    return { success: false, error: "Unexpected Error" }
  }
}

export async function getContentAction(id: string) {
    const program = Effect.gen(function* (_) {
         yield* _(getCurrentUser)
         const validId = yield* _(Schema.decodeUnknown(ContentId)(id))
         const item = yield* _(getContent(validId))
         
         const encoded = yield* _(Schema.encode(ContentItem)(item))
         return JSON.parse(JSON.stringify(encoded))
    })

    const result = await AppRuntime.runPromiseExit(program)
    
    if (Exit.isSuccess(result)) {
        return { success: true, data: result.value }
    } else {
        return { success: false, error: "Not Found" }
    }
}
