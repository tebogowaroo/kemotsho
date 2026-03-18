
"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/atoms/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/shared/ui/atoms/dropdown-menu"
import { Button } from "@/shared/ui/atoms/button"
import { Badge } from "@/shared/ui/atoms/badge"
import { MoreHorizontal, Trash, Ban, CheckCircle } from "lucide-react"
import { deleteCouponAction, toggleCouponAction } from "@/app/actions/marketing"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface EncodedCoupon {
    id: string
    code: string
    description: string | null
    discountType: "percentage" | "fixed_amount"
    value: number
    minSpend: number | null
    expiresAt: string | null
    usageLimit: number | null
    usageCount: number
    isActive: boolean
}

interface CouponListProps {
    coupons: EncodedCoupon[]
}

export function CouponList({ coupons }: CouponListProps) {
    const router = useRouter()

    const handleToggle = async (id: string, currentStatus: boolean) => {
        const res = await toggleCouponAction(id, !currentStatus)
        if (res.success) {
            toast.success(currentStatus ? "Coupon deactivated" : "Coupon activated")
            router.refresh()
        } else {
            toast.error("Action failed")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this coupon permanently?")) return
        const res = await deleteCouponAction(id)
        if (res.success) {
            toast.success("Coupon deleted")
            router.refresh()
        } else {
            toast.error("Action failed")
        }
    }

    return (
        <div className="rounded-md border">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="w-[50px]"></TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {coupons.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No coupons found.
                    </TableCell>
                </TableRow>
            ) : (
                coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                        <TableCell className="font-medium">
                            <div className="flex flex-col">
                                <span>{coupon.code}</span>
                                {coupon.description && <span className="text-xs text-muted-foreground">{coupon.description}</span>}
                            </div>
                        </TableCell>
                        <TableCell>
                            {coupon.discountType === "percentage" 
                                ? `${coupon.value}% Off` 
                                : `R${(coupon.value / 100).toFixed(0)} Off`
                            }
                            {coupon.minSpend && (
                                <div className="text-xs text-muted-foreground">
                                    Min: R{(coupon.minSpend / 100).toFixed(0)}
                                </div>
                            )}
                        </TableCell>
                        <TableCell>
                            {coupon.usageCount} 
                            {coupon.usageLimit && <span className="text-muted-foreground"> / {coupon.usageLimit}</span>}
                        </TableCell>
                        <TableCell>
                            <Badge variant={coupon.isActive ? "default" : "secondary"}>
                                {coupon.isActive ? "Active" : "Inactive"}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            {coupon.expiresAt 
                                ? new Date(coupon.expiresAt).toLocaleDateString() 
                                : <span className="text-muted-foreground">-</span>
                            }
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button intent="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleToggle(coupon.id, coupon.isActive)}>
                                        {coupon.isActive ? <Ban className="mr-2 h-4 w-4"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                                        {coupon.isActive ? "Deactivate" : "Activate"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDelete(coupon.id)} className="text-red-600">
                                        <Trash className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))
            )}
            </TableBody>
        </Table>
        </div>
    )
}
