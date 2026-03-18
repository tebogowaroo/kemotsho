
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/atoms/card"
import { getAnalyticsDataAction } from "@/app/actions/dashboard"
import { SalesChart, TopProductsChart } from "./_components/analytics-charts"
import { Exit } from "effect"

export default async function AnalyticsPage() {
    const result = await getAnalyticsDataAction()
    
    // Default safe data
    const analytics = Exit.isSuccess(result) ? result.value : {
        salesOverTime: [],
        topProducts: []
    }

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div className="flex items-center">
                 <h1 className="text-lg font-semibold md:text-2xl">Analytics</h1>
            </div>

            <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Sales Over Time</CardTitle>
                        <CardDescription>Daily revenue for the last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {analytics.salesOverTime.length > 0 ? (
                            <SalesChart data={analytics.salesOverTime} />
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                No sales data available matching the criteria.
                            </div>
                        )}
                    </CardContent>
                 </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Top Products</CardTitle>
                        <CardDescription>Most sold items by quantity</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                         {analytics.topProducts.length > 0 ? (
                            <TopProductsChart data={analytics.topProducts} />
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                No product data available.
                            </div>
                        )}
                    </CardContent>
                 </Card>
            </div>
        </main>
    )
}
