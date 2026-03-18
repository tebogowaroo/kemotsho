
import { Context, Effect, Data } from "effect"
import { Schema } from "effect"

// --- Domain Errors ---
export class PaymentError extends Data.TaggedError("PaymentError")<{
  message: string
  cause?: unknown
}> {}

export class WebhookVerificationError extends Data.TaggedError("WebhookVerificationError")<{
  message: string
}> {}

// --- Domain Types ---

// 1. Abstraction for "How to start payment"
export type PaymentInitialization = 
  | { readonly kind: "redirect"; readonly url: string }
  | { readonly kind: "form-post"; readonly url: string; readonly data: Record<string, string> }

// 2. Abstraction for "What happened"
export type PaymentStatus = "paid" | "failed" | "cancelled" | "pending"

export interface PaymentEvent {
  readonly transactionId: string
  readonly orderId: string
  readonly status: PaymentStatus
  readonly providerRawData: unknown // For audit logs
}

// 3. Input for creating a session
export interface CreatePaymentSessionParams {
  readonly orderId: string
  readonly amount: number // In cents/smallest unit
  readonly currency: string
  readonly email: string
  readonly description: string
  readonly returnUrl: string
  readonly cancelUrl: string
  readonly notifyUrl: string // Webhook URL
  readonly nameFirst?: string
  readonly nameLast?: string
  readonly items?: Array<{
    name: string
    quantity: number
    price: number // cents
  }>
}

// --- The Service Definition ---
export class PaymentGateway extends Context.Tag("payments/PaymentGateway")<
  PaymentGateway,
  {
    /**
     * Creates a payment session/intent with the provider.
     * Returns instructions on how to redirect the user.
     */
    readonly createSession: (
      params: CreatePaymentSessionParams
    ) => Effect.Effect<PaymentInitialization, PaymentError>

    /**
     * Verifies that an incoming webhook request is authentic and parses it.
     * Accepts a standard Request object or specific headers/body.
     */
    readonly verifyWebhook: (
      headers: Headers,
      body: unknown
    ) => Effect.Effect<PaymentEvent, WebhookVerificationError>
  }
>() {}

export type PaymentGatewayService = Context.Tag.Service<PaymentGateway>
