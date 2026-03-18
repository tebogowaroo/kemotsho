import { Schema } from "effect"

export const Address = Schema.Struct({
    id: Schema.optional(Schema.String),
    firstName: Schema.String,
    lastName: Schema.String,
    company: Schema.OptionFromNullOr(Schema.String),
    line1: Schema.String,
    line2: Schema.OptionFromNullOr(Schema.String),
    city: Schema.String,
    state: Schema.OptionFromNullOr(Schema.String), // Province
    postalCode: Schema.String,
    country: Schema.String, // ISO code (ZA)
    phone: Schema.String,
    email: Schema.String
})

export type Address = Schema.Schema.Type<typeof Address>
