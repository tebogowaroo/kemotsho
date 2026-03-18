
import { Effect, Layer, Context } from "effect"
import { db } from "@kemotsho/core/infra/firebase/admin"
import { OrderError } from "@kemotsho/module-commerce/orders/domain/Order"
import { Timestamp, Filter } from "firebase-admin/firestore"

export interface DashboardStats {
    totalRevenue: number
    ordersCount: number
    averageOrderValue: number
    recentSales: {
        id: string
        customerName: string
        email: string
        amount: number
        status: string
        createdAt: Date
    }[]
}

export interface AnalyticsData {
    salesOverTime: { date: string; value: number }[]
    topProducts: { name: string; quantity: number; revenue: number }[]
}

export class OrderStatsService extends Context.Tag("OrderStatsService")<
    OrderStatsService,
    {
        getDashboardStats: () => Effect.Effect<DashboardStats, OrderError>
        getAnalyticsData: (days?: number) => Effect.Effect<AnalyticsData, OrderError>
    }
>() {}

export const OrderStatsServiceLive = Layer.effect(
    OrderStatsService,
    Effect.succeed({
        getAnalyticsData: (days = 30) => Effect.tryPromise({
            try: async () => {
                const now = new Date()
                const pastDate = new Date()
                pastDate.setDate(now.getDate() - days)

                const ordersRef = db.collection("orders")
                
                // Query by date only to avoid composite index requirement
                const snapshot = await ordersRef
                    .where("createdAt", ">=", pastDate)
                    .orderBy("createdAt", "asc")
                    .get()

                const salesMap: Record<string, number> = {}
                const productMap: Record<string, { quantity: number; revenue: number }> = {}

                // Initialize last X days with 0
                for (let i = 0; i < days; i++) {
                    const d = new Date()
                    d.setDate(now.getDate() - i)
                    const key = d.toISOString().split('T')[0]
                    if (key) {
                        salesMap[key] = 0
                    }
                }

                snapshot.forEach(doc => {
                    const data = doc.data()
                    
                    // Filter status in memory
                    if (!["processing", "shipped", "delivered"].includes(data.status)) {
                        return
                    }

                    const date = (data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt)).toISOString().split('T')[0]
                    
                    if (date) {
                        // 1. Sales Over Time
                        salesMap[date] = (salesMap[date] || 0) + (data.total || 0)
                    }

                    // 2. Top Products
                    // Note: items structure check required. In OrderRepository we saw items: OrderLineItem[]
                    // Firestore stores it as array of maps
                    const items = data.items || []
                    items.forEach((item: any) => {
                         const title = item.title || "Unknown Product"
                         const qty = item.quantity || 0
                         const total = item.total || 0
                         
                         if (!productMap[title]) productMap[title] = { quantity: 0, revenue: 0 }
                         productMap[title].quantity += qty
                         productMap[title].revenue += total
                    })
                })

                // Convert to Arrays
                const salesOverTime = Object.entries(salesMap)
                    .map(([date, value]) => ({ date, value }))
                    .sort((a, b) => a.date.localeCompare(b.date)) // Ensure sorted

                const topProducts = Object.entries(productMap)
                    .map(([name, stats]) => ({ name, ...stats }))
                    .sort((a, b) => b.quantity - a.quantity) // Sort by volume
                    .slice(0, 5) // Top 5

                return {
                    salesOverTime,
                    topProducts
                }
            },
            catch: (error) => new OrderError({ message: "Failed to fetch analytics", cause: error })
        }),

        getDashboardStats: () => Effect.tryPromise({
            try: async () => {
                const ordersRef = db.collection("orders")
                
                // 1. Get Aggregates (Revenue, Count)
                // Note: sum() is supported in recent firebase-admin but let's be safe and check if we can query for "paid" orders only.
                // Status: "processing", "shipped", "delivered" count as Revenue. "pending_payment" and "cancelled" do not.
                
                const paidOrdersQuery = ordersRef.where("status", "in", ["processing", "shipped", "delivered"])
                const snapshot = await paidOrdersQuery.get()
                
                // In-memory aggregation for now (simplest for <10k orders)
                // If scaling, use `paidOrdersQuery.count().get()` and `paidOrdersQuery.aggregate(sum("total")).get()`
                
                let totalRevenue = 0
                let ordersCount = 0
                
                snapshot.forEach(doc => {
                    const data = doc.data()
                    totalRevenue += (data.total || 0)
                    ordersCount += 1
                })
                
                // 2. Recent Sales
                const recentSnapshot = await ordersRef
                    .orderBy("createdAt", "desc")
                    .limit(5)
                    .get()
                    
                const recentSales = recentSnapshot.docs.map(doc => {
                    const data = doc.data()
                    return {
                        id: doc.id,
                        customerName: `${data.shippingAddress?.firstName || 'Guest'} ${data.shippingAddress?.lastName || ''}`,
                        email: data.customerEmail,
                        amount: data.total,
                        status: data.status,
                        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
                    }
                })

                return {
                    totalRevenue,
                    ordersCount,
                    averageOrderValue: ordersCount > 0 ? Math.round(totalRevenue / ordersCount) : 0,
                    recentSales
                }
            },
            catch: (error) => new OrderError({ message: "Failed to fetch stats", cause: error })
        })
    })
)
