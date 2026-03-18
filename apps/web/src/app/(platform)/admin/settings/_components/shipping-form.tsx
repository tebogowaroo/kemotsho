
"use client"

import { useState } from "react"
import { Button } from "@/shared/ui/atoms/button"
import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import { updateShippingRuleAction } from "@/app/actions/settings"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface ShippingFormProps {
    initialData: {
        baseCost: number
        freeThreshold: number | null
    }
}

export function ShippingForm({ initialData }: ShippingFormProps) {
    const [baseCost, setBaseCost] = useState(initialData.baseCost / 100) // Display Rands
    const [freeThreshold, setFreeThreshold] = useState(initialData.freeThreshold ? initialData.freeThreshold / 100 : "")
    const [isSaving, setIsSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const result = await updateShippingRuleAction({
                baseCost: Math.round(Number(baseCost) * 100), // Convert to cents
                freeThreshold: freeThreshold === "" ? null : Math.round(Number(freeThreshold) * 100)
            })

            if (result.success) {
                toast.success("Shipping settings updated")
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="base-cost">Base Shipping Cost (ZAR)</Label>
                <Input 
                    id="base-cost" 
                    type="number"
                    step="0.01"
                    value={baseCost}
                    onChange={(e) => setBaseCost(Number(e.target.value))}
                    required
                />
                <p className="text-[0.8rem] text-muted-foreground">Standard flat rate for all orders.</p>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="free-threshold">Free Shipping Threshold (ZAR)</Label>
                <Input 
                    id="free-threshold" 
                    type="number" 
                    step="0.01"
                    placeholder="Leave empty for no free shipping"
                    value={freeThreshold}
                    onChange={(e) => setFreeThreshold(e.target.value)}
                />
                <p className="text-[0.8rem] text-muted-foreground">Orders above this amount get free shipping.</p>
            </div>
            
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </form>
    )
}
