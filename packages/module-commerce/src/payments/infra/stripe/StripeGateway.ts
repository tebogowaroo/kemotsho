import { Effect, Layer } from "effect"
import Stripe from "stripe"
import { PaymentGateway, PaymentInitialization, CreatePaymentSessionParams, PaymentError, WebhookVerificationError, PaymentEvent, PaymentGatewayService } from "../../domain/PaymentGateway"

export const makeStripeGateway = (config: { apiKey: string, webhookSecret: string }): PaymentGatewayService => {
    const stripe = new Stripe(config.apiKey, { apiVersion: "2024-06-20" as any })

    return PaymentGateway.of({
        createSession: (params: CreatePaymentSessionParams) => Effect.tryPromise({
            try: async (): Promise<PaymentInitialization> => {
                const session = await stripe.checkout.sessions.create({
                    line_items: params.items?.map(item => ({
                        price_data: {
                            currency: params.currency.toLowerCase(),
                            product_data: { name: item.name },
                            unit_amount: item.price
                        },
                        quantity: item.quantity
                    })) || [{
                        price_data: {
                            currency: params.currency.toLowerCase(),
                            product_data: { name: params.description },
                            unit_amount: params.amount
                        },
                        quantity: 1
                    }],
                    mode: 'payment',
                    success_url: params.returnUrl + "?session_id={CHECKOUT_SESSION_ID}",
                    cancel_url: params.cancelUrl,
                    client_reference_id: params.orderId,
                    customer_email: params.email,
                })

                if (!session.url) throw new Error("Stripe session creation failed")
                return { kind: "redirect", url: session.url }
            },
            catch: (error) => new PaymentError({ message: "Stripe initialization failed", cause: error })
        }),

        verifyWebhook: (headers: Headers, rawBody: unknown) => Effect.tryPromise({
            try: async () => {
                const signature = headers.get("stripe-signature")
                if (!signature) throw new Error("Missing stripe-signature header")
                
                if (typeof rawBody !== "string") {
                    throw new Error("Invalid body. Expected string.")
                }

                const event = stripe.webhooks.constructEvent(rawBody, signature, config.webhookSecret)
                
                let status: "paid" | "failed" | "pending" | "cancelled" = "pending"
                let orderId = ""

                if (event.type === 'checkout.session.completed') {
                    const session = event.data.object as Stripe.Checkout.Session
                    status = "paid"
                    orderId = session.client_reference_id || ""
                } else if (event.type === 'payment_intent.payment_failed') {
                    status = "failed"
                }

                return {
                    transactionId: event.id,
                    orderId,
                    status,
                    providerRawData: event
                }
            },
            catch: (error) => new WebhookVerificationError({ message: "Invalid webhook signature" })
        })
    })
}

export const StripeGatewayLive = (config: { apiKey: string, webhookSecret: string }) => 
    Layer.succeed(PaymentGateway, makeStripeGateway(config))
