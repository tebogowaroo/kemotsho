import { Schema } from "effect"

export const CommerceRole = Schema.Literal(
  // Staff
  "commerce:manager",     // Commercial Owner
  "commerce:inventory",   // Stock Controller
  "commerce:fulfillment", // Warehouse / Shipping
  "commerce:support",     // Customer Service

  // End User
  "commerce:customer"     // Shopper
)

export type CommerceRole = Schema.Schema.Type<typeof CommerceRole>
