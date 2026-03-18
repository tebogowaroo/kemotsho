
import { Schema } from "effect"
import { Context, Effect } from "effect"

export const CouponId = Schema.String.pipe(Schema.brand("CouponId"))
export type CouponId = Schema.Schema.Type<typeof CouponId>

export const DiscountType = Schema.Literal("percentage", "fixed_amount")

export const Coupon = Schema.Struct({
    id: CouponId,
    code: Schema.String, // Normalized to uppercase usually
    description: Schema.OptionFromNullOr(Schema.String),
    discountType: DiscountType,
    value: Schema.Number, // Percentage (15 = 15%) or Amount (10000 = R100)
    minSpend: Schema.OptionFromNullOr(Schema.Number), // Cents
    expiresAt: Schema.OptionFromNullOr(Schema.Date),
    usageLimit: Schema.OptionFromNullOr(Schema.Number),
    usageCount: Schema.Number,
    isActive: Schema.Boolean
})

export type Coupon = Schema.Schema.Type<typeof Coupon>

// --- Errors ---
export class CouponNotFound extends Schema.TaggedError<CouponNotFound>()("CouponNotFound", {
    message: Schema.String
}) {}

export class CouponInvalid extends Schema.TaggedError<CouponInvalid>()("CouponInvalid", {
    message: Schema.String // e.g. "Expired", "Min spend not met"
}) {}

export class CouponError extends Schema.TaggedError<CouponError>()("CouponError", {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown)
}) {}

// --- Repository ---
export interface CouponRepository {
    getByCode: (code: string) => Effect.Effect<Coupon, CouponNotFound | CouponError>
    incrementUsage: (id: string) => Effect.Effect<void, CouponError>
    list: () => Effect.Effect<Coupon[], CouponError>
    create: (coupon: Omit<Coupon, "id" | "usageCount">) => Effect.Effect<Coupon, CouponError>
    toggleStatus: (id: string, isActive: boolean) => Effect.Effect<void, CouponError>
    delete: (id: string) => Effect.Effect<void, CouponError>
}

export const CouponRepository = Context.GenericTag<CouponRepository>("@modules/marketing/CouponRepository")
