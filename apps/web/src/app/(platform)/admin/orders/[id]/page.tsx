import { verifySession } from "@kemotsho/core/lib/auth-dal"
import { redirect, notFound } from "next/navigation"
import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { Effect, Exit } from "effect"
import { OrderRepository } from "@kemotsho/module-commerce/orders/domain/OrderRepository"
import { FirebaseOrderRepositoryLive } from "@kemotsho/module-commerce/orders/infrastructure/FirebaseOrderRepository"
import { getTenantConfig } from "@kemotsho/core/config/tenant"
import { formatCurrency } from "@kemotsho/core/lib/utils"
import Link from "next/link"
import { Button } from "@/shared/ui/atoms/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kemotsho/core/ui/card"
import { ArrowLeft, Download } from "lucide-react"
import { OrderActions } from "./order-actions"
import { Option } from "effect"

// Helper to safely extract string from Option/Null/String mixed types
function safeRender(value: any): string | null {
    if (value === null || value === undefined) return null;

    // Handle string primitives immediately
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);

    // Recursively handle objects
    if (typeof value === "object") {
        // 1. Effect Option
        if (Option.isOption(value)) {
            return safeRender(Option.getOrNull(value));
        }

        // 2. Legacy/Serialized Option-like objects
        // Check for 'value' prop, but be careful not to recurse endlessly if value === value
        if ("value" in value && value.value !== value) { 
             return safeRender(value.value);
        }
        
        // 3. Date objects
        if (value instanceof Date) {
            return value.toLocaleString();
        }

        // 4. Unknown Objects - Do NOT return "[object Object]"
        // Return null to allow fallback to "N/A" in UI
        return null;
    }
    
    return String(value);
}

async function getOrder(id: string) {
    const program = Effect.gen(function* (_) {
        const repo = yield* _(OrderRepository)
        return yield* _(repo.getById(id))
    })

    const runnable = program.pipe(
        Effect.provide(FirebaseOrderRepositoryLive)
    )

    return await AppRuntime.runPromiseExit(runnable)
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await verifySession()
    if (!session || session.role !== "admin") {
        redirect("/login")
    }

    const result = await getOrder(id)
    
    if (Exit.isFailure(result)) {
        return notFound()
    }

    const order = result.value
    const fulfillment = Option.getOrNull(order.fulfillment)
    
    // Calculate Tax Label based on order math (historical accuracy)
    const calculatedTotalWithTax = order.subtotal + order.shippingCost + order.tax;
    const isExclusiveTax = Math.abs(calculatedTotalWithTax - order.total) < 0.05;
    const config = getTenantConfig();
    const taxLabel = isExclusiveTax 
        ? (config.tax.label || "VAT") 
        : `${config.tax.label || "VAT"} (incl.)`;

    return (
        <div className="container py-8 space-y-8 max-w-5xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button intent="ghost" size="icon" asChild>
                    <Link href="/admin/orders"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Order #{order.orderNumber}</h1>
                     <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <span>{new Date(order.createdAt).toLocaleString()}</span>
                        <span>•</span>
                        <span className="capitalize">{order.status.replace("_", " ")}</span>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button intent="outline" asChild>
                         <a href={`/admin/orders/${order.id}/packing-slip`} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" />
                            Packing Slip
                        </a>
                    </Button>
                    <Button intent="outline" asChild>
                        <a href={`/account/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" />
                            Invoice
                        </a>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Main Content: Items */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-start border-b last:border-0 pb-4 last:pb-0">
                                        <div>
                                            <p className="font-medium">{item.title}</p>
                                            <p className="text-sm text-muted-foreground">SKU: {safeRender(item.sku) || "N/A"}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">{formatCurrency(item.total)}</p>
                                            <p className="text-sm text-muted-foreground">{item.quantity} x {formatCurrency(item.priceAtPurchase)}</p>
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="pt-4 space-y-2 border-t mt-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>{formatCurrency(order.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span>{formatCurrency(order.shippingCost)}</span>
                                    </div>
                                    {order.tax > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{taxLabel}</span>
                                            <span>{formatCurrency(order.tax)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-base pt-2">
                                        <span>Total</span>
                                        <span>{formatCurrency(order.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Fulfullment Info */}
                    {(order.status === "shipped" || order.status === "delivered") && fulfillment && (
                        <Card className="bg-blue-50/50 border-blue-100">
                             <CardHeader>
                                <CardTitle className="text-blue-900">Fulfillment Details</CardTitle>
                            </CardHeader>
                            <CardContent className="text-blue-800">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs uppercase font-bold text-blue-400">Courier</p>
                                        <p>{fulfillment.courier}</p>
                                    </div>
                                    <div>
                                         <p className="text-xs uppercase font-bold text-blue-400">Tracking Code</p>
                                        <p className="font-mono">{fulfillment.trackingCode}</p>
                                    </div>
                                     <div>
                                         <p className="text-xs uppercase font-bold text-blue-400">Shipped At</p>
                                        <p>{new Date(fulfillment.shippedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar: Customer & Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <OrderActions orderId={order.id} currentStatus={order.status} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Customer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <p className="font-medium">Name</p>
                                <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                            </div>
                            <div>
                                <p className="font-medium">Email</p>
                                <p className="text-muted-foreground">{order.customerEmail}</p>
                            </div>
                             <div>
                                <p className="font-medium">Phone</p>
                                <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
                            </div>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Shipping Address</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                             <p>{order.shippingAddress.line1}</p>
                             {safeRender(order.shippingAddress.line2) && <p>{safeRender(order.shippingAddress.line2)}</p>}
                             
                             <p>{order.shippingAddress.city}, {safeRender(order.shippingAddress.state)}</p>
                             <p>{order.shippingAddress.postalCode}</p>
                             <p>{order.shippingAddress.country}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
