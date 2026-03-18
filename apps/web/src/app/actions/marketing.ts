
"use server"

import { Effect, Layer, Option } from "effect"
import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { FirebaseCouponRepositoryLive } from "@kemotsho/module-commerce/marketing/infrastructure/FirebaseCouponRepository"
import { CouponRepository, Coupon, CouponId } from "@kemotsho/module-commerce/marketing/domain/Coupon"
import { Schema } from "effect"

// -----------------------------------------------------------------------------
// Get Coupons
// -----------------------------------------------------------------------------
export async function getCouponsAction() {
    const program = Effect.gen(function* (_) {
        const repo = yield* _(CouponRepository)
        const coupons = yield* _(repo.list())
        // Return encoded (JSON-safe) data
        // Option -> null during encoding by default with OptionFromNullOr
        const encoded = yield* _(Schema.encode(Schema.Array(Coupon))(coupons))
        return encoded
    })

    const runnable = program.pipe(
        Effect.provide(FirebaseCouponRepositoryLive)
    )

    return AppRuntime.runPromiseExit(runnable).then(exit => {
        if (exit._tag === "Success") {
             // Ensure we are returning a plain array, even if empty.
            return { success: true, data: exit.value }
        } else {
            console.error("Failed to list coupons", exit.cause)
            return { success: false, error: "Failed to fetch coupons" }
        }
    })
}

// -----------------------------------------------------------------------------
// Create Coupon
// -----------------------------------------------------------------------------
const CreateCouponSchema = Schema.Struct({
    code: Schema.String,
    description: Schema.optional(Schema.String),
    discountType: Schema.Literal("percentage", "fixed_amount"),
    value: Schema.Number, // percentage or cents
    minSpend: Schema.optional(Schema.Number),
    usageLimit: Schema.optional(Schema.Number),
    expiresAt: Schema.optional(Schema.Unknown), 
})

export async function createCouponAction(input: unknown) {
     const program = Effect.gen(function* (_) {
        const repo = yield* _(CouponRepository)
        const params = yield* _(Schema.decodeUnknown(CreateCouponSchema)(input))
        
        let expiresAt: Date | undefined
        // Safe casting since we accept unknown
        if (params.expiresAt) {
            if (params.expiresAt instanceof Date) {
               expiresAt = params.expiresAt
            } else if (typeof params.expiresAt === "string") {
               expiresAt = new Date(params.expiresAt)
            }
        }

        // Convert input (optional fields) to Domain Options
        const domainCoupon = {
             code: params.code,
             description: params.description ? Option.some(params.description) : Option.none(),
             discountType: params.discountType,
             value: params.value,
             minSpend: params.minSpend ? Option.some(params.minSpend) : Option.none(),
             usageLimit: params.usageLimit ? Option.some(params.usageLimit) : Option.none(),
             expiresAt: expiresAt ? Option.some(expiresAt) : Option.none(),
             usageCount: 0,
             isActive: true
        }

        yield* _(repo.create(domainCoupon))
        return { success: true }
    })
    
    const runnable = program.pipe(
         Effect.provide(FirebaseCouponRepositoryLive)
    )

    return AppRuntime.runPromiseExit(runnable).then(exit => {
        if (exit._tag === "Success") {
            return { success: true }
        }
        console.error("Failed to create coupon", exit.cause)
        return { success: false, error: "Failed to create coupon" }
    })
}

// -----------------------------------------------------------------------------
// Toggle Status
// -----------------------------------------------------------------------------
export async function toggleCouponAction(id: string, isActive: boolean) {
    const program = Effect.gen(function* (_) {
        const repo = yield* _(CouponRepository)
        yield* _(repo.toggleStatus(id, isActive))
        return { success: true }
    })
    
    const runnable = program.pipe(Effect.provide(FirebaseCouponRepositoryLive))
    
    return AppRuntime.runPromiseExit(runnable).then(exit => {
         if (exit._tag === "Success") return { success: true }
         return { success: false, error: "Failed to update" }
    })
}

// -----------------------------------------------------------------------------
// Delete
// -----------------------------------------------------------------------------
export async function deleteCouponAction(id: string) {
    const program = Effect.gen(function* (_) {
        const repo = yield* _(CouponRepository)
        yield* _(repo.delete(id))
        return { success: true }
    })
    
    const runnable = program.pipe(Effect.provide(FirebaseCouponRepositoryLive))

    return AppRuntime.runPromiseExit(runnable).then(exit => {
         if (exit._tag === "Success") return { success: true }
         return { success: false, error: "Failed to delete" }
    })
}
