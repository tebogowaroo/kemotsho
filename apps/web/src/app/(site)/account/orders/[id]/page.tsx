import { verifySession } from "@kemotsho/core/lib/auth-dal"
import { redirect, notFound } from "next/navigation"
import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { Effect, Exit, Option } from "effect"
import { OrderRepository } from "@kemotsho/module-commerce/orders/domain/OrderRepository"
import { FirebaseOrderRepositoryLive } from "@kemotsho/module-commerce/orders/infrastructure/FirebaseOrderRepository"
import { FirebaseCustomerRepositoryLive } from "@kemotsho/module-commerce/customers/infrastructure/FirebaseCustomerRepository"
import { CustomerRepository } from "@kemotsho/module-commerce/customers/domain/Customer"
import { Layer } from "effect"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@kemotsho/core/ui/card"
import { Button } from "@/shared/ui/atoms/button"
import Link from "next/link"
import { ArrowLeft, Download, ExternalLink } from "lucide-react"
import { formatCurrency } from "@kemotsho/core/lib/utils"
import { OrderStatusBar } from "@/components/orders/order-status-bar"
import { getTrackingLink } from "@kemotsho/core/lib/couriers"

// --- Helper Functions ---
function safeRender(value: any): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);

    // Recursively handle objects
    if (typeof value === "object") {
        if (Option.isOption(value)) return safeRender(Option.getOrNull(value));
        if ("value" in value && value.value !== value) return safeRender(value.value); 
        if (value instanceof Date) return value.toLocaleString();
        return null;
    }
    return String(value);
}

// Fetch helper (similar to Invoice page, ensures ownership)
async function getCustomerOrder(id: string, userId: string) {
    const program = Effect.gen(function* (_) {
        const orderRepo = yield* _(OrderRepository)
        const customerRepo = yield* _(CustomerRepository)
        
        const order = yield* _(orderRepo.getById(id))
        const customer = yield* _(customerRepo.getByUserId(userId))

        // Authorization: Check if order belongs to this customer
        const orderCustomerId = order.customerId
        // Also check direct userId on order if available
        const orderUserId = Option.getOrNull(order.userId)

        if (orderCustomerId === customer.id || orderUserId === userId) {
            return order
        }
        
        return yield* _(Effect.fail(new Error("Unauthorized")))
    })

    const OrderSystemLive = Layer.merge(
        FirebaseOrderRepositoryLive,
        FirebaseCustomerRepositoryLive
    )

    return await AppRuntime.runPromiseExit(
        program.pipe(Effect.provide(OrderSystemLive))
    )
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await verifySession()

    if (!session) {
        redirect(`/login?redirect=/account/orders/${id}`)
    }

    const result = await getCustomerOrder(id, session.userId)

    if (Exit.isFailure(result)) {
        return notFound()
    }

    const order = result.value
    const fulfillment = Option.getOrNull(order.fulfillment)
    
    // Tracking Logic
    const trackingLink = fulfillment 
        ? getTrackingLink(fulfillment.courier, fulfillment.trackingCode) 
        : null

    return (
        <div className="space-y-8">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <Button intent="ghost" size="sm" asChild>
                    <Link href="/account/orders">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Orders
                    </Link>
                </Button>
                <div className="flex-1"></div>
                <Button intent="outline" size="sm" asChild>
                    <Link href={`/account/orders/${id}/invoice`} target="_blank">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                    </Link>
                </Button>
            </div>

            <div className="flex justify-between items-start">
               <div>
                    <h1 className="text-2xl font-bold tracking-tight">Order #{order.orderNumber}</h1>
                    <p className="text-muted-foreground text-sm">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
               </div>
               <div className="text-right">
                    <p className="font-bold text-xl">{formatCurrency(order.total)}</p>
                    <p className="text-sm text-muted-foreground">{order.items.length} items</p>
               </div>
            </div>

            {/* Status Bar */}
            <OrderStatusBar status={order.status} />

            {/* Tracking (if shipped) */}
            {(order.status === "shipped" || order.status === "delivered") && fulfillment && (
                 <Card className="bg-blue-50/50 border-blue-100">
                    <CardHeader>
                        <CardTitle className="text-blue-900 text-lg">Tracking Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3 items-center">
                        <div>
                             <p className="text-xs uppercase font-bold text-blue-400">Courier</p>
                             <p className="font-medium text-blue-900">{fulfillment.courier}</p>
                        </div>
                        <div>
                             <p className="text-xs uppercase font-bold text-blue-400">Tracking Code</p>
                             <p className="font-mono text-blue-900">{fulfillment.trackingCode}</p>
                        </div>
                        <div className="text-right">
                            {trackingLink ? (
                                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                                    <a href={trackingLink} target="_blank" rel="noopener noreferrer">
                                        Track Package <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            ) : (
                                <p className="text-sm text-muted-foreground">Log in to courier site to track.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-8 md:grid-cols-3">
                {/* Main: Items */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items.map((item, i) => (
                                    <div key={i} className="flex gap-4 border-b last:border-0 pb-4 last:pb-0">
                                         {/* Image Placeholder or Actual Image */}
                                         <div className="h-16 w-16 bg-muted rounded-md overflow-hidden flex-shrink-0 relative">
                                            {Option.getOrNull(item.image) ? (
                                                <img src={Option.getOrNull(item.image)!} alt={item.title} className="object-cover w-full h-full" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No Img</div>
                                            )}
                                         </div>
                                         <div className="flex-1">
                                            <p className="font-medium">{item.title}</p>
                                            <div className="text-sm text-muted-foreground">
                                                <span>Qty: {item.quantity}</span>
                                                <span className="mx-2">•</span>
                                                <span>{formatCurrency(item.priceAtPurchase)}</span>
                                            </div>
                                         </div>
                                         <div className="font-medium">
                                            {formatCurrency(item.total)}
                                         </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Summary Totals */}
                            <div className="mt-8 space-y-2 border-t pt-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatCurrency(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span>{formatCurrency(order.shippingCost)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-base pt-2 border-t mt-2">
                                    <span>Total</span>
                                    <span>{formatCurrency(order.total)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Details */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Shipping Address</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                            <p className="font-medium">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                            <p>{order.shippingAddress.line1}</p>
                            {safeRender(order.shippingAddress.line2) && <p>{safeRender(order.shippingAddress.line2)}</p>}
                            <p>{order.shippingAddress.city}</p>
                            <p>{order.shippingAddress.postalCode}</p>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Payment</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <div className="flex justify-between py-1">
                                <span className="text-muted-foreground">Method</span>
                                <span className="capitalize">{order.paymentMethod.replace("_", " ")}</span>
                            </div>
                            <div className="flex justify-between py-1 border-t mt-1">
                                <span className="text-muted-foreground">Status</span>
                                <span className="font-medium capitalize">{order.status === 'pending' ? 'Pending' : order.status}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
