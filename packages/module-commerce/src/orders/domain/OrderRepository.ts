
import { Effect, Context } from "effect"
import { Order, OrderId, OrderError, OrderNotFound } from "./Order"

export interface OrderRepository {
    readonly getById: (id: string) => Effect.Effect<Order, OrderNotFound | OrderError>
    readonly create: (order: Omit<Order, "id" | "createdAt" | "updatedAt">) => Effect.Effect<Order, OrderError>
    readonly update: (order: Order) => Effect.Effect<Order, OrderNotFound | OrderError>
    readonly list: (userId?: string) => Effect.Effect<Order[], OrderError>
    readonly findByCustomerId: (customerId: string) => Effect.Effect<Order[], OrderError>
    
    // Admin ops
    readonly listAll: () => Effect.Effect<Order[], OrderError>
    readonly getNextOrderNumber: () => Effect.Effect<string, OrderError>
}

export const OrderRepository = Context.GenericTag<OrderRepository>("@modules/orders/OrderRepository")
