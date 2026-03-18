
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/atoms/card"
import { getCouponsAction } from "@/app/actions/marketing"
import { CouponList } from "./_components/coupon-list"
import { CreateCouponDialog } from "./_components/create-coupon-dialog"

export const dynamic = "force-dynamic"

export default async function MarketingPage() {
  const { success, data } = await getCouponsAction()
  
  // Ensure array is returned, otherwise empty array
  const coupons = (success && Array.isArray(data)) ? data : []
  
  const activeCount = coupons.filter((c: any) => c.isActive).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Marketing</h1>
        <CreateCouponDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Coupons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              {coupons.length} total codes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coupons</CardTitle>
          <CardDescription>
            Manage your discount codes and promotions.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <CouponList coupons={coupons as any} />
        </CardContent>
      </Card>
    </div>
  )
}

