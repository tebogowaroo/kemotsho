import { Effect, Layer } from "effect"
import { PaymentGateway, CreatePaymentSessionParams, PaymentGatewayService } from "../domain/PaymentGateway"
import { makeStripeGateway } from "./stripe/StripeGateway"
import { createPayFastGateway, PayFastConfig } from "./payfast/PayFastGateway"
import { Context } from "effect"

interface SmartPaymentConfig {
    readonly stripe: { apiKey: string, webhookSecret: string }
    readonly payFast: PayFastConfig
}

export const makeSmartPaymentGateway = (config: SmartPaymentConfig): PaymentGatewayService => {
    // Create instances using configs
    const stripe = makeStripeGateway(config.stripe)
    const payfast = createPayFastGateway(config.payFast)

    // Helper to select gateway based on currency
    const getGateway = (currency: string): PaymentGatewayService => {
        // ZAR goes to PayFast, everything else to Stripe
        if (currency && currency.toUpperCase() === "ZAR") {
            return payfast
        }
        return stripe
    }

    // Return Service implementation directly (using .of to satisfy Tag types)
    return PaymentGateway.of({
            createSession: (params: CreatePaymentSessionParams) => 
                Effect.suspend(() => {
                    const gateway = getGateway(params.currency)
                    return gateway.createSession(params)
                }),

            verifyWebhook: (headers: Headers, rawBody: unknown) => 
                Effect.suspend(() => {
                    // Try to detect gateway from headers
                    // Stripe usually sends 'stripe-signature'
                    const signature = headers.get("stripe-signature")
                    
                    if (signature) {
                         return stripe.verifyWebhook(headers, rawBody)
                    } else {
                         return payfast.verifyWebhook(headers, rawBody)
                    }
                })
        })
}

export const SmartPaymentGatewayLive = (config: SmartPaymentConfig) => 
    Layer.succeed(PaymentGateway, makeSmartPaymentGateway(config))
