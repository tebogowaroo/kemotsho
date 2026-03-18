import { OrderStatus } from "@kemotsho/module-commerce/orders/domain/Order"
import { Check, Clock, Package, Truck } from "lucide-react"

interface OrderStatusBarProps {
    status: string
}

const STEPS = [
    { id: "pending_payment", label: "Ordered", icon: Clock },
    { id: "processing", label: "Processing", icon: Package },
    { id: "shipped", label: "Shipped", icon: Truck },
    { id: "delivered", label: "Delivered", icon: Check },
]

export function OrderStatusBar({ status }: OrderStatusBarProps) {
    if (status === "cancelled" || status === "refunded") {
        return (
            <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="font-bold">!</span>
                </div>
                <div className="font-medium capitalize">Order {status}</div>
            </div>
        )
    }

    // Determine current index
    // Note: status might be "pending_payment", but we want to show it as active or completed depending on perspective.
    // Let's simplify: 
    // pending_payment -> Ordered (Active)
    // processing -> Ordered (Done) -> Processing (Active)
    
    const getCurrentIndex = (s: string) => {
        const idx = STEPS.findIndex(step => step.id === s)
        return idx
    }

    const currentIdx = getCurrentIndex(status)
    // If not found (e.g. unknown status), default to 0
    const activeIndex = currentIdx === -1 ? 0 : currentIdx

    return (
        <div className="w-full py-6">
            <div className="relative flex justify-between items-center">
                {/* Connecting Line background */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2 rounded-full" />
                
                {/* Active Line (Progress) - width based on percentage */}
                <div 
                    className="absolute top-1/2 left-0 h-1 bg-green-500 -z-10 -translate-y-1/2 rounded-full transition-all duration-500"
                    style={{ width: `${(activeIndex / (STEPS.length - 1)) * 100}%` }}
                />

                {STEPS.map((step, i) => {
                    const Icon = step.icon
                    const isCompleted = i <= activeIndex
                    const isCurrent = i === activeIndex
                    
                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2">
                            <div className={`
                                h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors
                                ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-300'}
                            `}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <span className={`text-xs font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
