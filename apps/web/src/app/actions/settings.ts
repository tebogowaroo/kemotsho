
"use server"

import { Effect, Layer, Option } from "effect"
import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { FirebaseShippingRepositoryLive } from "@kemotsho/module-commerce/orders/infrastructure/FirebaseShippingRepository"
import { ShippingSettingsRepository, ShippingRule } from "@kemotsho/module-commerce/orders/domain/ShippingRule"
import { Schema } from "effect"

// -----------------------------------------------------------------------------
// Get Shipping Rule
// -----------------------------------------------------------------------------
export async function getShippingRuleAction() {
    const program = Effect.gen(function* (_) {
        const repo = yield* _(ShippingSettingsRepository)
        const rule = yield* _(repo.getRule())
        const encoded = yield* _(Schema.encode(ShippingRule)(rule))
        return encoded
    })

    const runnable = program.pipe(
        Effect.provide(FirebaseShippingRepositoryLive)
    )

    return AppRuntime.runPromiseExit(runnable).then(exit => {
        if (exit._tag === "Success") {
            // Manually ensure strict JSON compatibility if schema encoding leakage occurs
            return { success: true, data: JSON.parse(JSON.stringify(exit.value)) }
        } else {
            console.error("Failed to fetch shipping rule", exit.cause)
            return { success: false, error: "Failed to fetch settings" }
        }
    })
}

// -----------------------------------------------------------------------------
// Update Shipping Rule
// -----------------------------------------------------------------------------
const UpdateRuleSchema = Schema.Struct({
    baseCost: Schema.Number,
    freeThreshold: Schema.OptionFromNullOr(Schema.Number)
})

export async function updateShippingRuleAction(input: unknown) {
    const program = Effect.gen(function* (_) {
        const repo = yield* _(ShippingSettingsRepository)
        
        // Validate input
        const params = yield* _(Schema.decodeUnknown(UpdateRuleSchema)(input))

        // Get existing to preserve ID/Name/Type (since we edit cost only mostly)
        const existing = yield* _(repo.getRule())
        
        const updated: ShippingRule = {
            ...existing,
            baseCost: params.baseCost,
            freeThreshold: params.freeThreshold
        }

        yield* _(repo.saveRule(updated))
        return "Settings updated"
    })

    const runnable = program.pipe(
        Effect.provide(FirebaseShippingRepositoryLive)
    )

    return AppRuntime.runPromiseExit(runnable).then(exit => {
        if (exit._tag === "Success") {
            return { success: true }
        } else {
            console.error("Failed to update shipping rule", exit.cause)
            return { success: false, error: "Failed to update settings" }
        }
    })
}
