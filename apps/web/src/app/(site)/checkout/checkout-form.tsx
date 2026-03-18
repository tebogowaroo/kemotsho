"use client"

import { useCart } from "@/components/providers/cart-provider"
import { Button } from "@/shared/ui/atoms/button"
import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/atoms/card"
import { Separator } from "@/shared/ui/atoms/separator"
import { useState, useEffect } from "react"
import { placeOrderAction, calculateCartAction } from "@/app/actions/checkout" // We need to create this
import { Loader2, Tag } from "lucide-react"
import { Customer } from "@kemotsho/module-commerce/customers/domain/Customer"
import { Schema } from "effect"
import Link from "next/link"

export interface CheckoutUser {
    uid: string
    email?: string
}

interface CheckoutFormProps {
    user: CheckoutUser | null
    customer: Schema.Schema.Encoded<typeof Customer> | null
}

import { formatCurrency } from "@/lib/format"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/atoms/select"

export function CheckoutForm({ user, customer }: CheckoutFormProps) {
    let cart;
    try {
        cart = useCart()
    } catch (e) {
        console.error("CheckoutForm: Context missing", e)
        // Fallback for missing cart
        cart = { items: [], subtotal: 0, count: 0, total: 0, shipping: 0, discount: 0 }
    }
    const { items, subtotal, count } = cart
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Resolve initial address (Default or Last Used)
    const initialAddress = customer?.defaultShippingAddress 
        || (customer?.addresses && customer.addresses.length > 0 ? customer.addresses[customer.addresses.length - 1] : null)

    // Form State (Simplified for now)
    const [formData, setFormData] = useState({
        firstName: customer?.firstName || initialAddress?.firstName || "",
        lastName: customer?.lastName || initialAddress?.lastName || "",
        email: user?.email || customer?.email || "",
        phone: customer?.phone || initialAddress?.phone || "",
        line1: initialAddress?.line1 || "",
        city: initialAddress?.city || "",
        postalCode: initialAddress?.postalCode || "",
        country: initialAddress?.country || "ZA"
    })
    
    // DEBUG: Check what we received in Client
    console.log("CheckoutForm Client Mount:", { customer, initialAddress, formData })
    
    // Sync state if customer loads late (or hydration mismatch fix)
    useEffect(() => {
        if (customer) {
            const addr = customer.defaultShippingAddress 
                || (customer.addresses && customer.addresses.length > 0 ? customer.addresses[customer.addresses.length - 1] : null)
             
            // console.log("CheckoutForm Hydration Sync Addr:", addr)   
            setFormData(prev => ({
                ...prev,
                // Prioritize Address Book over Customer Profile for Shipping Fields if available
                firstName: addr?.firstName || customer.firstName || prev.firstName,
                lastName: addr?.lastName || customer.lastName || prev.lastName,
                phone: addr?.phone || customer.phone || prev.phone,
                
                // Address fields
                line1: addr?.line1 || prev.line1,
                city: addr?.city || prev.city,
                postalCode: addr?.postalCode || prev.postalCode,
                country: addr?.country || prev.country || "ZA"
            }))
        }
    }, [customer])

    // Coupon State
    const [couponCode, setCouponCode] = useState("")
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
    const [discountAmount, setDiscountAmount] = useState(0)
    const [serverTotals, setServerTotals] = useState<{shipping: number, total: number} | null>(null)
    const [couponError, setCouponError] = useState<string | null>(null)
    const [isCheckingCoupon, setIsCheckingCoupon] = useState(false)

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsCheckingCoupon(true)
        setCouponError(null)
        
        try {
            const res = await calculateCartAction({
                items: items.map(i => ({ productId: i.productId, quantity: i.quantity, variantId: i.variantId })),
                couponCode: couponCode
            })
            
            if (res.success) {
                if (res.data.couponApplied) {
                    console.log('res.data  ==> ',res.data);
                    
                    setAppliedCoupon(couponCode)
                    setDiscountAmount(res.data.discount)
                    setServerTotals({ shipping: res.data.shipping, total: res.data.total })
                } else {
                     setCouponError("Coupon invalid or conditions not met")
                }
            } else {
                setCouponError(res.error)
            }
        } catch (e) {
            setCouponError("Failed to apply coupon")
        } finally {
            setIsCheckingCoupon(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        try {
            // Hardcoded fallback if serverTotals (pre-calc) not done, but ideally we trust serverTotals if coupon applied
            // But if coupon NOT applied, we keep logic consistent
            const shippingCost = serverTotals ? serverTotals.shipping : (subtotal >= 100000 ? 0 : 10000) 
            const tax = 0 
            // NOTE: placeOrderAction will recalculate EVERYTHING securely. We just pass values for logging mainly.
            // But validation schema might expect them to match roughly.
            // We pass the couponCode now!
            
            const res = await placeOrderAction({
                userId: user?.uid || null, 
                items: items.map(i => ({
                    productId: i.productId,
                    title: i.productTitle,
                    sku: i.sku || null,
                    variantId: i.variantId || null,
                    variantName: null, // Could populate if we had it, but null is safe
                    quantity: i.quantity,
                    priceAtPurchase: i.price,
                    total: i.price * i.quantity,
                    options: i.variant || null,
                    image: i.image || null
                })),
                shippingAddress: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    company: null,
                    line1: formData.line1,
                    line2: null,
                    city: formData.city,
                    state: null,
                    postalCode: formData.postalCode,
                    country: formData.country,
                    phone: formData.phone,
                    email: formData.email
                },
                paymentMethod: (process.env.NEXT_PUBLIC_STORE_CURRENCY || "ZAR") === "ZAR" ? "payfast" : "stripe",
                currency: process.env.NEXT_PUBLIC_STORE_CURRENCY || "ZAR",
                subtotal,
                shippingCost,
                tax,
                total: serverTotals ? serverTotals.total : (subtotal + shippingCost),
                contactEmail: formData.email,
                couponCode: appliedCoupon || undefined
            })

            if (res.success) {
                const init = res.data
                 if (init.kind === "redirect") {
                    window.location.href = init.url
                } else if (init.kind === "form-post") {
                    // Construct hidden form and submit
                    const form = document.createElement("form")
                    form.method = "POST"
                    form.action = init.url
                    
                    Object.entries(init.data).forEach(([key, val]) => {
                        const input = document.createElement("input")
                        input.type = "hidden"
                        input.name = key
                        input.value = String(val)
                        form.appendChild(input)
                    })

                    document.body.appendChild(form)
                    form.submit()
                }
            } else {
                 setError(res.error || "Failed to place order")
                 setIsSubmitting(false)
            }

        } catch (err) {
            console.error(err)
            setError("Unexpected error occurred")
            setIsSubmitting(false)
        }
    }

    if (count === 0) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
                <p className="text-muted-foreground mb-8">Add some products to get started.</p>
                <Button asChild>
                    <a href="/products">Browse Products</a>
                </Button>
            </div>
        )
    }

    const shippingDisplay = subtotal > 100000 ? "Free" : "R 150.00"

    return (
        <div className="container py-10">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>
            
            {!user && (
                 <div className="mb-8 p-4 border rounded-lg bg-muted/30 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="font-semibold">Already have an account?</h3>
                        <p className="text-sm text-muted-foreground">Log in to check out faster with your saved details.</p>
                    </div>
                    <Button intent="outline" asChild>
                        <Link href="/login?redirect=/checkout">Log In / Register</Link>
                    </Button>
                </div>
            )}
            
            <div className="grid gap-8 md:grid-cols-[1fr_400px]">
                {/* Forms */}
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Shipping Information</CardTitle>
                            <CardDescription>Where should we send your order?</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input id="firstName" name="firstName" required value={formData.firstName} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input id="lastName" name="lastName" required value={formData.lastName} onChange={handleChange} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" name="phone" required value={formData.phone} onChange={handleChange} />
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <Label htmlFor="line1">Address (Line 1)</Label>
                                    <Input id="line1" name="line1" placeholder="Street address" required value={formData.line1} onChange={handleChange} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input id="city" name="city" required value={formData.city} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="postalCode">{formData.country === "US" ? "Zip Code" : "Postal Code"}</Label>
                                        <Input id="postalCode" name="postalCode" required value={formData.postalCode} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                     <Label htmlFor="country">Country</Label>
                                     <Select 
                                         value={formData.country} 
                                         onValueChange={(val) => setFormData(p => ({ ...p, country: val }))}
                                     >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ZA">South Africa</SelectItem>
                                            <SelectItem value="US">United States</SelectItem>
                                            <SelectItem value="GB">United Kingdom</SelectItem>
                                            <SelectItem value="AU">Australia</SelectItem>
                                            <SelectItem value="CA">Canada</SelectItem>
                                            <SelectItem value="DE">Germany</SelectItem>
                                            <SelectItem value="NG">Nigeria</SelectItem>
                                            <SelectItem value="KE">Kenya</SelectItem>
                                        </SelectContent>
                                     </Select>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Method</CardTitle>
                        </CardHeader>
                        <CardContent>
                             {/* Payment method is selected automatically based on currency now, but we can show what will happen */}
                            <div className="flex items-center gap-4 border p-4 rounded-md bg-muted/20">
                                <div className="w-4 h-4 rounded-full bg-primary" />
                                <span className="font-semibold">
                                    {process.env.NEXT_PUBLIC_STORE_CURRENCY === "ZAR" ? "PayFast" : "Credit Card (Stripe)"}
                                </span>
                                <span className="text-muted-foreground text-sm ml-auto">
                                    {process.env.NEXT_PUBLIC_STORE_CURRENCY === "ZAR" ? "Credit Card, EFT, Zapper" : "Secure Payment"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Summary */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {items.map(item => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span>{item.productTitle} x {item.quantity}</span>
                                    <span>{formatCurrency(item.price * item.quantity)}</span>
                                </div>
                            ))}
                            <Separator />
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            
                            {/* Coupon Input */}
                            <div className="py-2 space-y-2">
                                {!appliedCoupon ? (
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="Promo Code" 
                                            value={couponCode} 
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            className="h-9"
                                        />
                                        <Button 
                                            type="button" 
                                            intent="outline" 
                                            size="sm"
                                            onClick={handleApplyCoupon}
                                            disabled={!couponCode || isCheckingCoupon}
                                        >
                                            {isCheckingCoupon ? <Loader2 className="h-4 w-4 animate-spin"/> : "Apply"}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex justify-between text-green-600 items-center bg-green-50 p-2 rounded text-sm">
                                        <span className="flex items-center gap-2"><Tag className="w-3 h-3"/> Code: {appliedCoupon}</span>
                                        <Button intent="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => { setAppliedCoupon(null); setDiscountAmount(0); setServerTotals(null); }}>Remove</Button>
                                    </div>
                                )}
                                {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                            </div>

                            {discountAmount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(discountAmount)}</span>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span>{serverTotals ? formatCurrency(serverTotals.shipping) : (subtotal >= 100000 ? "Free" : formatCurrency(10000))}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{serverTotals ? formatCurrency(serverTotals.total) : formatCurrency(subtotal + (subtotal >= 100000 ? 0 : 10000))}</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            {error && <p className="text-destructive text-sm mb-4 w-full text-center">{error}</p>}
                            <Button className="w-full" size="lg" type="submit" form="checkout-form" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Pay & Complete Order"
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}
