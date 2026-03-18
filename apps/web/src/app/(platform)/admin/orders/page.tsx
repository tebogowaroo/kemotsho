import { verifySession } from "@kemotsho/core/lib/auth-dal"
import { redirect } from "next/navigation"
import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { Effect, Exit } from "effect"
import { OrderRepository } from "@kemotsho/module-commerce/orders/domain/OrderRepository"
import { FirebaseOrderRepositoryLive } from "@kemotsho/module-commerce/orders/infrastructure/FirebaseOrderRepository"
import { formatCurrency } from "@kemotsho/core/lib/utils"
import Link from "next/link"
import { Button } from "@/shared/ui/atoms/button"
import { Badge } from "@kemotsho/core/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@kemotsho/core/ui/table"

async function getOrders() {
    const program = Effect.gen(function* (_) {
        const repo = yield* _(OrderRepository)
        return yield* _(repo.listAll())
    })

    const runnable = program.pipe(
        Effect.provide(FirebaseOrderRepositoryLive)
    )

    return await AppRuntime.runPromiseExit(runnable)
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        pending_payment: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        processing: "bg-blue-100 text-blue-800 hover:bg-blue-100",
        shipped: "bg-purple-100 text-purple-800 hover:bg-purple-100",
        delivered: "bg-green-100 text-green-800 hover:bg-green-100",
        cancelled: "bg-red-100 text-red-800 hover:bg-red-100",
        refunded: "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
    return (
        <Badge variant="outline" className={`capitalize border-0 ${styles[status] || ""}`}>
            {status.replace("_", " ")}
        </Badge>
    )
}

export default async function AdminOrdersPage() {
    const session = await verifySession()
    if (!session || session.role !== "admin") {
        redirect("/login")
    }

    const result = await getOrders()
    
    // Simple error handling
    if (Exit.isFailure(result)) {
        return <div className="p-8 text-red-500">Failed to load orders</div>
    }

    const orders = result.value

    return (
        <div className="container py-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                    <p className="text-muted-foreground">Manage order lifecycle and fulfillment.</p>
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No orders found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</span>
                                            <span className="text-xs text-muted-foreground">{order.customerEmail}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={order.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(order.total)}
                                    </TableCell>
                                    <TableCell>
                                        <Button asChild size="sm" intent="ghost">
                                            <Link href={`/admin/orders/${order.id}`}>View</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
