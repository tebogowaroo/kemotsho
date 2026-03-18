"use server"

import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { getCurrentUser } from "@kemotsho/core/lib/auth"
import { Effect, Exit, Cause, Layer, Option } from "effect"
import { OrderRepository } from "@kemotsho/module-commerce/orders/domain/OrderRepository"
import { CustomerRepository } from "@kemotsho/module-commerce/customers/domain/Customer"
import { FirebaseOrderRepositoryLive } from "@kemotsho/module-commerce/orders/infrastructure/FirebaseOrderRepository"
import { FirebaseCustomerRepositoryLive } from "@kemotsho/module-commerce/customers/infrastructure/FirebaseCustomerRepository"

// Combined Layer for Order Usage
const OrderSystemLive = Layer.merge(
    FirebaseOrderRepositoryLive,
    FirebaseCustomerRepositoryLive
)

export async function getMyOrdersAction() {
    const program = Effect.gen(function* (_) {
        // 1. Get Current Auth User
        const user = yield* _(getCurrentUser)
        
        // 2. Get Customer Profile linked to User
        const customerRepo = yield* _(CustomerRepository)
        // Note: getByUserId might typically return one customer
        const customer = yield* _(customerRepo.getByUserId(user.uid))
        
        // 3. Get Orders for this Customer
        const orderRepo = yield* _(OrderRepository)
        const orders = yield* _(orderRepo.findByCustomerId(customer.id))
        
        return orders
    })

    const runnable = program.pipe(
        Effect.provide(OrderSystemLive)
    )

    const result = await AppRuntime.runPromiseExit(runnable)

    if (Exit.isSuccess(result)) {
        return { success: true, data: result.value }
    } else {
        const failure = Cause.failureOption(result.cause)
        // If it's just "CustomerNotFound", maybe return empty list?
        // But for now let's just error logging.
        // Format the failure for console output
        const failureDetails = Option.getOrElse(failure, () => "Unknown Cause")
        console.error("Get My Orders Failed:", JSON.stringify(failureDetails, null, 2))
        
        // Serialize error for Client
        // Check if it is a known error type
        if (Option.isSome(failure)) {
             // simplified handling
             const err = failure.value
             if ((err as any)?._tag === "CustomerNotFound") {
                 return { success: true, data: [] } // No customer profile = No orders
             }
        }
        
        return { success: false, error: "Failed to fetch orders" }
    }
}
