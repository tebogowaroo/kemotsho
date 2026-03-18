
import { Schema } from "effect"
import { makeId } from "@kemotsho/core/domain/ids"
import { UserId } from "@kemotsho/platform-cms/identity/domain/User"
import { CustomerId } from "@kemotsho/module-commerce/customers/domain/Customer"
import { Address } from "./Address"

export { Address }

// --- IDs ---
export const OrderId = makeId("OrderId")
export type OrderId = Schema.Schema.Type<typeof OrderId>

// --- Enums ---
export const OrderStatus = Schema.Literal(
    "pending",  // initial state
    "processing", // paid
    "shipped", 
    "delivered", 
    "cancelled", 
    "refunded"
)
export type OrderStatus = Schema.Schema.Type<typeof OrderStatus>

// Updated to match our gateway implementation
export const PaymentMethod = Schema.Union(
    Schema.Literal("payfast"),
    Schema.Literal("stripe"),
    Schema.Literal("manual_eft")
)
export const PaymentMethodType = PaymentMethod

// --- Value Objects ---
export const OrderLineItem = Schema.Struct({
    productId: Schema.String,
    title: Schema.String,
    sku: Schema.OptionFromNullOr(Schema.String),
    variantId: Schema.OptionFromNullOr(Schema.String),
    variantName: Schema.OptionFromNullOr(Schema.String),
    quantity: Schema.Number,
    priceAtPurchase: Schema.Number, // in cents
    total: Schema.Number, // quantity * priceAtPurchase
    options: Schema.OptionFromNullOr(Schema.Record({ key: Schema.String, value: Schema.String })), // Selected variants
    image: Schema.OptionFromNullOr(Schema.String)
})
export type OrderLineItem = Schema.Schema.Type<typeof OrderLineItem>

// --- Entity ---
export const Order = Schema.Struct({
    id: OrderId,
    orderNumber: Schema.String, // User friendly short ID (e.g. #1005)
    
    // Identity Link
    customerId: CustomerId, 
    userId: Schema.OptionFromNullOr(UserId), // Optional secondary link
    customerEmail: Schema.String, // Snapshot for easy search
    
    items: Schema.Array(OrderLineItem),
    
    // Financials
    currency: Schema.String, // default "USD" or "ZAR"
    subtotal: Schema.Number,
    discount: Schema.Number.pipe(Schema.propertySignature, Schema.withConstructorDefault(() => 0)), 
    couponCode: Schema.OptionFromNullOr(Schema.String),
    shippingCost: Schema.Number,
    tax: Schema.Number,
    total: Schema.Number, // The final amount to charge

    // Details
    shippingAddress: Address,
    billingAddress: Schema.OptionFromNullOr(Address), // If different
    
    // Status
    status: OrderStatus,
    paymentMethod: PaymentMethod,
    paymentGatewayRef: Schema.OptionFromNullOr(Schema.String), // PayFast ID
    
    // Fulfillment
    fulfillment: Schema.OptionFromNullOr(
        Schema.Struct({
            courier: Schema.String,
            trackingCode: Schema.String,
            shippedAt: Schema.Date
        })
    ),

    // Timestamps
    createdAt: Schema.Date,
    updatedAt: Schema.Date
})
export type Order = Schema.Schema.Type<typeof Order>

// --- Errors ---
export class OrderNotFound extends Schema.TaggedError<OrderNotFound>()("OrderNotFound", {
    message: Schema.String
}) {}

export class OrderError extends Schema.TaggedError<OrderError>()("OrderError", {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown)
}) {}

export class InvalidOrderState extends Schema.TaggedError<InvalidOrderState>()("InvalidOrderState", {
    message: Schema.String
}) {}
