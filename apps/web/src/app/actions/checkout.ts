"use server"

import { Effect, Layer, Option } from "effect"
import { Schema } from "effect"
import { OrderWorkflowLive, OrderWorkflow } from "@kemotsho/module-commerce/orders/application/OrderWorkflow"
import { FirebaseOrderRepositoryLive } from "@kemotsho/module-commerce/orders/infrastructure/FirebaseOrderRepository"
import { FirebaseCustomerRepositoryLive } from "@kemotsho/module-commerce/customers/infrastructure/FirebaseCustomerRepository"
import { FirebaseProductRepositoryLive } from "@kemotsho/module-commerce/products/infrastructure/FirebaseProductRepository"
import { FirebaseCouponRepositoryLive } from "@kemotsho/module-commerce/marketing/infrastructure/FirebaseCouponRepository"
import { FirebaseShippingRepositoryLive } from "@kemotsho/module-commerce/orders/infrastructure/FirebaseShippingRepository"
import { PricingService, PricingServiceLive } from "@kemotsho/module-commerce/orders/domain/PricingService"
import { SmartPaymentGatewayLive } from "@kemotsho/module-commerce/payments/infra/SmartPaymentGateway"
import { Address, OrderLineItem, PaymentMethod } from "@kemotsho/module-commerce/orders/domain/Order"

// --- Config ---
const PaymentLayerLive = SmartPaymentGatewayLive({
    payFast: {
        merchantId: process.env.PAYFAST_MERCHANT_ID || "",
        merchantKey: process.env.PAYFAST_MERCHANT_KEY || "",
        passPhrase: process.env.PAYFAST_PASSPHRASE || "",
        env: (process.env.PAYFAST_ENV as "sandbox" | "production") || "sandbox"
    },
    stripe: {
        apiKey: process.env.STRIPE_SECRET_KEY || "",
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ""
    }
})

const ServicesLive = Layer.mergeAll(
    OrderWorkflowLive,
    PricingServiceLive
)

const RepositoriesLive = Layer.mergeAll(
    FirebaseOrderRepositoryLive,
    FirebaseCustomerRepositoryLive,
    FirebaseProductRepositoryLive,
    FirebaseCouponRepositoryLive,
    FirebaseShippingRepositoryLive,
    PaymentLayerLive
)

const OrderSystemLive = ServicesLive.pipe(
    Layer.provide(RepositoriesLive)
)

const CalculateSchema = Schema.Struct({
    items: Schema.Array(Schema.Struct({
        productId: Schema.String,
        quantity: Schema.Number,
        variantId: Schema.optional(Schema.String),
    })),
    couponCode: Schema.optional(Schema.String)
})

export async function calculateCartAction(input: Schema.Schema.Encoded<typeof CalculateSchema>) {
    const program = Effect.gen(function* (_) {
        const pricing = yield* _(PricingService)
        const params = yield* _(Schema.decodeUnknown(CalculateSchema)(input))

        const validItems = params.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            variantId: item.variantId ? Option.some(item.variantId) : Option.none(),
            variantName: Option.none()
        }))

        yield* _(Effect.log(`Calculating cart with coupon: ${params.couponCode}`))
        const result = yield* _(pricing.calculateOrderCoordinates(validItems, params.couponCode || null))

        // Serialize Effect Options to JSON-safe nulls for Client Component
        const safeLineItems = result.lineItems.map((item: any) => ({
            ...item,
            sku: Option.isOption(item.sku) ? Option.getOrNull(item.sku) : item.sku,
            variantId: Option.isOption(item.variantId) ? Option.getOrNull(item.variantId) : item.variantId,
            variantName: Option.isOption(item.variantName) ? Option.getOrNull(item.variantName) : item.variantName,
            image: Option.isOption(item.image) ? Option.getOrNull(item.image) : item.image,
            options: Option.isOption(item.options) ? Option.getOrNull(item.options) : item.options,
        }))

        return {
            ...result,
            lineItems: safeLineItems
        }
    }).pipe(
        Effect.map(data => ({ success: true as const, data })),
        Effect.catchAll((error: any) => Effect.succeed({ 
            success: false as const, 
            error: error.message || "Calculation failed" 
        }))
    )

    // Only provide PricingService Dependencies for this lighter action
    const RepositoriesLive = Layer.mergeAll(
        FirebaseProductRepositoryLive,
        FirebaseCouponRepositoryLive,
        FirebaseShippingRepositoryLive
    )

    const PricingSystemLive = PricingServiceLive.pipe(
        Layer.provide(RepositoriesLive)
    )

    return Effect.runPromise(
        Effect.provide(program, PricingSystemLive)
    )
}

// Schema for Input Validation & Transformation (JSON nulls -> Effect Options)
const PlaceOrderSchema = Schema.Struct({
    userId: Schema.Union(Schema.String, Schema.Null),
    items: Schema.Array(OrderLineItem),
    shippingAddress: Address,
    billingAddress: Schema.optional(Address),
    paymentMethod: PaymentMethod,
    currency: Schema.String,
    subtotal: Schema.Number,
    shippingCost: Schema.Number,
    tax: Schema.Number,
    total: Schema.Number,
    contactEmail: Schema.String,
    couponCode: Schema.optional(Schema.String)
})

export type PlaceOrderInput = Schema.Schema.Encoded<typeof PlaceOrderSchema>

export async function placeOrderAction(input: PlaceOrderInput) {
    const program = Effect.gen(function* (_) {
        const workflow = yield* _(OrderWorkflow)
        const pricing = yield* _(PricingService)
        
        const dirtyParams = yield* _(Schema.decodeUnknown(PlaceOrderSchema)(input))

        // Re-calculate inputs (Security Step)
        const itemInputs = dirtyParams.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            variantId: item.variantId,
            variantName: item.variantName // Already Options
        }))

        const calculated = yield* _(pricing.calculateOrderCoordinates(itemInputs, input.couponCode || null))

        const cleanParams = {
            ...dirtyParams,
            billingAddress: dirtyParams.billingAddress || dirtyParams.shippingAddress,
            items: calculated.lineItems,
            subtotal: calculated.subtotal,
            discount: calculated.discount,
            couponCode: calculated.couponApplied ? (input.couponCode ?? null) : null,
            shippingCost: calculated.shipping,
            tax: calculated.tax,
            total: calculated.total
        }

        return yield* _(workflow.placeOrder(cleanParams))
    }).pipe(
        Effect.map(data => ({ success: true as const, data })),
        Effect.catchAll(error => Effect.succeed({ 
            success: false as const, 
            error: error instanceof Error ? error.message : "Unknown error",
            details: String(error)
        }))
    )

    return Effect.runPromise(
        Effect.provide(program, OrderSystemLive)
    )
}
