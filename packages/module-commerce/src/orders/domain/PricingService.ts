
import { Context, Effect, Layer, Option } from "effect"
import { ProductRepository, Product, ProductError, ProductNotFound } from "@kemotsho/module-commerce/products/domain/Product"
import { CouponRepository, Coupon, CouponNotFound, CouponError, CouponInvalid } from "@kemotsho/module-commerce/marketing/domain/Coupon"
import { OrderLineItem } from "./Order"
import { getTenantConfig } from "@kemotsho/core/config/tenant"
import { Schema } from "effect"
import { calculateShipping, ShippingSettingsRepository, ShippingSettingsError } from "./ShippingRule"
// import { CartItemInput } from "./PricingService" <--- REMOVED

export interface CartItemInput {
    productId: string
    quantity: number
    variantId: Option.Option<string>
    variantName: Option.Option<string>
}

export class PricingService extends Context.Tag("PricingService")<
    PricingService,
    {
        calculateOrderCoordinates: (items: CartItemInput[], couponCode?: string | null) => 
            Effect.Effect<{
                lineItems: typeof OrderLineItem.Type[]
                subtotal: number
                shipping: number
                discount: number
                tax: number
                total: number
                couponApplied: boolean
            }, ProductError | ProductNotFound | CouponError | CouponInvalid | ShippingSettingsError | Error>
    }
>() {}

export const PricingServiceLive = Layer.effect(
    PricingService,
    Effect.gen(function* (_) {
        const productRepo = yield* _(ProductRepository)
        const couponRepo = yield* _(CouponRepository)
        const shippingRepo = yield* _(ShippingSettingsRepository)

        const calculateItem = (item: CartItemInput) => 
            Effect.gen(function* ($) {
                const product = yield* $(productRepo.getById(item.productId))
                
                // Determine Base Price
                let finalPrice = Number(Option.getOrElse(product.price, () => 0)) || 0
                let finalSku = product.sku
                const quantity = Number(item.quantity) || 0
                
                // Handle Variant Overrides
                if (Option.isSome(item.variantId)) {
                    const vid = item.variantId.value
                    if (product.variantOverrides && product.variantOverrides.length > 0) {
                         const match = product.variantOverrides.find(v => v.id === vid)
                         if (match) {
                             if (Option.isSome(match.price)) {
                                 finalPrice = match.price.value
                             }
                             if (Option.isSome(match.sku)) {
                                 finalSku = match.sku
                             }
                         }
                    }
                }

                const lineTotal = finalPrice * quantity

                const lineItem: any = {
                    productId: product.id,
                    title: product.title,
                    sku: finalSku,
                    variantId: item.variantId,
                    variantName: item.variantName,
                    priceAtPurchase: finalPrice,
                    quantity: quantity,
                    total: lineTotal,
                    image: Option.none(),
                    options: Option.none()
                }

                return lineItem as typeof OrderLineItem.Type
            })

        return {
            calculateOrderCoordinates: (items, couponCode) => Effect.gen(function* ($) {
                // 1. Process all items
                const processedItems = yield* $(Effect.all(items.map(calculateItem), { concurrency: "unbounded" }))

                yield* $(Effect.log(`processedItems${processedItems[0]?.total} items`))

                // 2. Sum Subtotal
                const subtotal = processedItems.reduce((acc, item) => acc + item.total, 0)
                yield* $(Effect.log(`Calculated subtotal: ${subtotal}`))
                
                // 3. Process Coupon
                let discount = 0
                let couponApplied = false

                if (couponCode) {
                    const coupon = yield* $(couponRepo.getByCode(couponCode))
                    
                    // Validate Logic
                    const now = new Date()
                    if (Option.isSome(coupon.expiresAt) && coupon.expiresAt.value < now) {
                         return yield* $(Effect.fail(new CouponInvalid({ message: "Coupon expired" })))
                    }
                    if (Option.isSome(coupon.usageLimit) && coupon.usageCount >= coupon.usageLimit.value) {
                         return yield* $(Effect.fail(new CouponInvalid({ message: "Coupon usage limit reached" })))
                    }
                    
                    // Convert minSpend to Rands for friendly error message
                    if (Option.isSome(coupon.minSpend) && subtotal < coupon.minSpend.value) {
                         return yield* $(Effect.fail(new CouponInvalid({ message: `Minimum spend of R ${(coupon.minSpend.value/100).toFixed(2)} required` })))
                    }

                    // Apply
                    if (coupon.discountType === "fixed_amount") {
                        discount = coupon.value 
                        yield* $(Effect.log(`Coupon value: ${coupon.value}`))// Cap at subtotal
                        if (discount > subtotal) discount = subtotal
                        yield* $(Effect.log(`Coupon discount after cap: ${discount}`))
                    } else { // percentage
                        discount = Math.round(subtotal * (coupon.value / 100))
                        yield* $(Effect.log(`Coupon percentage discount: ${discount}`))
                    }
                    couponApplied = true
                }
                yield* $(Effect.log(`Subtotal before discount: ${subtotal}`))
                const subtotalAfterDiscount = subtotal - discount
                   yield* $(Effect.log(`Coupon subtotalAfterDiscount: ${subtotalAfterDiscount}`))// Cap at subtotal


                // 4. Calculate Shipping (Using Rule Engine)
                // We use subtotal AFTER discount to determine threshold
                const shippingRule = yield* $(shippingRepo.getRule())
                const shipping = calculateShipping(subtotalAfterDiscount, shippingRule)
                
                const taxableTotal = subtotalAfterDiscount + shipping

                // VAT Calculation - driven by TenantConfig
                const taxConfig = getTenantConfig().tax
                let tax = 0
                if (taxConfig.enabled) {
                    const rate = taxConfig.rate / 100 // 15 → 0.15
                    if (taxConfig.inclusive) {
                        // Extract VAT from inclusive price (SA standard)
                        tax = Math.round(taxableTotal - (taxableTotal / (1 + rate)))
                    } else {
                        // Add VAT on top
                        tax = Math.round(taxableTotal * rate)
                    }
                }

                const total = taxConfig.inclusive ? taxableTotal : taxableTotal + tax
                
                return {
                    lineItems: processedItems,
                    subtotal,
                    shipping,
                    discount,
                    tax,
                    total,
                    couponApplied
                }
            })
        }
    })
)
