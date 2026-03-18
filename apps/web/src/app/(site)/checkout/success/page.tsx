import { getPostPurchaseInfo } from "@/app/actions/checkout-success"
import { Button } from "@/shared/ui/atoms/button"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { ClaimAccountForm } from "./claim-account-form"
import { CartCleaner } from "./cart-cleaner"

export default async function CheckoutSuccessPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams
    const orderId = typeof params.orderId === "string" ? params.orderId : undefined
    
    let claimInfo = null

    if (orderId) {
        claimInfo = await getPostPurchaseInfo(orderId).catch(err => {
            console.error("Failed to fetch post-purchase info:", err)
            return null
        })
    }

    return (
        <div className="container py-24 flex flex-col items-center justify-center text-center space-y-6">
            <CartCleaner />
            
            <CheckCircle2 className="h-24 w-24 text-green-500" />
            <h1 className="text-4xl font-bold">Order Confirmed!</h1>
            <p className="text-xl text-muted-foreground max-w-md">
                Thank you for your purchase. We have received your payment and will begin processing your order immediately.
            </p>
            
            <div className="flex gap-4">
                <Button asChild intent="outline">
                    <Link href="/products">Continue Shopping</Link>
                </Button>
            </div>

            {/* Post-Purchase Claim Flow */}
            {claimInfo && claimInfo.isGuest && claimInfo.customerId && claimInfo.email && (
                <ClaimAccountForm 
                    email={claimInfo.email} 
                    customerId={claimInfo.customerId} 
                />
            )}
        </div>
    )
}
