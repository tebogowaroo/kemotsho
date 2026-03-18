"use client"

import { Product } from "@kemotsho/module-commerce/products/domain/Product"
import { Schema } from "effect"
import { useState } from "react"
import { Button } from "@/shared/ui/atoms/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/shared/ui/atoms/card"
import { Badge } from "@/shared/ui/atoms/badge"
import Link from "next/link"
import { cn, formatCurrency } from "@kemotsho/core/lib/utils"

type ProductType = Schema.Schema.Encoded<typeof Product>

interface ProductFilterableListProps {
    products: ProductType[]
    showFilterBar: boolean
    showPrices: boolean
    showBuyButton: boolean
}

export function ProductFilterableList({ products, showFilterBar, showPrices, showBuyButton }: ProductFilterableListProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("All")

    // Extract unique categories
    const categories = ["All", ...new Set(products.map(p => p.category).filter((c): c is string => !!c))]

    // Filter logic
    const filteredProducts = selectedCategory === "All" 
        ? products 
        : products.filter(p => p.category === selectedCategory)

    if (products.length === 0) return null

    return (
        <div className="space-y-8">
            {/* Filter Bar */}
            {showFilterBar && categories.length > 1 && ( // Only show if we have categories
                <div className="flex flex-wrap justify-center gap-2">
                    {categories.map(cat => (
                        <Button
                            key={cat}
                            intent={selectedCategory === cat ? "primary" : "outline"}
                            onClick={() => setSelectedCategory(cat)}
                            className="rounded-full"
                        >
                            {cat}
                        </Button>
                    ))}
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                    <Card key={product.id} className="flex flex-col h-full overflow-hidden border transition-all hover:border-primary/50">
                        {product.images?.[0] && (
                            <div className="aspect-[4/3] bg-muted relative overflow-hidden group">
                                <img 
                                    src={product.images[0]} 
                                    alt={product.title}
                                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                />
                                {product.category && (
                                    <Badge variant="secondary" className="absolute top-2 left-2 opacity-90">
                                        {product.category}
                                    </Badge>
                                )}
                            </div>
                        )}
                        <CardHeader>
                            <h3 className="text-xl font-bold line-clamp-1">{product.title}</h3>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <p className="text-muted-foreground line-clamp-2 text-sm">{product.description}</p>
                        </CardContent>
                        {(showPrices || showBuyButton) && (
                            <CardFooter className="flex items-center justify-between border-t pt-4">
                                {showPrices && product.price !== null && (
                                    <span className="font-bold text-lg">
                                        {formatCurrency(product.price)}
                                    </span>
                                )}
                                <div className="ml-auto">
                                    {showBuyButton && product.isPurchasable && product.buyLink ? (
                                        <Button size="sm" asChild>
                                            <a href={product.buyLink} target="_blank" rel="noopener noreferrer">
                                                Buy Now
                                            </a>
                                        </Button>
                                    ) : (
                                        <Button size="sm" intent="outline" asChild>
                                            <Link href={`/products/${product.slug}`}>
                                                View Details
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </CardFooter>
                        )}
                    </Card>
                ))}
            </div>
            
            {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No products found in this category.
                </div>
            )}
        </div>
    )
}
