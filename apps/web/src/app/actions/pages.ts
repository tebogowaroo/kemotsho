"use server"

import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { createPage, CreatePageInput } from "@kemotsho/platform-cms/pages/application/CreatePage"
import { updatePage, UpdatePageInput } from "@kemotsho/platform-cms/pages/application/UpdatePage"
import { listPages } from "@kemotsho/platform-cms/pages/application/ListPages"
import { getPageById, getPageBySlug } from "@kemotsho/platform-cms/pages/application/GetPage"
import { Page, PageId } from "@kemotsho/platform-cms/pages/domain/Page"
import { Slug } from "@kemotsho/platform-cms/content/domain/Content"
import { Schema } from "effect"
import { Effect, Exit, Cause } from "effect"
import { getCurrentUser } from "@kemotsho/core/lib/auth"
import { revalidateTag } from "next/cache"

export async function listPagesAction() {
    const program = Effect.gen(function*(_) {
        yield* _(getCurrentUser)
        const pages = yield* _(listPages())
        const encoded = yield* _(Schema.encode(Schema.Array(Page))(pages))
        return JSON.parse(JSON.stringify(encoded))
    })

    const result = await AppRuntime.runPromiseExit(program)
    
    if (Exit.isSuccess(result)) {
        return { success: true, data: result.value }
    }
    return { success: false, error: "Failed to list pages" }
}

export async function createPageAction(input: unknown) {
    const program = Effect.gen(function*(_) {
        yield* _(getCurrentUser)
        const payload = yield* _(Schema.decodeUnknown(CreatePageInput)(input))
        const page = yield* _(createPage(payload))
        const encoded = yield* _(Schema.encode(Page)(page))
        return JSON.parse(JSON.stringify(encoded))
    })

    const result = await AppRuntime.runPromiseExit(program)

    if (Exit.isSuccess(result)) {
        (revalidateTag as any)('pages')
        return { success: true, data: result.value }
    } else {
        const failure = Cause.failureOption(result.cause)
        if (failure._tag === "Some") {
             const errorValue = failure.value as any
             let serializedError = errorValue
             if (errorValue && typeof errorValue === 'object' && errorValue.error instanceof Error) {
                 serializedError = {
                     ...errorValue,
                     error: {
                         message: errorValue.error.message
                     }
                 }
             }
            return { success: false, error: "Failed to create page", details: JSON.parse(JSON.stringify(serializedError)) }
        }
        return { success: false, error: "Unexpected Error" }
    }
}

export async function updatePageAction(input: unknown) {
    const program = Effect.gen(function*(_) {
        yield* _(getCurrentUser)
        const payload = yield* _(Schema.decodeUnknown(UpdatePageInput)(input))
        const page = yield* _(updatePage(payload))
        const encoded = yield* _(Schema.encode(Page)(page))
        return JSON.parse(JSON.stringify(encoded))
    })

    const result = await AppRuntime.runPromiseExit(program)

    if (Exit.isSuccess(result)) {
        (revalidateTag as any)('pages')
        return { success: true, data: result.value }
    } else {
        const failure = Cause.failureOption(result.cause)
         if (failure._tag === "Some") {
             const errorValue = failure.value as any
             let serializedError = errorValue
             if (errorValue && typeof errorValue === 'object' && errorValue.error instanceof Error) {
                 serializedError = {
                     ...errorValue,
                     error: {
                         message: errorValue.error.message
                     }
                 }
             }
            return { success: false, error: "Failed to update page", details: JSON.parse(JSON.stringify(serializedError)) }
        }
        return { success: false, error: "Unexpected Error" }
    }
}

export async function getPageAction(id: string) {
    const program = Effect.gen(function*(_) {
        yield* _(getCurrentUser)
        // Parse raw string into PageId
        const pageId = yield* _(Schema.decodeUnknown(PageId)(id))
        const page = yield* _(getPageById(pageId))
        const encoded = yield* _(Schema.encode(Page)(page))
        return JSON.parse(JSON.stringify(encoded))
    })
    
    const result = await AppRuntime.runPromiseExit(program)
    
     if (Exit.isSuccess(result)) {
        return { success: true, data: result.value }
    }

    if (Exit.isFailure(result)) {
        console.error(`getPageAction failed for id ${id}:`, JSON.stringify(result.cause, null, 2))
    }

    return { success: false, error: "Page not found" }
}
