
import { Effect, Layer } from "effect"
import { OrderWorkflowLive, OrderWorkflow } from "@kemotsho/module-commerce/orders/application/OrderWorkflow"
import { FirebaseOrderRepositoryLive } from "@kemotsho/module-commerce/orders/infrastructure/FirebaseOrderRepository"
import { FirebaseCustomerRepositoryLive } from "@kemotsho/module-commerce/customers/infrastructure/FirebaseCustomerRepository"
import { PayFastGatewayLive } from "@kemotsho/module-commerce/payments/infra/payfast/PayFastGateway"
import { FirebaseProductRepositoryLive } from "@kemotsho/module-commerce/products/infrastructure/FirebaseProductRepository"
import { FirebaseCouponRepositoryLive } from "@kemotsho/module-commerce/marketing/infrastructure/FirebaseCouponRepository"
import { NextRequest, NextResponse } from "next/server"

// Same Config as Actions
const PayFastConfigLive = PayFastGatewayLive({
    merchantId: process.env.PAYFAST_MERCHANT_ID || "",
    merchantKey: process.env.PAYFAST_MERCHANT_KEY || "",
    passPhrase: process.env.PAYFAST_PASSPHRASE || "",
    env: (process.env.PAYFAST_ENV as "sandbox" | "production") || "sandbox"
})

const OrderSystemLive = OrderWorkflowLive.pipe(
    Layer.provide(FirebaseOrderRepositoryLive),
    Layer.provide(FirebaseCustomerRepositoryLive),
    Layer.provide(PayFastConfigLive),
    Layer.provide(FirebaseProductRepositoryLive), // Add missing ProductRepo
    Layer.provide(FirebaseCouponRepositoryLive)   // Add missing CouponRepo
)

export async function POST(req: NextRequest) {
    // 1. Parse Body (FormData or JSON depending on PayFast)
    // PayFast usually sends x-www-form-urlencoded
    const formData = await req.formData()
    const body: Record<string, string> = {}
    formData.forEach((value, key) => {
        body[key] = value.toString()
    })

    console.log("PayFast IPN received:", body.pf_payment_id)

    // 2. Run Workflow
    const program = Effect.gen(function* (_) {
        const workflow = yield* _(OrderWorkflow)
        
        // Pass validation logic headers if needed (e.g. valid IP check)
        const headers = req.headers

        return yield* _(workflow.confirmPayment(headers, body))
    })

    const result = await Effect.runPromiseExit(
        Effect.provide(program, OrderSystemLive)
    )

    if (result._tag === "Failure") {
        console.error("PayFast Webhook Failed:", result.cause)
        // Even if we fail processing, if signature was valid but order failed, 
        // we might still want to return 200 to stop PayFast from retrying if it's a permanent logical error.
        // But for now, 500 triggers retry.
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
