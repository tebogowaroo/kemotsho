
import { Schema } from "effect"
import { makeId } from "@kemotsho/core/domain/ids"
import { Address } from "@kemotsho/module-commerce/orders/domain/Address"
import { UserId } from "@kemotsho/platform-cms/identity/domain/User"
import { Effect, Context } from "effect"

// --- IDs ---
export const CustomerId = makeId("CustomerId")
export type CustomerId = Schema.Schema.Type<typeof CustomerId>

// --- Entity ---
export const Customer = Schema.Struct({
    id: CustomerId,
    // Link to Identity System (Optional for Guest)
    userId: Schema.OptionFromNullOr(UserId),
    
    // Core Profile
    email: Schema.String,
    firstName: Schema.String,
    lastName: Schema.String,
    phone: Schema.OptionFromNullOr(Schema.String),
    
    // Address Book
    addresses: Schema.Array(Address),
    defaultShippingAddress: Schema.OptionFromNullOr(Address),
    defaultBillingAddress: Schema.OptionFromNullOr(Address),

    // Metadata
    createdAt: Schema.Date,
    updatedAt: Schema.Date
})
export type Customer = Schema.Schema.Type<typeof Customer>

// --- Errors ---
export class CustomerNotFound extends Schema.TaggedError<CustomerNotFound>()("CustomerNotFound", {
    message: Schema.String
}) {}

export class CustomerError extends Schema.TaggedError<CustomerError>()("CustomerError", {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown)
}) {}

// --- Repository Interface ---
export interface CustomerRepository {
    readonly getById: (id: string) => Effect.Effect<Customer, CustomerNotFound | CustomerError>
    readonly getByUserId: (userId: string) => Effect.Effect<Customer, CustomerNotFound | CustomerError>
    readonly getByEmail: (email: string) => Effect.Effect<Customer, CustomerNotFound | CustomerError>
    readonly create: (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => Effect.Effect<Customer, CustomerError>
    readonly update: (id: string, customer: Partial<Customer>) => Effect.Effect<Customer, CustomerNotFound | CustomerError>
}

export const CustomerRepository = Context.GenericTag<CustomerRepository>("@modules/customers/CustomerRepository")
