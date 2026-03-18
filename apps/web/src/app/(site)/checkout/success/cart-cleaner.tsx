"use client"
import { useCart } from "@/components/providers/cart-provider"
import { useEffect } from "react"

export function CartCleaner() {
    const { clearCart, isLoaded } = useCart()
    useEffect(() => { 
        // We delay slightly to ensure we don't clear before confirmation is visually processed
        // But for now immediate is fine.
        if (isLoaded) {
            clearCart() 
        }
    }, [clearCart, isLoaded])
    return null
}
