"use server"

import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { verifySession } from "@kemotsho/core/lib/auth-dal"
import { Effect, Exit, Cause, Option } from "effect"
import { OrderRepository } from "@kemotsho/module-commerce/orders/domain/OrderRepository"
import { FirebaseOrderRepositoryLive } from "@kemotsho/module-commerce/orders/infrastructure/FirebaseOrderRepository"
import { OrderStatus, OrderId } from "@kemotsho/module-commerce/orders/domain/Order"
import { Schema } from "effect"

export async function updateOrderStatusAction(orderId: string, status: string) {
    const session = await verifySession()
    if (!session || session.role !== "admin") {
        return { success: false, error: "Unauthorized" }
    }

    const program = Effect.gen(function* (_) {
        // Validation
        const newStatus = yield* _(Schema.decodeUnknown(OrderStatus)(status))

        // We use the ID directly from the URL (string)
        // OrderId.make(orderId) will now correctly cast the string orderId to a Branded ID
        // instead of ignoring it and making a random UUID.
        const id = OrderId.make(orderId) 

        const repo = yield* _(OrderRepository)
        const order = yield* _(repo.getById(id))
        
        const updatedOrder = {
            ...order,
            status: newStatus
        }

        yield* _(repo.update(updatedOrder))
    })

    const runnable = program.pipe(
        Effect.provide(FirebaseOrderRepositoryLive)
    )

    const result = await AppRuntime.runPromiseExit(runnable)

    if (Exit.isSuccess(result)) {
        return { success: true }
    }
    
    return { success: false, error: "Failed to update status" }
}

export async function addTrackingAction(orderId: string, carrier: string, trackingCode: string) {
    const session = await verifySession()
    if (!session || session.role !== "admin") {
        return { success: false, error: "Unauthorized" }
    }

    const program = Effect.gen(function* (_) {
        const id = OrderId.make(orderId)
        const repo = yield* _(OrderRepository)
        const order = yield* _(repo.getById(id))
        
        const updatedOrder = {
            ...order,
            status: "shipped" as OrderStatus,
            fulfillment: Option.some({
                courier: carrier,
                trackingCode: trackingCode,
                shippedAt: new Date()
            })
        }

        yield* _(repo.update(updatedOrder))
    })

    const runnable = program.pipe(
        Effect.provide(FirebaseOrderRepositoryLive)
    )

    const result = await AppRuntime.runPromiseExit(runnable)

    if (Exit.isSuccess(result)) {
        return { success: true }
    }
    
    // Log fail locally
    const failure = Cause.failureOption(result.cause)
    if (Option.isSome(failure)) {
        console.error("Add Tracking Failed", failure.value)
    }

    // Return plain object error to client
    return { 
        success: false, 
        error: "Order not found or failed to update" 
    }
}
