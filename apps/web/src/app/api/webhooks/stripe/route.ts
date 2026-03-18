import { Effect, Layer } from "effect"
import { OrderWorkflowLive, OrderWorkflow } from "@kemotsho/module-commerce/orders/application/OrderWorkflow"
import { FirebaseOrderRepositoryLive } from "@kemotsho/module-commerce/orders/infrastructure/FirebaseOrderRepository"
import { FirebaseCustomerRepositoryLive } from "@kemotsho/module-commerce/customers/infrastructure/FirebaseCustomerRepository"
import { StripeGatewayLive } from "@kemotsho/module-commerce/payments/infra/stripe/StripeGateway"
import { FirebaseProductRepositoryLive } from "@kemotsho/module-commerce/products/infrastructure/FirebaseProductRepository"
import { FirebaseCouponRepositoryLive } from "@kemotsho/module-commerce/marketing/infrastructure/FirebaseCouponRepository"
import { FirebaseShippingRepositoryLive } from "@kemotsho/module-commerce/orders/infrastructure/FirebaseShippingRepository"
import { NextRequest, NextResponse } from "next/server"

const StripeConfigLive = StripeGatewayLive({
    apiKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ""
})

const OrderSystemLive = OrderWorkflowLive.pipe(
    Layer.provide(FirebaseOrderRepositoryLive),
    Layer.provide(FirebaseCustomerRepositoryLive),
    Layer.provide(StripeConfigLive),
    Layer.provide(FirebaseProductRepositoryLive),
    Layer.provide(FirebaseCouponRepositoryLive),
    Layer.provide(FirebaseShippingRepositoryLive)
)

export async function POST(req: NextRequest) {
    const rawBody = await req.text()
    
    const program = Effect.gen(function* (_) {
        const workflow = yield* _(OrderWorkflow)
        
        // Headers object is compatible
        const headers = req.headers

        return yield* _(workflow.confirmPayment(headers, rawBody))
    })

    const result = await Effect.runPromiseExit(
        Effect.provide(program, OrderSystemLive)
    )

    if (result._tag === "Failure") {
        console.error("Stripe Webhook Failed:", result.cause)
        return NextResponse.json({ error: "Webhook Error" }, { status: 400 })
    }

    return NextResponse.json({ received: true })
}
