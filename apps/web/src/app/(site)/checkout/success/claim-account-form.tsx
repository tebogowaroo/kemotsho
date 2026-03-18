"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "@kemotsho/core/infra/firebase/client"
import { claimGuestAccountAction } from "@/app/actions/auth"
import { Button } from "@/shared/ui/atoms/button"
import { Input } from "@kemotsho/core/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@kemotsho/core/ui/card"
import { Label } from "@kemotsho/core/ui/label"
import { Loader2 } from "lucide-react"

export function ClaimAccountForm({ email, customerId }: { email: string, customerId: string }) {
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleClaim = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // 1. Create Auth User
            const cred = await createUserWithEmailAndPassword(auth, email, password)
            const token = await cred.user.getIdToken()

            // 2. Claim Account Server Action
            const result = await claimGuestAccountAction({
                idToken: token,
                customerId
            })

            if (result.success) {
                router.refresh()
                router.push("/account/orders")
            } else {
                throw new Error(result.error || "Failed to claim account")
            }
        } catch (error: any) {
            console.error(error)
            // Ideally use a toast here
            alert(error.message || "Failed to create account")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="max-w-md mx-auto mt-8 text-left bg-muted/50 border-dashed border-2">
            <CardHeader>
                <CardTitle>Checkout complete! Create your account?</CardTitle>
                <CardDescription>
                    Set a password to save your information and track your order.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleClaim}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={email} disabled className="bg-background text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Choose Password</Label>
                        <Input 
                            id="password" 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder="Min. 6 characters"
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Account
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
