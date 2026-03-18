import { verifySession } from "@kemotsho/core/lib/auth-dal"
import { redirect, notFound } from "next/navigation"
import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { Effect, Exit, Option, Layer } from "effect"
import { OrderRepository } from "@kemotsho/module-commerce/orders/domain/OrderRepository"
import { FirebaseOrderRepositoryLive } from "@kemotsho/module-commerce/orders/infrastructure/FirebaseOrderRepository"
import { getTenantConfig } from "@kemotsho/core/config/tenant"
import { formatCurrency } from "@kemotsho/core/lib/utils"
import { CustomerRepository } from "@kemotsho/module-commerce/customers/domain/Customer"
import { FirebaseCustomerRepositoryLive } from "@kemotsho/module-commerce/customers/infrastructure/FirebaseCustomerRepository"
import { DownloadInvoice } from "./download-invoice"

// Helper to fetch valid invoice
async function getInvoiceOrder(orderId: string, userId: string, role?: string) {
    const program = Effect.gen(function* (_) {
        const orderRepo = yield* _(OrderRepository)
        const order = yield* _(orderRepo.getById(orderId))

        // Access Control
        // 1. Admin? Allow.
        if (role === "admin") return order

        // 2. Direct Owner (if order has userId)? Allow.
        // Option.getOrNull helper needed if using Option
        const orderUserId = "_tag" in order.userId ? (order.userId as any).value : order.userId
        if (orderUserId === userId) return order

        // 3. Customer Owner (Indirect)
        // If order doesn't have userId (Guest checkout), we check via Customer profile
        const customerRepo = yield* _(CustomerRepository)
        const customer = yield* _(customerRepo.getByUserId(userId))
        
        if (order.customerId === customer.id) return order

        return yield* _(Effect.fail(new Error("Unauthorized")))
    })

    const OrderSystemLive = Layer.merge(
        FirebaseOrderRepositoryLive,
        FirebaseCustomerRepositoryLive
    )

    const runnable = program.pipe(
        Effect.provide(OrderSystemLive)
    )

    return await AppRuntime.runPromiseExit(runnable)
}

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
        if ("value" in value && value.value !== value) { 
             return safeRender(value.value);
        }
        
        // 3. Date objects
        if (value instanceof Date) {
            return value.toLocaleString();
        }

        // 4. Unknown Objects - Do NOT return "[object Object]"
        return null;
    }
    
    return String(value);
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await verifySession()

    if (!session) {
        redirect(`/login?redirect=/account/orders/${id}/invoice`)
    }

    const result = await getInvoiceOrder(id, session.userId, session.role)

    if (Exit.isFailure(result)) {
        notFound() // Or generic "Unauthorized"
    }

    const order = result.value
    const config = getTenantConfig()

    const unwrap = (val: any) => Option.isOption(val) ? Option.getOrNull(val) : val;

    const serializeAddress = (addr: any) => {
        if (!addr) return null;
        return {
            ...addr,
            company: unwrap(addr.company),
            line2: unwrap(addr.line2),
            state: unwrap(addr.state)
        };
    };

    // Serialize for Client Component (Handle Options & Dates)
    const serializedOrder = {
        ...order,
        createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
        updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : order.updatedAt,
        userId: unwrap(order.userId),
        couponCode: unwrap(order.couponCode),
        shippingAddress: serializeAddress(order.shippingAddress),
        billingAddress: serializeAddress(unwrap(order.billingAddress)),
        paymentGatewayRef: unwrap(order.paymentGatewayRef),
        fulfillment: (() => {
             const val = unwrap(order.fulfillment);
             if (!val) return null;
             return {
                 ...val,
                 shippedAt: val.shippedAt instanceof Date ? val.shippedAt.toISOString() : val.shippedAt
             }
        })(),
        items: order.items.map((item: any) => ({
            ...item,
            sku: unwrap(item.sku),
            variantId: unwrap(item.variantId),
            variantName: unwrap(item.variantName),
            options: unwrap(item.options),
            image: unwrap(item.image)
        }))
    }

    // TenantConfig is a Class, need to unwrap to plain object
    const serializedConfig = { ...config }

    // Tax Label Logic
    const calculatedTotalWithTax = order.subtotal + order.shippingCost + order.tax;
    // If Total matches Sum(Sub+Ship+Tax), then Tax was added on top (Exclusive)
    const isExclusiveTax = Math.abs(calculatedTotalWithTax - order.total) < 0.05;
    const taxLabel = isExclusiveTax 
        ? (config.tax.label || "VAT") 
        : `${config.tax.label || "VAT"} (incl.)`;

    return (
        <div className="bg-white min-h-screen text-black p-8 print:p-0">
            {/* Action Bar */}
            <div className="max-w-[210mm] mx-auto mb-8 flex justify-end print:hidden">
                <DownloadInvoice order={serializedOrder} config={serializedConfig} />
            </div>

            <div className="max-w-[210mm] mx-auto space-y-8 border p-8 shadow-sm print:shadow-none print:border-0">
                {/* Header */}
                <div className="flex justify-between items-start border-b pb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 uppercase tracking-wide">Invoice</h1>
                        <p className="text-gray-500">#{order.orderNumber}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="font-bold text-xl">{config.name}</h2>
                        <div className="text-sm text-gray-500 mt-2 space-y-1">
                            {config.contact.address && <p>{config.contact.address}</p>}
                            {config.contact.email && <p>{config.contact.email}</p>}
                            {config.contact.phone && <p>{config.contact.phone}</p>}
                        </div>
                    </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <h3 className="uppercase text-xs font-bold text-gray-400 mb-2">Bill To</h3>
                        <div className="text-sm">
                            <p className="font-bold">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                            {/* Simple address formatting */}
                            <p>{order.shippingAddress.line1}</p>
                            {safeRender(order.shippingAddress.line2) && <p>{safeRender(order.shippingAddress.line2)}</p>}
                            <p>{order.shippingAddress.city}, {safeRender(order.shippingAddress.state)} {order.shippingAddress.postalCode}</p>
                            <p>{order.shippingAddress.country}</p>
                            <p className="mt-2">{order.shippingAddress.email}</p>
                        </div>
                    </div>
                    <div className="text-right space-y-2 text-sm">
                        <div className="flex justify-between md:justify-end md:gap-8">
                            <span className="text-gray-500">Invoice Date:</span>
                            <span>{order.createdAt.toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between md:justify-end md:gap-8">
                            <span className="text-gray-500">Payment Method:</span>
                            <span className="capitalize">{order.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between md:justify-end md:gap-8">
                            <span className="text-gray-500">Status:</span>
                            <span className="capitalize">{order.status.replace("_", " ")}</span>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="text-left py-3">Description</th>
                            <th className="text-right py-3 w-24">Qty</th>
                            <th className="text-right py-3 w-32">Price</th>
                            <th className="text-right py-3 w-32">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item, i) => (
                            <tr key={i} className="border-b border-gray-100">
                                <td className="py-3">
                                    <p className="font-medium">{item.title}</p>
                                    <p className="text-gray-500 text-xs">{safeRender(item.sku)}</p>
                                </td>
                                <td className="text-right py-3 text-gray-500">{item.quantity}</td>
                                <td className="text-right py-3 text-gray-500">{formatCurrency(item.priceAtPurchase)}</td>
                                <td className="text-right py-3 font-medium">{formatCurrency(item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end pt-4">
                    <div className="w-64 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Shipping</span>
                            <span>{formatCurrency(order.shippingCost)}</span>
                        </div>
                        {order.tax > 0 && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">{taxLabel}</span>
                                <span>{formatCurrency(order.tax)}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-black pt-2 text-base font-bold">
                            <span>Total</span>
                            <span>{formatCurrency(order.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t pt-8 mt-12 text-center text-xs text-gray-500 print:fixed print:bottom-8 print:left-0 print:right-0">
                    <p>Thank you for your business!</p>
                    <p>If you have any questions about this invoice, please contact {config.contact.email}.</p>
                </div>
            </div>
        </div>
    )
}
