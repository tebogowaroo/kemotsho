import { verifySession } from "@kemotsho/core/lib/auth-dal"
import { redirect, notFound } from "next/navigation"
import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { Effect, Exit, Option } from "effect"
import { OrderRepository } from "@kemotsho/module-commerce/orders/domain/OrderRepository"
import { FirebaseOrderRepositoryLive } from "@kemotsho/module-commerce/orders/infrastructure/FirebaseOrderRepository"
import { getTenantConfig } from "@kemotsho/core/config/tenant"
import { DownloadPackingSlip } from "./download-packing-slip"

// Helper to fetch order for admin only
async function getOrder(orderId: string) {
    const program = Effect.gen(function* (_) {
        const orderRepo = yield* _(OrderRepository)
        return yield* _(orderRepo.getById(orderId)) 
    })

    const runnable = program.pipe(
        Effect.provide(FirebaseOrderRepositoryLive)
    )

    return await AppRuntime.runPromiseExit(runnable)
}

function safeString(val: any): string {
    if (!val) return "";
    if (Option.isOption(val)) return String(Option.getOrNull(val) ?? "");
    return String(val);
}

export default async function PackingSlipPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await verifySession()
    
    // Strict Admin Check
    if (!session || session.role !== "admin") {
        redirect("/login")
    }

    const result = await getOrder(id)
    if (Exit.isFailure(result)) {
        return notFound()
    }

    const order = result.value
    const config = getTenantConfig()
    const now = new Date()

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

    // Serialize for client component
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
             // Handle Option or raw value
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

    return (
        <div className="bg-white min-h-screen p-8 print:p-0 text-black">
            <div className="max-w-4xl mx-auto mb-6 flex justify-end print:hidden">
                <DownloadPackingSlip order={serializedOrder} config={serializedConfig} />
            </div>
            
            <div className="max-w-4xl mx-auto border border-gray-200 p-8 print:border-0 print:p-0 bg-white shadow-sm print:shadow-none">
                {/* Header */}
                <div className="flex justify-between items-start mb-12 border-b border-gray-100 pb-8">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">PACKING SLIP</h1>
                        <p className="text-gray-500 font-mono">#{order.orderNumber}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="font-bold text-xl mb-1">{config.name || "Waroo Store"}</h2>
                        <div className="text-sm text-gray-500 space-y-1">
                            {config.contact.email && <p>{config.contact.email}</p>}
                            {config.contact.phone && <p>{config.contact.phone}</p>}
                        </div>
                    </div>
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-2 gap-12 mb-12">
                     <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Ship To</h3>
                        <div className="text-sm leading-relaxed">
                            <p className="font-bold text-gray-900">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                            <p>{order.shippingAddress.line1}</p>
                            <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                            <p>{order.shippingAddress.country}</p>
                            {order.shippingAddress.phone && <p className="mt-2 text-gray-500">{order.shippingAddress.phone}</p>}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Order Details</h3>
                        <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
                            <span className="text-gray-500">Order Date:</span>
                            <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                            
                            <span className="text-gray-500">Service:</span>
                            <span className="font-medium capitalize">Standard Shipping</span>
                            
                            <span className="text-gray-500">Status:</span>
                            <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-xs inline-block w-fit uppercase tracking-tighter">
                                {order.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-12">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="text-left py-3 text-xs font-bold uppercase tracking-wider w-32">SKU</th>
                            <th className="text-left py-3 text-xs font-bold uppercase tracking-wider">Item Description</th>
                            <th className="text-center py-3 text-xs font-bold uppercase tracking-wider w-24">Qty</th>
                            <th className="text-center py-3 text-xs font-bold uppercase tracking-wider w-24">Check</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {order.items.map((item, i) => {
                             const variantName = safeString(item.variantName)
                             const sku = safeString(item.sku)

                             return (
                                <tr key={i} className="text-sm">
                                    <td className="py-4 font-mono text-gray-600">{sku || "N/A"}</td>
                                    <td className="py-4">
                                        <div className="font-medium text-gray-900">{item.title}</div>
                                        {variantName && (
                                            <div className="text-gray-500 text-xs mt-1">Variant: {variantName}</div>
                                        )}
                                        {/* Render Raw Options if no Name */}
                                        {!variantName && Option.isOption(item.options) && Option.getOrNull(item.options) && (
                                            <div className="text-gray-500 text-xs mt-1">
                                                {Object.entries(Option.getOrNull(item.options)!).map(([k,v]) => `${k}: ${v}`).join(", ")}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-4 text-center font-bold text-lg">{item.quantity}</td>
                                    <td className="py-4 text-center">
                                        <div className="w-6 h-6 border-2 border-gray-300 rounded mx-auto"></div>
                                    </td>
                                </tr>
                             )
                        })}
                    </tbody>
                </table>

                {/* Footer Notes */}
                <div className="bg-gray-50 p-6 flex justify-between items-end rounded-lg print:bg-transparent print:p-0 print:border print:border-gray-200">
                    <div className="text-sm text-gray-500 max-w-md">
                        <p className="font-semibold text-gray-900 mb-1">Notes to Packer:</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Please verify quantity matches packing slip.</li>
                            <li>Check for any visible damage before packing.</li>
                            <li>Include return instructions if applicable.</li>
                        </ul>
                    </div>
                    
                    <div className="text-right">
                        <div className="w-64 border-b border-black mb-2"></div>
                        <p className="text-xs uppercase tracking-wider font-semibold">Packed By</p>
                    </div>
                </div>

                <div className="mt-12 text-center text-xs text-gray-400 print:mt-auto print:pt-8">
                     <p>Page 1 of 1</p>
                     <p>Generated on {new Date().toLocaleString()}</p>
                </div>
            </div>
            
            <style type="text/css" media="print">{`
                @page { size: portrait; margin: 20mm; }
            `}</style>
        </div>
    )
}
