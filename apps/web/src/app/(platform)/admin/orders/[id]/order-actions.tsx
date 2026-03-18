"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateOrderStatusAction, addTrackingAction } from "@/app/actions/admin-orders"
import { Button } from "@/shared/ui/atoms/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@kemotsho/core/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@kemotsho/core/ui/dialog"
import { Input } from "@kemotsho/core/ui/input"
import { Label } from "@kemotsho/core/ui/label"
import { Loader2, Truck } from "lucide-react"
import { OrderStatus } from "@kemotsho/module-commerce/orders/domain/Order"

interface OrderActionsProps {
    orderId: string
    currentStatus: string // simplified for client prop
}

export function OrderActions({ orderId, currentStatus }: OrderActionsProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isTrackingOpen, setIsTrackingOpen] = useState(false)
    
    // Tracking Form
    const [carrier, setCarrier] = useState("")
    const [trackingCode, setTrackingCode] = useState("")

    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === "shipped") {
            // Status transition to Shipped should ideally be done via the Tracking Dialog
            // checking if user selected "shipped" from dropdown
            setIsTrackingOpen(true)
            return
        }

        setIsLoading(true)
        try {
            const res = await updateOrderStatusAction(orderId, newStatus)
            if (res.success) {
                router.refresh()
            } else {
                alert("Failed: " + res.error)
            }
        } catch (e) {
            console.error(e)
            alert("Error updating status")
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddTracking = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const res = await addTrackingAction(orderId, carrier, trackingCode)
            if (res.success) {
                setIsTrackingOpen(false)
                router.refresh()
            } else {
                alert("Failed: " + res.error)
            }
        } catch (e) {
             console.error(e)
             alert("Error adding tracking")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
               <div className="w-[200px]">
                <Select 
                    defaultValue={currentStatus} 
                    onValueChange={handleStatusChange} 
                    disabled={isLoading}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pending_payment">Pending Payment</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                </Select>
               </div>
               
               {/* Separate Button for Tracking for visibility */}
               {currentStatus !== "shipped" && currentStatus !== "delivered" && (
                   <Button intent="outline" size="icon" onClick={() => setIsTrackingOpen(true)} title="Add Tracking">
                       <Truck className="h-4 w-4" />
                   </Button>
               )}
            </div>

            <Dialog open={isTrackingOpen} onOpenChange={setIsTrackingOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark as Shipped</DialogTitle>
                        <DialogDescription>
                            Enter tracking information to fulfill this order.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddTracking} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="carrier">Courier / Carrier</Label>
                            <Input 
                                id="carrier" 
                                placeholder="DHL, FedEx, etc." 
                                value={carrier} 
                                onChange={e => setCarrier(e.target.value)}
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tracking">Tracking Code</Label>
                            <Input 
                                id="tracking" 
                                placeholder="Tracking Number" 
                                value={trackingCode} 
                                onChange={e => setTrackingCode(e.target.value)}
                                required 
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" intent="outline" onClick={() => setIsTrackingOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm Shipment
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
