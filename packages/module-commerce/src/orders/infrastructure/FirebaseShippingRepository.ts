
import { Effect, Layer, Option } from "effect"
import { db } from "@kemotsho/core/infra/firebase/admin"
import { ShippingSettingsRepository, ShippingRule, DEFAULT_SHIPPING_RULE, ShippingSettingsError } from "@kemotsho/module-commerce/orders/domain/ShippingRule"

const DOC_REF = db.collection("settings").doc("shipping")

export const FirebaseShippingRepositoryLive = Layer.succeed(
    ShippingSettingsRepository,
    ShippingSettingsRepository.of({
        getRule: () =>
            Effect.tryPromise({
                try: async () => {
                    const doc = await DOC_REF.get()
                    if (!doc.exists) {
                        return DEFAULT_SHIPPING_RULE
                    }
                    // Basic validation/casting could happen here, or let schema valid later if needed.
                    // For now, trust the write structure or fallback
                    const data = doc.data() as any
                    return {
                        id: data.id || DEFAULT_SHIPPING_RULE.id,
                        name: data.name || DEFAULT_SHIPPING_RULE.name,
                        type: data.type || DEFAULT_SHIPPING_RULE.type,
                        baseCost: typeof data.baseCost === "number" ? data.baseCost : DEFAULT_SHIPPING_RULE.baseCost,
                        freeThreshold: typeof data.freeThreshold === "number" ? Option.some(data.freeThreshold) : Option.none()
                    }
                },
                catch: (error) => new ShippingSettingsError({ message: "Failed to fetch shipping settings", cause: error })
            }),

        saveRule: (rule) =>
            Effect.tryPromise({
                try: async () => {
                   
                    await DOC_REF.set({
                        id: rule.id,
                        name: rule.name,
                        type: rule.type,
                        baseCost: rule.baseCost,
                        freeThreshold: Option.getOrNull(rule.freeThreshold) // Firestore handles null
                    })
                },
                catch: (error) => new ShippingSettingsError({ message: "Failed to save shipping settings", cause: error })
            })
    })
)
