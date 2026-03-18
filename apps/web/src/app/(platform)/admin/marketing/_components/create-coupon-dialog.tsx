
"use client"

import { useState } from "react"
import { Button } from "@/shared/ui/atoms/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/atoms/dialog"
import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/atoms/select"
import { Plus, Loader2 } from "lucide-react"
import { createCouponAction } from "@/app/actions/marketing"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function CreateCouponDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  // Method 1: Simple controlled inputs for speed
  const [formData, setFormData] = useState({
      code: "",
      description: "",
      discountType: "percentage",
      value: "", 
      minSpend: "",
      usageLimit: "",
      expiresAt: ""
  })

  const handleChange = (field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)

      try {
          // Validation / Transformation
          const value = Number(formData.value) // If percentage: 15. If fixed: R100 -> 10000
          const finalValue = formData.discountType === "fixed_amount" ? Math.round(value * 100) : value

          if (formData.discountType === "percentage" && (value < 1 || value > 100)) {
              toast.error("Percentage must be between 1 and 100")
              setLoading(false)
              return
          }

          const res = await createCouponAction({
              code: formData.code.toUpperCase(),
              description: formData.description || undefined,
              discountType: formData.discountType as "percentage" | "fixed_amount",
              value: finalValue,
              minSpend: formData.minSpend ? Math.round(Number(formData.minSpend) * 100) : undefined,
              usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
              expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined
          })

          if (res.success) {
              toast.success("Coupon created")
              setOpen(false)
              setFormData({
                  code: "", description: "", discountType: "percentage", value: "", minSpend: "", usageLimit: "", expiresAt: ""
              })
              router.refresh()
          } else {
              toast.error(res.error)
          }
      } catch (error) {
          toast.error("Failed to create coupon")
      } finally {
          setLoading(false)
      }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Coupon
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
            <DialogHeader>
            <DialogTitle>new Coupon</DialogTitle>
            <DialogDescription>
                Create a discount code for your customers.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="code" className="text-right">Code</Label>
                    <Input 
                        id="code" 
                        value={formData.code} 
                        onChange={e => handleChange("code", e.target.value)}
                        className="col-span-3 uppercase" 
                        placeholder="SUMMER25" 
                        required 
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">Type</Label>
                    <Select 
                        value={formData.discountType} 
                        onValueChange={v => handleChange("discountType", v)}
                    >
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Discount Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed_amount">Fixed Amount (ZAR)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="value" className="text-right">Value</Label>
                    <Input 
                        id="value" 
                        type="number"
                        value={formData.value}
                        onChange={e => handleChange("value", e.target.value)}
                        className="col-span-3"
                        placeholder={formData.discountType === "percentage" ? "15" : "100.00"}
                        required
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="minSpend" className="text-right">Min Spend</Label>
                    <Input 
                        id="minSpend" 
                        type="number"
                        value={formData.minSpend}
                        onChange={e => handleChange("minSpend", e.target.value)}
                        className="col-span-3"
                        placeholder="Optional (ZAR)"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="usageLimit" className="text-right">Limit</Label>
                    <Input 
                        id="usageLimit" 
                        type="number"
                        value={formData.usageLimit}
                        onChange={e => handleChange("usageLimit", e.target.value)}
                        placeholder="Max uses (Optional)"
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expiresAt" className="text-right">Expires</Label>
                    <Input 
                        id="expiresAt" 
                        type="date"
                        value={formData.expiresAt}
                        onChange={e => handleChange("expiresAt", e.target.value)}
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="desc" className="text-right">Note</Label>
                    <Input 
                        id="desc" 
                        value={formData.description}
                        onChange={e => handleChange("description", e.target.value)}
                        placeholder="Internal description"
                        className="col-span-3"
                    />
                </div>
            </div>
            <DialogFooter>
            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Code
            </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
