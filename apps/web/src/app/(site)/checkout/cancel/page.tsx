import { Button } from "@/shared/ui/atoms/button"
import { XCircle } from "lucide-react"
import Link from "next/link"

export default function CheckoutCancelPage() {
    return (
        <div className="container py-24 flex flex-col items-center justify-center text-center space-y-6">
            <XCircle className="h-24 w-24 text-red-500" />
            <h1 className="text-4xl font-bold">Payment Cancelled</h1>
            <p className="text-xl text-muted-foreground max-w-md">
                Your payment was not completed. No charges were made. You can try again or choose a different payment method.
            </p>
            <div className="flex gap-4">
                <Button asChild>
                    <Link href="/checkout">Return to Checkout</Link>
                </Button>
                <Button intent="outline" asChild>
                    <Link href="/products">Continue Shopping</Link>
                </Button>
            </div>
        </div>
    )
}
