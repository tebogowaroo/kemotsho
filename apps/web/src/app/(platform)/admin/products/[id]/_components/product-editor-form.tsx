"use client"

import { Product } from "@kemotsho/module-commerce/products/domain/Product"
import { Button } from "@/shared/ui/atoms/button"
import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import { Textarea } from "@/shared/ui/atoms/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/atoms/card"
import { Switch } from "@/shared/ui/atoms/switch" // Use our wrapper
import { MediaPicker } from "@/app/(platform)/admin/media/_components/media-picker"
import { updateProductAction } from "@/app/actions/products"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Trash2, Plus, X } from "lucide-react"
import Link from "next/link"
import { Schema } from "effect"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/atoms/select"
import { Badge } from "@/shared/ui/atoms/badge"
import { Separator } from "@/shared/ui/atoms/separator"

interface ProductEditorFormProps {
    product: Schema.Schema.Encoded<typeof Product>
}

export function ProductEditorForm({ product }: ProductEditorFormProps) {
    // Initialize form state with Decimals instead of Cents
    const [data, setData] = useState(() => ({
        ...product,
        // Convert stored Cents to Decimals for Editing
        price: product.price != null ? product.price / 100 : null,
        variantOverrides: product.variantOverrides ? product.variantOverrides.map(ov => ({
            ...ov,
            price: ov.price != null ? ov.price / 100 : null
        })) : []
    }))
    const [isSaving, setIsSaving] = useState(false)
    const router = useRouter()

    const update = (key: keyof typeof data, value: any) => {
        setData(prev => ({ ...prev, [key]: value }))
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Convert Decimals back to Cents for Saving
            const payload = {
                ...data,
                price: data.price !== null ? Math.round(data.price * 100) : null,
                variantOverrides: data.variantOverrides?.map(ov => ({
                    ...ov,
                    price: ov.price !== null ? Math.round(ov.price * 100) : null
                }))
            }

            const res = await updateProductAction(product.id, payload)
            if (res.success) {
                router.refresh()
                // Could show toast
            } else {
                alert("Failed to save")
            }
        } catch (e) {
            console.error(e)
            alert("Error saving")
        } finally {
            setIsSaving(false)
        }
    }

    const addImage = (url: string) => {
        update("images", [...data.images, url])
    }

    const removeImage = (index: number) => {
        const newImages = [...data.images]
        newImages.splice(index, 1)
        update("images", newImages)
    }

    const addSpecification = () => {
        const specs = data.specifications || []
        update("specifications", [...specs, { label: "", value: "" }])
    }

    const removeSpecification = (index: number) => {
        const specs = [...(data.specifications || [])]
        specs.splice(index, 1)
        update("specifications", specs)
    }

    const updateSpecification = (index: number, field: "label" | "value", value: string) => {
        const specs = [...(data.specifications || [])]
        specs[index] = { ...specs[index], [field]: value } as any
        update("specifications", specs)
    }

    const addVariant = () => {
        const variants = data.variants || []
        update("variants", [...variants, { name: "", options: [] }])
    }

    const removeVariant = (index: number) => {
        const variants = [...(data.variants || [])]
        variants.splice(index, 1)
        update("variants", variants)
    }

    const updateVariantName = (index: number, name: string) => {
        const variants = [...(data.variants || [])]
        variants[index] = { ...variants[index], name } as any
        update("variants", variants)
    }

    const addVariantOption = (variantIndex: number, option: string) => {
        if (!option) return
        const variants = [...(data.variants || [])]
        const variant = variants[variantIndex]
        if (!variant) return

        const currentOptions = variant.options || []
        if (!currentOptions.includes(option)) {
            variants[variantIndex] = { ...variant, options: [...currentOptions, option] } as any
            update("variants", variants)
        }
    }

    const removeVariantOption = (variantIndex: number, optionIndex: number) => {
        const variants = [...(data.variants || [])]
        const variant = variants[variantIndex]
        if (!variant) return

        const currentOptions = [...(variant.options || [])]
        currentOptions.splice(optionIndex, 1)
        variants[variantIndex] = { ...variant, options: currentOptions } as any
        update("variants", variants)
    }

    const addOverride = () => {
        const overrides = data.variantOverrides || []
        update("variantOverrides", [...overrides, { id: crypto.randomUUID(), selections: {}, price: null, sku: null, stockStatus: null, stockQuantity: null }])
    }

    const removeOverride = (index: number) => {
        const overrides = [...(data.variantOverrides || [])]
        overrides.splice(index, 1)
        update("variantOverrides", overrides)
    }

    const updateOverrideSelection = (index: number, variantName: string, optionValue: string) => {
        const overrides = [...(data.variantOverrides || [])]
        const override = overrides[index]
        if (!override) return

        const currentSelections = { ...override.selections }
        
        if (optionValue === "__ANY__") {
            delete currentSelections[variantName]
        } else {
            currentSelections[variantName] = optionValue
        }
        
        overrides[index] = { ...override, selections: currentSelections } as any
        update("variantOverrides", overrides)
    }

    const updateOverrideField = (index: number, field: "price" | "sku" | "stockStatus" | "stockQuantity", value: any) => {
        const overrides = [...(data.variantOverrides || [])]
        const override = overrides[index]
        if (!override) return

        overrides[index] = { ...override, [field]: value } as any
        update("variantOverrides", overrides)
    }

    return (
         <div className="space-y-6 max-w-5xl mx-auto pb-20">
            <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <Button intent="ghost" size="icon" asChild>
                        <Link href="/admin/products">
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button intent="outline" asChild>
                        <Link href="/admin/products">Discard</Link>
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
                
                {/* Main Content */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Details</CardTitle>
                            <CardDescription>Basic information about your product.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Title</Label>
                                <Input 
                                    value={data.title}
                                    onChange={(e) => update("title", e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Slug</Label>
                                <Input 
                                    value={data.slug}
                                    onChange={(e) => update("slug", e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Input 
                                    value={data.category || ""} 
                                    onChange={(e) => update("category", e.target.value)} 
                                    placeholder="e.g. Mens, Electronics"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Textarea 
                                    value={data.description || ""}
                                    onChange={(e) => update("description", e.target.value)}
                                    className="min-h-[150px]"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Images</CardTitle>
                            <CardDescription>Product gallery images.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                {data.images.map((url, i) => (
                                    <div key={i} className="relative group aspect-square border rounded-md overflow-hidden bg-muted">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt="" className="object-cover w-full h-full" />
                                        <Button
                                            intent="ghost"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-destructive hover:text-white"
                                            onClick={() => removeImage(i)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="aspect-square flex items-center justify-center border border-dashed rounded-md bg-muted/20">
                                     <MediaPicker 
                                        onSelect={(file) => addImage(file.url)}
                                        trigger={
                                            <Button intent="ghost" className="h-full w-full flex flex-col gap-2">
                                                <Plus className="h-6 w-6" />
                                                <span>Add Image</span>
                                            </Button>
                                        }
                                     />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="space-y-1.5">
                                <CardTitle>Specifications</CardTitle>
                                <CardDescription>Technical details like dimensions, weight, material.</CardDescription>
                            </div>
                            <Button intent="outline" size="sm" onClick={addSpecification}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Spec
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {(data.specifications || []).length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">No specifications added.</p>
                            )}
                            {(data.specifications || []).map((spec, i) => (
                                <div key={i} className="flex gap-2 items-start">
                                    <Input 
                                        placeholder="Label (e.g. Weight)" 
                                        value={spec.label}
                                        onChange={(e) => updateSpecification(i, "label", e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input 
                                        placeholder="Value (e.g. 1.5 kg)" 
                                        value={spec.value}
                                        onChange={(e) => updateSpecification(i, "value", e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button intent="ghost" size="icon" onClick={() => removeSpecification(i)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="space-y-1.5">
                                <CardTitle>Variants</CardTitle>
                                <CardDescription>Options like Size, Color, Capacity.</CardDescription>
                            </div>
                            <Button intent="outline" size="sm" onClick={addVariant}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Variant
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {(data.variants || []).length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">No variants added.</p>
                            )}
                            {(data.variants || []).map((variant, i) => (
                                <div key={i} className="border rounded-md p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="grid gap-1.5 flex-1 max-w-sm">
                                            <Label>Variant Name</Label>
                                            <Input 
                                                placeholder="e.g. Color" 
                                                value={variant.name}
                                                onChange={(e) => updateVariantName(i, e.target.value)}
                                            />
                                        </div>
                                        <Button intent="ghost" size="sm" className="text-destructive" onClick={() => removeVariant(i)}>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Remove
                                        </Button>
                                    </div>
                                    
                                    <div>
                                        <Label className="mb-2 block">Options</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(variant.options || []).map((option, j) => (
                                                <Badge key={j} variant="secondary" className="pl-2 pr-1 py-1 h-8">
                                                    {option}
                                                    <Button intent="ghost" size="icon" className="h-4 w-4 ml-1 hover:bg-transparent" onClick={() => removeVariantOption(i, j)}>
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Input 
                                                placeholder={`Add ${variant.name || "option"}...`}
                                                className="max-w-xs"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault()
                                                        addVariantOption(i, e.currentTarget.value)
                                                        e.currentTarget.value = ""
                                                    }
                                                }}
                                            />
                                            <Button 
                                                intent="secondary" 
                                                onClick={(e) => {
                                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement
                                                    addVariantOption(i, input.value)
                                                    input.value = ""
                                                }}
                                            >
                                                Add
                                            </Button>
                                        </div>
                                        <p className="text-[0.8rem] text-muted-foreground mt-1.5">
                                            Type and press Enter to add an option.
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Variant Overrides */}
                    {(data.variants || []).length > 0 && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="space-y-1.5">
                                    <CardTitle>Variant Overrides</CardTitle>
                                    <CardDescription>Set specific price, SKU, or stock status for variant combinations.</CardDescription>
                                </div>
                                <Button intent="outline" size="sm" onClick={addOverride}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Override
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {(data.variantOverrides || []).length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">No overrides added. Standard price applies to all.</p>
                                )}
                                {(data.variantOverrides || []).map((override, i) => (
                                    <div key={i} className="border rounded-md p-4 space-y-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-medium text-sm">Override #{i + 1}</h4>
                                            <Button intent="ghost" size="sm" className="text-destructive h-8" onClick={() => removeOverride(i)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                            {/* Selectors for Variants */}
                                            {data.variants.map((v) => (
                                                <div key={v.name} className="space-y-1.5">
                                                    <Label className="text-xs">{v.name}</Label>
                                                    <Select 
                                                        value={override.selections[v.name] || "__ANY__"} 
                                                        onValueChange={(val) => updateOverrideSelection(i, v.name, val)}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue placeholder="Any" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="__ANY__">Any {v.name}</SelectItem>
                                                            {v.options.map((opt) => (
                                                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            ))}
                                        </div>

                                        <Separator className="my-2" />

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Override Price (R)</Label>
                                                <Input 
                                                    type="number" 
                                                    step="0.01"
                                                    className="h-8 text-xs" 
                                                    placeholder="Default"
                                                    value={override.price ?? ""}
                                                    onChange={(e) => updateOverrideField(i, "price", e.target.value ? parseFloat(e.target.value) : null)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Override SKU</Label>
                                                <Input 
                                                    className="h-8 text-xs" 
                                                    placeholder="Default"
                                                    value={override.sku || ""}
                                                    onChange={(e) => updateOverrideField(i, "sku", e.target.value || null)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Override Quantity</Label>
                                                <Input 
                                                    type="number"
                                                    className="h-8 text-xs" 
                                                    placeholder="Default"
                                                    value={override.stockQuantity ?? ""}
                                                    onChange={(e) => updateOverrideField(i, "stockQuantity", e.target.value ? parseInt(e.target.value) : null)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Override Stock</Label>
                                                <Select 
                                                    value={override.stockStatus || "__DEFAULT__"} 
                                                    onValueChange={(v) => updateOverrideField(i, "stockStatus", v === "__DEFAULT__" ? null : v)}
                                                >
                                                     <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="Default" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__DEFAULT__">Use Default</SelectItem>
                                                        <SelectItem value="in_stock">In Stock</SelectItem>
                                                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                                                        <SelectItem value="pre_order">Pre-Order</SelectItem>
                                                        <SelectItem value="discontinued">Discontinued</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="flex flex-col gap-1">
                                    <span>Published</span>
                                    <span className="font-normal text-xs text-muted-foreground">Visible on the site</span>
                                </Label>
                                <Switch 
                                    checked={data.isPublished}
                                    onCheckedChange={(c) => update("isPublished", c)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                         <CardHeader>
                            <CardTitle>Pricing & Inventory</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Stock Status</Label>
                                <Select 
                                    value={data.stockStatus} 
                                    onValueChange={(v) => update("stockStatus", v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="in_stock">In Stock</SelectItem>
                                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                                        <SelectItem value="pre_order">Pre-Order</SelectItem>
                                        <SelectItem value="discontinued">Discontinued</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Stock Quantity</Label>
                                <Input 
                                    type="number"
                                    value={data.stockQuantity ?? 0}
                                    onChange={(e) => update("stockQuantity", e.target.value ? parseInt(e.target.value) : 0)}
                                    placeholder="0"
                                />
                            </div>

                             <div className="grid gap-2">
                                <Label>SKU</Label>
                                <Input 
                                    value={data.sku || ""}
                                    onChange={(e) => update("sku", e.target.value)}
                                    placeholder="e.g. PROD-001"
                                />
                            </div>

                             <div className="flex items-center justify-between pt-2">
                                <Label className="flex flex-col gap-1">
                                    <span>Purchasable</span>
                                    <span className="font-normal text-xs text-muted-foreground">Show "Buy" button</span>
                                </Label>
                                <Switch 
                                    checked={data.isPurchasable}
                                    onCheckedChange={(c) => update("isPurchasable", c)}
                                />
                            </div>
                            
                            {/* Only show price if we want to display it or if it is purchasable */}
                            <div className="grid gap-2">
                                <Label>Price (R)</Label>
                                <Input 
                                    type="number"
                                    step="0.01"
                                    value={data.price ?? ""}
                                    onChange={(e) => update("price", e.target.value ? parseFloat(e.target.value) : null)}
                                    placeholder="0.00"
                                />
                                <p className="text-xs text-muted-foreground">Leave empty to show "Contact for Price"</p>
                            </div>

                            <div className="grid gap-2">
                                <Label>Buy / Payment Link</Label>
                                <Input 
                                    value={data.buyLink || ""}
                                    onChange={(e) => update("buyLink", e.target.value)}
                                    placeholder="https://buy.stripe.com/..."
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
         </div>
    )
}
