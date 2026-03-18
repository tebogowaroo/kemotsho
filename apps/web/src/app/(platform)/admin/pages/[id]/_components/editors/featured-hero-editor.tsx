"use client"

import { FeaturedProductsHeroSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"
import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import { ProductPicker } from "@/app/(platform)/admin/products/_components/product-picker"

interface FeaturedHeroEditorProps {
    section: Schema.Schema.Encoded<typeof FeaturedProductsHeroSection>
    onChange: (data: Schema.Schema.Encoded<typeof FeaturedProductsHeroSection>["data"]) => void
}

export function FeaturedHeroEditor({ section, onChange }: FeaturedHeroEditorProps) {
    const update = (key: keyof typeof section.data, value: any) => {
        onChange({ ...section.data, [key]: value })
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Section Title (Optional)</Label>
                    <Input 
                        value={section.data.title || ""} 
                        onChange={(e) => update("title", e.target.value || null)}
                        placeholder="e.g. Featured Collection"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Section Subtitle (Optional)</Label>
                    <Input 
                        value={section.data.subtitle || ""} 
                        onChange={(e) => update("subtitle", e.target.value || null)}
                        placeholder="e.g. Hand-picked items just for you"
                    />
                </div>
            </div>
            
            <div className="space-y-2">
                <Label>Selected Products</Label>
                <ProductPicker 
                    selectedIds={[...(section.data.productIds || [])]}
                    onSelectionChange={(ids) => update("productIds", ids)}
                    maxSelection={3}
                />
            </div>
        </div>
    )
}
