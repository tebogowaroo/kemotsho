"use server"

import { Effect } from "effect"
import { OrderRepository } from "@kemotsho/module-commerce/orders/domain/OrderRepository"
import { FirebaseOrderRepositoryLive } from "@kemotsho/module-commerce/orders/infrastructure/FirebaseOrderRepository"
import { Schema } from "effect"

export async function getPostPurchaseInfo(orderId: string) {
    const program = Effect.gen(function* (_) {
        const repo = yield* _(OrderRepository)
        // Fetch order. If not found, just return generic non-guest response to avoid leaking info.
        const order = yield* _(
            repo.getById(orderId), 
            Effect.catchAll(() => Effect.succeed(null))
        )

        if (!order) {
            return { isGuest: false }
        }

        // Check if Guest
        if (!order.userId) {
             return {
                 isGuest: true,
                 email: order.customerEmail,
                 customerId: order.customerId
             }
        }

        return { isGuest: false }
    })

    return Effect.runPromise(
        Effect.provide(program, FirebaseOrderRepositoryLive)
    )
}
