import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/atoms/card"
import { Activity, CreditCard, DollarSign, Users, ArrowUpRight } from "lucide-react"
import { getDashboardStatsAction } from "@/app/actions/dashboard"
import { Exit } from "effect"
import { formatCurrency } from "@kemotsho/core/lib/utils"
import Link from "next/link"
import { Button } from "@/shared/ui/atoms/button"
import { Avatar, AvatarFallback } from "@/shared/ui/atoms/avatar"

export default async function DashboardPage() {
  const result = await getDashboardStatsAction()
  
  const stats = Exit.isSuccess(result) ? result.value : {
    totalRevenue: 0,
    ordersCount: 0,
    averageOrderValue: 0,
    recentSales: []
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Orders
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ordersCount}</div>
            <p className="text-xs text-muted-foreground">
              Total orders placed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Based on paid orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Real-time users
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Recent orders from your store.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/admin/orders">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
             <div className="space-y-8">
                {stats.recentSales.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
                {stats.recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback>{sale.customerName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">{sale.customerName}</p>
                            <p className="text-sm text-muted-foreground">{sale.email}</p>
                        </div>
                        <div className="ml-auto font-medium">
                            {formatCurrency(sale.amount)}
                        </div>
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button asChild intent="outline" className="w-full justify-start">
               <Link href="/admin/products/new">Add Product</Link>
            </Button>
            <Button asChild intent="outline" className="w-full justify-start">
               <Link href="/admin/orders">Process Orders</Link>
            </Button>
             <Button asChild intent="outline" className="w-full justify-start">
               <Link href="/">View Store</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
