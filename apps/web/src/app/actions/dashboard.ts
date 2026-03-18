
"use server"

import { Effect } from "effect"
import { OrderStatsService, OrderStatsServiceLive } from "@kemotsho/module-commerce/orders/application/OrderStatsService"
import { AppRuntime } from "@kemotsho/core/lib/runtime"

export async function getDashboardStatsAction() {
    const program = Effect.gen(function* (_) {
        const service = yield* _(OrderStatsService)
        return yield* _(service.getDashboardStats())
    })

    return AppRuntime.runPromiseExit(
        program.pipe(Effect.provide(OrderStatsServiceLive))
    )
}

export async function getAnalyticsDataAction() {
    const program = Effect.gen(function* (_) {
        const service = yield* _(OrderStatsService)
        return yield* _(service.getAnalyticsData(30)) // Default 30 days
    })

    return AppRuntime.runPromiseExit(
        program.pipe(Effect.provide(OrderStatsServiceLive))
    )
}
