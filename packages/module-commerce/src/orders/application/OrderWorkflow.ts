
import { Context, Effect, Layer, Option } from "effect"
import { Order, OrderId, OrderStatus, Address, OrderLineItem, InvalidOrderState, OrderError, OrderNotFound, PaymentMethod } from "../domain/Order"
import { OrderRepository } from "../domain/OrderRepository"
import { PaymentGateway, PaymentInitialization } from "@kemotsho/module-commerce/payments/domain/PaymentGateway"
import { CustomerRepository, Customer } from "@kemotsho/module-commerce/customers/domain/Customer"
import { ProductRepository } from "@kemotsho/module-commerce/products/domain/Product"
import { CouponRepository } from "@kemotsho/module-commerce/marketing/domain/Coupon"

// Input DTOs
export interface PlaceOrderParams {
    userId: string | null
    items: OrderLineItem[]
    shippingAddress: Address
    billingAddress?: Address
    paymentMethod: typeof PaymentMethod.Type
    shippingCost: number
    discount?: number
    couponCode?: string | null
    tax: number
    subtotal: number
    total: number
    currency: string
    contactEmail: string
}

export interface OrderWorkflow {
    /**
     * Step 1: Validates cart, stock (future), creates pending order, AND initiates payment session.
     * Returns the Payment Gateway instruction (Redirect URL or Form Data).
     */
    readonly placeOrder: (params: PlaceOrderParams) => Effect.Effect<PaymentInitialization, OrderError | Error>

    /**
     * Step 2: Handle Webhook.
     * Verifies signature, Checks Order Status, Updates to 'processing' or 'paid'.
     */
    readonly confirmPayment: (headers: Headers, body: unknown) => Effect.Effect<{ orderId: string, status: string }, Error>

    /**
     * Step 3: Admin marks as shipped.
     */
    readonly shipOrder: (orderId: string, trackingNumber?: string) => Effect.Effect<Order, Error>
}

export const OrderWorkflow = Context.GenericTag<OrderWorkflow>("@modules/orders/OrderWorkflow")

export const OrderWorkflowLive = Layer.effect(
    OrderWorkflow,
    Effect.gen(function* (_) {
        const repo = yield* _(OrderRepository)
        const paymentGateway = yield* _(PaymentGateway)
        const customerRepo = yield* _(CustomerRepository)
        const productRepo = yield* _(ProductRepository)
        const couponRepo = yield* _(CouponRepository)

        // Helper: Resolve or Create Customer
        const resolveCustomer = (params: PlaceOrderParams): Effect.Effect<Customer, Error> => Effect.gen(function* () {
             
             // Update customer address if needed
             const updateAddressIfNeeded = (existing: Customer) => Effect.gen(function* (){
                 // Check uniqueness (simple check: line1 + postCode + city)
                 const isSame = (a: Address, b: Address) => 
                    a.line1 === b.line1 && a.postalCode === b.postalCode && a.city === b.city
                
                 const isKnown = existing.addresses.some(a => isSame(a, params.shippingAddress))
                 
                 // If address is known and is already default, do nothing, just return existing
                 if (isKnown && Option.isSome(existing.defaultShippingAddress) 
                     && isSame(existing.defaultShippingAddress.value, params.shippingAddress)) {
                     return existing
                 }
                 
                 const updates: any = {
                     defaultShippingAddress: Option.some(params.shippingAddress)
                 }
                 
                 // Only append if it's a new address
                 if (!isKnown) {
                     updates.addresses = [...existing.addresses, params.shippingAddress]
                 }
                 
                 return yield* _(customerRepo.update(existing.id, updates))
             })

             // 1. If Logged In, try find by User ID
             if (params.userId) {
                 const existingUser = yield* _(Effect.matchEffect(
                     customerRepo.getByUserId(params.userId),
                     {
                         onFailure: () => Effect.succeed(null), // Not found
                         onSuccess: (c) => Effect.succeed(c)
                     }
                 ))
                 if (existingUser) return yield* _(updateAddressIfNeeded(existingUser))
             }

             // 2. Try find by Email (Guest returning?)
             const existingEmail = yield* _(Effect.matchEffect(
                 customerRepo.getByEmail(params.contactEmail),
                 {
                     onFailure: () => Effect.succeed(null),
                     onSuccess: (c) => Effect.succeed(c)
                 }
             ))

             if (existingEmail) {
                 return yield* _(updateAddressIfNeeded(existingEmail))
             }

             // 3. Create New Customer
             return yield* _(customerRepo.create({
                 userId: params.userId ? Option.some(params.userId as any) : Option.none(),
                 email: params.contactEmail,
                 firstName: params.shippingAddress.firstName,
                 lastName: params.shippingAddress.lastName,
                 phone: Option.some(params.shippingAddress.phone),
                 addresses: [params.shippingAddress],
                 defaultShippingAddress: Option.some(params.shippingAddress),
                 defaultBillingAddress: Option.some(params.billingAddress || params.shippingAddress)
             }))
        })

        return {
            placeOrder: (params) => Effect.gen(function* () {
                // 1. Resolve Customer Identity
                const customer = yield* _(resolveCustomer(params))

                // 2. Generate Order Number
                const orderNumber = yield* _(repo.getNextOrderNumber())

                // 3. Validate Amounts (Simple check)
                if (params.total !== params.subtotal + params.shippingCost + params.tax) {
                    // console.warn("Total mismatch, correcting...", params)
                }

                // 4. Reserve Stock (Transactional)
                const stockItems = params.items.map(item => ({
                    productId: item.productId,
                    variantId: Option.getOrUndefined(item.variantId),
                    quantity: item.quantity
                }))
                yield* _(productRepo.reserveStock(stockItems))

                // 5. Create Pending Order
                const newOrderProxy: Omit<Order, "id" | "createdAt" | "updatedAt"> = {
                    orderNumber,
                    customerId: customer.id, // Linked!
                    customerEmail: customer.email,
                    userId: params.userId ? Option.some(params.userId as any) : Option.none(), 
                    items: params.items,
                    currency: params.currency,
                    subtotal: params.subtotal,
                    discount: params.discount || 0,
                    couponCode: Option.fromNullable(params.couponCode),
                    shippingCost: params.shippingCost,
                    tax: params.tax,
                    total: params.total,
                    shippingAddress: params.shippingAddress,
                    billingAddress: Option.fromNullable(params.billingAddress),
                    status: "pending",
                    paymentMethod: params.paymentMethod as any, // Cast to match schema literal
                    paymentGatewayRef: Option.none(),
                    fulfillment: Option.none()
                }

                const createdOrder = yield* _(
                    repo.create(newOrderProxy as any).pipe(
                        Effect.catchAll(err => 
                            // Rollback stock reservation if order creation fails
                            productRepo.releaseStock(stockItems).pipe(
                                Effect.flatMap(() => Effect.fail(err))
                            )
                        )
                    )
                )

                // 6. Increment Coupon Usage
                const couponUpdate = Effect.gen(function* () {
                    if (params.couponCode) {
                        const coupon = yield* _(couponRepo.getByCode(params.couponCode))
                        if (coupon) {
                             yield* _(couponRepo.incrementUsage(coupon.id))
                        }
                    }
                })

                yield* _(couponUpdate)

                // 7. Initiate Payment
                const paymentInit = yield* _(paymentGateway.createSession({
                    orderId: createdOrder.id,
                    amount: createdOrder.total,
                    currency: createdOrder.currency,
                    email: params.contactEmail,
                    description: `Order ${createdOrder.orderNumber}`,
                    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?orderId=${createdOrder.id}`,
                    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel?orderId=${createdOrder.id}`,
                    notifyUrl: process.env.PAYFAST_NOTIFY_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payfast`,
                    nameFirst: params.shippingAddress.firstName,
                    nameLast: params.shippingAddress.lastName
                }))

                return paymentInit
            }),

            confirmPayment: (headers, body) => Effect.gen(function* () {
                // 1. Verify Webhook (Delegated to Payment Module)
                const event = yield* _(paymentGateway.verifyWebhook(headers, body))

                // 2. Get Order
                const order = yield* _(repo.getById(event.orderId))

                // 3. Atomic State Transition
                if (order.status === "shipped" || order.status === "delivered" || order.status === "processing") {
                    // Idempotent success if already processed
                    return { orderId: order.id, status: order.status } 
                }

                if (event.status === "failed" || event.status === "cancelled") {
                     const failedOrder = { ...order, status: "cancelled" as const }
                     yield* _(repo.update(failedOrder))
                     return { orderId: order.id, status: "cancelled" }
                }

                if (event.status === "paid") {
                    // Update to processing (paid)
                    const paidOrder: any = { 
                        ...order, 
                        status: "processing" as const,
                        paymentGatewayRef: Option.some(event.transactionId)
                    }
                    yield* _(repo.update(paidOrder))
                    return { orderId: order.id, status: "processing" }
                }

                return { orderId: order.id, status: order.status }
            }),

            shipOrder: (orderId, trackingNumber) => Effect.gen(function* () {
                const order = yield* _(repo.getById(orderId))

                if (order.status !== "processing") {
                    return yield* _(Effect.fail(new InvalidOrderState({ 
                        message: `Cannot ship order in state ${order.status}. Must be 'processing' (paid).` 
                    })))
                }

                const shippedOrder = { 
                    ...order, 
                    status: "shipped" as const
                    // We could add tracking number to domain here
                }
                
                return yield* _(repo.update(shippedOrder))
            })
        }
    })
)
