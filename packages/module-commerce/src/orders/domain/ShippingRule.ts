
import { Schema } from "effect"
import { Effect, Option } from "effect"

// --- Schema ---
export const ShippingType = Schema.Literal("flat_rate", "tiered_price", "tiered_weight")

export const ShippingRule = Schema.Struct({
    id: Schema.String,
    name: Schema.String, // e.g. "Standard Delivery"
    type: ShippingType,
    baseCost: Schema.Number, // e.g. 10000 (cents)
    freeThreshold: Schema.OptionFromNullOr(Schema.Number), // e.g. 100000 (cents). If subtotal >= this, cost is 0.
})

export type ShippingRule = Schema.Schema.Type<typeof ShippingRule>

// --- Configuration ---
// In a real app, this might come from the database (admin configured). 
// For now, we export a default configuration.
export const DEFAULT_SHIPPING_RULE: ShippingRule = {
    id: "default_standard",
    name: "Standard Delivery",
    type: "flat_rate",
    baseCost: 10000, // R100 in cents
    freeThreshold: Option.some(100000) // Free over R1000 in cents
}

// --- Repository ---
import { Context, Layer } from "effect"

export class ShippingSettingsError extends Schema.TaggedError<ShippingSettingsError>()("ShippingSettingsError", {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown)
}) {}

export interface ShippingSettingsRepository {
    getRule: () => Effect.Effect<ShippingRule, ShippingSettingsError>
    saveRule: (rule: ShippingRule) => Effect.Effect<void, ShippingSettingsError>
}

export const ShippingSettingsRepository = Context.GenericTag<ShippingSettingsRepository>("@modules/orders/ShippingSettingsRepository")

export const calculateShipping = (subtotal: number, rule: ShippingRule): number => {
    // 1. Check Threshold
    if (Option.isSome(rule.freeThreshold) && subtotal >= rule.freeThreshold.value) {
        return 0
    }

    // 2. Base Cost
    return rule.baseCost
}
