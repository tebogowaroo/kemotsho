import { getMyOrdersAction } from "@/app/actions/orders"
import { Button } from "@/shared/ui/atoms/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@kemotsho/core/ui/card" // Assuming these exist, if not I'll fallback
import Link from "next/link"
import { formatCurrency } from "@kemotsho/core/lib/utils"
// import { Badge } from "@kemotsho/core/ui/badge" 

export default async function MyOrdersPage() {
    const result = await getMyOrdersAction()
    
    if (!result.success) {
        return (
            <div className="container py-12">
                <h1 className="text-3xl font-bold mb-6">My Orders</h1>
                <div className="p-4 border border-red-200 bg-red-50 text-red-900 rounded">
                    Failed to load orders. Please try logging in again.
                </div>
            </div>
        )
    }

    const orders = result.data || []

    return (
        <div className="container py-12 max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">My Orders</h1>
                <Button asChild intent="outline">
                    <Link href="/products">Continue Shopping</Link>
                </Button>
            </div>

            {orders.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No orders yet</CardTitle>
                        <CardDescription>You haven't placed any orders yet.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/products">Browse Products</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <Card key={order.id} className="overflow-hidden">
                            <div className="bg-muted/30 p-4 flex flex-wrap gap-4 justify-between items-center text-sm">
                                <div className="space-y-1">
                                    <div className="font-medium">Order Number</div>
                                    <div>{order.orderNumber}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="font-medium">Date Placed</div>
                                    <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="font-medium">Total Amount</div>
                                    <div>{formatCurrency(order.total)}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="font-medium">Status</div>
                                    <div className="capitalize font-medium">{order.status}</div>
                                </div>
                                <Button size="sm" intent="outline" asChild>
                                    <Link href={`/account/orders/${order.id}`}>View Details</Link>
                                </Button>
                            </div>
                            <CardContent className="p-4">
                                <ul className="space-y-2">
                                    {order.items.map((item, idx) => (
                                        <li key={idx} className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">{item.quantity} x {item.title}</span>
                                            <span>{formatCurrency(item.priceAtPurchase * item.quantity)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
