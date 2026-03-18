"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { Product } from "@kemotsho/module-commerce/products/domain/Product"
// import { Schema } from "effect" // If needed for validation

// Simplified Cart Item for Client
export interface CartItem {
    id: string // product id + variant hash
    productId: string
    productTitle: string
    sku?: string | undefined // Added
    price: number // cents
    image?: string | undefined
    quantity: number
    variant?: Record<string, string> | undefined // e.g. { Size: "L" }
    variantId?: string | undefined
}

interface CartContextType {
    items: CartItem[]
    addToCart: (product: Product, quantity: number, variant?: Record<string, string>, priceOverride?: number, variantId?: string) => void
    removeFromCart: (itemId: string) => void
    updateQuantity: (itemId: string, quantity: number) => void
    clearCart: () => void
    
    // Derived
    subtotal: number
    count: number
    
    // UI State
    isOpen: boolean
    setIsOpen: (val: boolean) => void
    isLoaded: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    console.log("CartProvider mounting");
    const [items, setItems] = useState<CartItem[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem("waroo_cart")
        if (saved) {
            try {
                setItems(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to load cart", e)
            }
        }
        setIsLoaded(true)
    }, [])

    // Save to local storage on change
    useEffect(() => {
        if (!isLoaded) return
        localStorage.setItem("waroo_cart", JSON.stringify(items))
    }, [items, isLoaded])

    const addToCart = (product: Product, quantity: number, variant?: Record<string, string>, priceOverride?: number, variantId?: string) => {
        // Create unique ID based on product and variants
        const variantKey = variant ? JSON.stringify(variant) : ""
        const itemId = `${product.id}-${variantKey}`

        setItems(prev => {
            const existing = prev.find(p => p.id === itemId)
            
            // Use override if provided, else base
            let finalPrice = priceOverride !== undefined ? priceOverride : (product.price || 0)
            
            // Defensively handle Option-like objects in price
            if (typeof finalPrice === 'object' && finalPrice !== null && "value" in finalPrice) {
                finalPrice = (finalPrice as any).value ?? 0;
            }
            if (typeof finalPrice !== 'number') {
                finalPrice = 0;
            }

            // Normalize SKU helper
            const getSku = (val: any) => {
                if (!val) return undefined;
                if (typeof val === 'string') return val;
                if (typeof val === 'object' && "value" in val) return val.value;
                return undefined;
            }
            const sku = getSku(product.sku);

            if (existing) {
                // If adding same item, should we update price? Maybe. 
                // Let's assume price consistency for same variant.
                return prev.map(p => p.id === itemId
                    ? { ...p, quantity: p.quantity + quantity, sku, variantId } 
                    : p
                )
            }
            return [...prev, { 
                id: itemId,
                productId: String(product.id),
                productTitle: product.title,
                sku,
                price: finalPrice,
                image: product.images?.[0],
                quantity, 
                variant,
                variantId
            } as CartItem]
        })
        setIsOpen(true)
    }

    const removeFromCart = useCallback((itemId: string) => {
        setItems(prev => prev.filter(item => item.id !== itemId))
    }, [])

    const updateQuantity = useCallback((itemId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(itemId)
            return
        }
        setItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity } : item))
    }, [removeFromCart])
    
    const clearCart = useCallback(() => setItems([]), [])

    // Calculate subtotal in cents
    const subtotal = items.reduce((acc, item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0)
        return acc + (!Number.isNaN(itemTotal) ? itemTotal : 0)
    }, 0)

    return (
        <CartContext.Provider value={{ 
            items, addToCart, removeFromCart, updateQuantity, clearCart, 
            subtotal, count: items.length, isOpen, setIsOpen, isLoaded
        }}>
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => {
    const context = useContext(CartContext)
    if (!context) {
        console.error("useCart failed: Context is missing");
        throw new Error("useCart must be used within CartProvider")
    }
    return context
}
