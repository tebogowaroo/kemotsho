"use client"

import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import { Textarea } from "@/shared/ui/atoms/textarea"
import { Switch } from "@/shared/ui/atoms/switch"
import { ProductListSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"

type ProductListData = Schema.Schema.Encoded<typeof ProductListSection>["data"]

interface ProductListEditorProps {
    section: any
    onChange: (data: ProductListData) => void
}

export function ProductListEditor({ section, onChange }: ProductListEditorProps) {
    const data = section.data as ProductListData

    const update = (key: keyof ProductListData, value: any) => {
        onChange({ ...data, [key]: value })
    }

    return (
        <div className="grid gap-6">
            <div className="grid gap-2">
                <Label>Section Title</Label>
                <Input 
                    value={data.title || ""} 
                    onChange={(e) => update("title", e.target.value || null)} 
                    placeholder="e.g. Featured Products"
                />
            </div>
            
            <div className="grid gap-2">
                <Label>Subtitle</Label>
                <Textarea 
                    value={data.subtitle || ""} 
                    onChange={(e) => update("subtitle", e.target.value || null)} 
                    placeholder="e.g. Check out our latest collection"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label>Items Limit</Label>
                    <Input 
                        type="number"
                        value={data.limit || 12} 
                        onChange={(e) => update("limit", parseInt(e.target.value))}
                    />
                </div>
            </div>

            <div className="space-y-4 border rounded-md p-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Display Options</h4>
                
                <div className="flex items-center justify-between">
                    <Label className="flex flex-col gap-1">
                        <span>Show Prices</span>
                        <span className="font-normal text-xs text-muted-foreground">Display product price tag</span>
                    </Label>
                    <Switch 
                        checked={data.showPrices}
                        onCheckedChange={(c) => update("showPrices", c)}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <Label className="flex flex-col gap-1">
                        <span>Show Buy Button</span>
                        <span className="font-normal text-xs text-muted-foreground">Link directly to checkout if available</span>
                    </Label>
                     <Switch 
                        checked={data.showBuyButton}
                        onCheckedChange={(c) => update("showBuyButton", c)}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <Label className="flex flex-col gap-1">
                        <span>Show Category Filter</span>
                        <span className="font-normal text-xs text-muted-foreground">Allow users to filter products by category</span>
                    </Label>
                     <Switch 
                        checked={data.showFilterBar || false}
                        onCheckedChange={(c) => update("showFilterBar", c)}
                    />
                </div>
            </div>
        </div>
    )
}
