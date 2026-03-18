"use client"

import { useCart } from "@/components/providers/cart-provider"
import { Button } from "@/shared/ui/atoms/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/shared/ui/atoms/sheet"
import { Separator } from "@/shared/ui/atoms/separator"
import { Minus, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
// eslint-disable-next-line @next/next/no-img-element
import Image from "next/image"
import { formatCurrency } from "@kemotsho/core/lib/utils"

export function CartSheet() {
    const { items, isOpen, setIsOpen, updateQuantity, removeFromCart, subtotal } = useCart()
    const router = useRouter()

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetContent className="w-full sm:max-w-md flex flex-col h-full">
                <SheetHeader>
                    <SheetTitle>Your Cart ({items.length})</SheetTitle>
                    <SheetDescription>Review your items before checkout.</SheetDescription>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto py-6 -mx-6 px-6">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <p className="text-muted-foreground">Your cart is empty.</p>
                            <Button intent="outline" onClick={() => setIsOpen(false)}>Continue Shopping</Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.productTitle}
                                                className="h-full w-full object-cover object-center"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-secondary text-xs text-muted-foreground">
                                                No Img
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col">
                                        <div>
                                            <div className="flex justify-between text-base font-medium text-foreground">
                                                <h3 className="line-clamp-2 leading-tight">
                                                    <Link href={`/products/${item.productId}`} onClick={() => setIsOpen(false)}>
                                                        {item.productTitle}
                                                    </Link>
                                                </h3>
                                                <p className="ml-4">{formatCurrency(item.price)}</p>
                                            </div>
                                            {item.variant && (
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(", ")}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-1 items-end justify-between text-sm">
                                            <div className="flex items-center gap-2 border rounded-md p-1">
                                                <button 
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="p-1 hover:bg-accent rounded"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="w-4 text-center">{item.quantity}</span>
                                                <button 
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="p-1 hover:bg-accent rounded"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeFromCart(item.id)}
                                                className="font-medium text-destructive hover:text-destructive/80 flex items-center gap-1"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Remove</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="border-t pt-6 space-y-4">
                        <div className="flex justify-between text-base font-medium text-foreground">
                            <p>Subtotal</p>
                            <p>{formatCurrency(subtotal)}</p>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Shipping and taxes calculated at checkout.
                        </p>
                        <SheetFooter className="flex-col sm:flex-col gap-2">
                             <Button className="w-full" size="lg" onClick={() => {
                                router.push("/checkout")
                                setIsOpen(false)
                             }}>
                                Checkout
                            </Button>
                            <Button intent="outline" className="w-full" onClick={() => setIsOpen(false)}>
                                Continue Shopping
                            </Button>
                        </SheetFooter>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}
