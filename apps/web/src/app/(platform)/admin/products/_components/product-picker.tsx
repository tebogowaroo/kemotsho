"use client"

import { useState, useEffect } from "react"
import { Product } from "@kemotsho/module-commerce/products/domain/Product"
import { Schema } from "effect"
import { listProductsAction } from "@/app/actions/products"
import { Check, X } from "lucide-react"
import { cn } from "@kemotsho/core/lib/utils"
import { Badge } from "@/shared/ui/atoms/badge"
import { Button } from "@/shared/ui/atoms/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@kemotsho/core/ui/command" // Assuming standard shadcn command
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@kemotsho/core/ui/popover" // Assuming standard shadcn popover

interface ProductPickerProps {
    selectedIds: string[]
    onSelectionChange: (ids: string[]) => void
    maxSelection?: number
}

// We need a lightweight representation for the picker, or we can fetch full products.
// For now, let's fetch all and filter client side for simplicity given likely catalog size.
// If large, we'd make a search endpoint.

export function ProductPicker({ selectedIds, onSelectionChange, maxSelection = 3 }: ProductPickerProps) {
    const [open, setOpen] = useState(false)
    const [products, setProducts] = useState<Schema.Schema.Encoded<typeof Product>[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true)
            const res = await listProductsAction()
            if (res.success) {
                setProducts([...res.data])
            }
            setLoading(false)
        }
        fetchProducts()
    }, [])

    const handleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
             onSelectionChange(selectedIds.filter(prevId => prevId !== id))
        } else {
            if (selectedIds.length >= maxSelection) return;
            onSelectionChange([...selectedIds, id])
        }
    }

    const selectedProducts = products.filter(p => selectedIds.includes(p.id))

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
                {selectedProducts.map(p => (
                    <Badge key={p.id} variant="secondary" className="pl-2 pr-1 h-8">
                        {p.title}
                        <Button 
                            intent="ghost" 
                            size="icon" 
                            className="h-4 w-4 ml-2 hover:bg-transparent"
                            onClick={() => handleSelect(p.id)}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                ))}
            </div>
            
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        intent="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                        disabled={selectedIds.length >= maxSelection}
                    >
                        {selectedIds.length >= maxSelection 
                            ? "Selection limit reached" 
                            : "Select product..."}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search products..." />
                        <CommandList>
                            <CommandEmpty>No product found.</CommandEmpty>
                            <CommandGroup heading="Suggestions">
                                {loading && <CommandItem disabled>Loading...</CommandItem>}
                                {!loading && products.map((product) => (
                                    <CommandItem
                                        key={product.id}
                                        value={product.title}
                                        onSelect={() => {
                                            handleSelect(product.id)
                                            // Keep open for multiple selection
                                        }}
                                        disabled={selectedIds.length >= maxSelection && !selectedIds.includes(product.id)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedIds.includes(product.id) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {product.title}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
                Selected {selectedIds.length} of {maxSelection}
            </p>
        </div>
    )
}
