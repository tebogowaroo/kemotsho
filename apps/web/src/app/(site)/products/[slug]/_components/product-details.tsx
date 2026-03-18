"use client"

import { Product } from "@kemotsho/module-commerce/products/domain/Product"
import { Badge } from "@/shared/ui/atoms/badge"
import { Button } from "@/shared/ui/atoms/button"
import { Label } from "@/shared/ui/atoms/label"
import { Separator } from "@/shared/ui/atoms/separator"
import { Schema } from "effect"
import { useState, useMemo } from "react"
import { cn, formatCurrency } from "@kemotsho/core/lib/utils"
import { useCart } from "@/components/providers/cart-provider"
import { ShoppingCart, Check } from "lucide-react"

interface ProductDetailsProps {
    product: Schema.Schema.Encoded<typeof Product>
}

export function ProductDetails({ product }: ProductDetailsProps) {
    // Initialize selections with first option of each variant if available
    const [selections, setSelections] = useState<Record<string, string>>(() => {
        const defaults: Record<string, string> = {}
        if (product.variants) {
            product.variants.forEach(v => {
                if (v.options.length > 0) {
                    defaults[v.name] = v.options[0]!
                }
            })
        }
        return defaults
    })

    const handleSelect = (variantName: string, option: string) => {
        setSelections(prev => ({ ...prev, [variantName]: option }))
    }

    // Resolve Price, SKU, Current Stock Status based on overrides
    const { price, stockStatus, sku, isPurchasable, variantId, stockQuantity } = useMemo(() => {
        let currentPrice = product.price
        let currentStatus = product.stockStatus
        let currentQuantity = product.stockQuantity // Base quantity
        let _currentSku = product.sku
        let _variantId: string | undefined = undefined

        // Check for overrides
        if (product.variantOverrides && product.variantOverrides.length > 0) {
            const match = product.variantOverrides
                .filter(override => {
                    return Object.entries(override.selections).every(([key, value]) => {
                        return selections[key] === value
                    })
                })
                .sort((a, b) => {
                    return Object.keys(b.selections).length - Object.keys(a.selections).length
                })[0]

            if (match) {
                if (match.price !== null && match.price !== undefined) currentPrice = match.price
                if (match.stockStatus !== null && match.stockStatus !== undefined) currentStatus = match.stockStatus
                if (match.sku !== null && match.sku !== undefined) _currentSku = match.sku
                if (match.stockQuantity !== null && match.stockQuantity !== undefined) currentQuantity = match.stockQuantity
                _variantId = match.id
            }
        }

        return {
            price: currentPrice,
            stockStatus: currentStatus,
            stockQuantity: currentQuantity,
            sku: _currentSku,
            isPurchasable: product.isPurchasable,
            variantId: _variantId
        }
    }, [product, selections])


    let addToCart: any = () => {}
    let cartAvailable = false
    try {
        const cart = useCart()
        addToCart = cart.addToCart
        cartAvailable = true
    } catch {
       // Commerce disabled
    }

    const [added, setAdded] = useState(false)

    const handleAddToCart = () => {
        if (!cartAvailable) return
        if (price === null || price === undefined) return
        // Don't add if out of stock (unless pre-order/backorder logic overrides this, but simple check first)
        if (stockQuantity <= 0 && stockStatus !== "pre_order") return 

        addToCart(product as any, 1, selections, price, variantId)
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">{product.title}</h1>
                {sku && (
                    <p className="text-muted-foreground mt-2 font-mono text-sm">SKU: {sku}</p>
                )}
            </div>

            <div className="flex items-center gap-4">
                {price !== null && price !== undefined ? (
                    <div className="text-3xl font-bold">
                        {formatCurrency(price)}
                    </div>
                ) : (
                    <div className="text-2xl font-semibold text-muted-foreground">Contact for Price</div>
                )}
                
                {!isPurchasable && (
                    <Badge variant="secondary">Catalog Mode</Badge>
                )}
                
                {stockStatus === "out_of_stock" && <Badge variant="destructive">Out of Stock</Badge>}
                {stockStatus === "pre_order" && <Badge variant="outline" className="border-blue-500 text-blue-500">Pre-Order</Badge>}
                {stockStatus === "discontinued" && <Badge variant="secondary">Discontinued</Badge>}
            </div>

            <div className="prose prose-stone dark:prose-invert max-w-none text-muted-foreground">
                {product.description && <p>{product.description}</p>}
            </div>

            {/* Variant Selectors */}
            {product.variants && product.variants.length > 0 && (
                <div className="space-y-4 pt-2">
                    {product.variants.map((variant) => (
                        <div key={variant.name}>
                            <Label className="text-base mb-2 block">{variant.name}</Label>
                            <div className="flex flex-wrap gap-2">
                                {variant.options.map((option) => {
                                    const isSelected = selections[variant.name] === option
                                    return (
                                        <button
                                            key={option}
                                            onClick={() => handleSelect(variant.name, option)}
                                            className={cn(
                                                "inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                                                isSelected 
                                                    ? "border-primary bg-primary text-primary-foreground shadow-sm" 
                                                    : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                                            )}
                                        >
                                            {option}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Separator />

            <div className="flex flex-col sm:flex-row gap-4">
                {cartAvailable && isPurchasable && stockStatus !== "out_of_stock" && stockStatus !== "discontinued" ? (
                   <>
                        <Button 
                            size="lg" 
                            className="w-full sm:w-auto text-lg px-8 gap-2" 
                            onClick={handleAddToCart}
                            disabled={added || price === null || price === undefined || (stockQuantity <= 0 && stockStatus !== "pre_order")}
                        >
                            {added ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                            {added ? "Added" : (stockQuantity <= 0 && stockStatus !== "pre_order" ? "Out of Stock" : "Add to Cart")}
                        </Button>
                        
                        {product.buyLink && (
                             <Button intent="outline" size="lg" className="w-full sm:w-auto" asChild>
                                <a href={product.buyLink} target="_blank" rel="noopener noreferrer">
                                    Buy Externally
                                </a>
                            </Button>
                        )}
                   </>
                ) : (
                    <Button size="lg" className="w-full sm:w-auto" asChild>
                        <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || "sales@example.com"}?subject=Inquiry about ${product.title} (${Object.entries(selections).map(([k,v]) => `${k}:${v}`).join(', ')})`}>
                            Contact Sales
                        </a>
                    </Button>
                )}
            </div>

             {/* Specifications */}
             {product.specifications && product.specifications.length > 0 && (
                <div className="mt-8 pt-8 border-t">
                    <h2 className="text-xl font-semibold mb-4">Specifications</h2>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        {product.specifications.map((spec, i) => (
                            <div key={i} className="flex justify-between sm:grid sm:grid-cols-2 py-2 border-b sm:border-0 border-dashed">
                                <dt className="text-sm font-medium text-muted-foreground">{spec.label}</dt>
                                <dd className="text-sm text-foreground sm:text-right">{spec.value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            )}
        </div>
    )
}
