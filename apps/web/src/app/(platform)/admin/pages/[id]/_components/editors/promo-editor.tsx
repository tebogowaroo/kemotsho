"use client"

import { PromoSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"
import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import { Switch } from "@/shared/ui/atoms/switch"
import { MediaPicker } from "@/app/(platform)/admin/media/_components/media-picker"

interface PromoEditorProps {
    section: Schema.Schema.Type<typeof PromoSection>
    onChange: (data: Schema.Schema.Type<typeof PromoSection>["data"]) => void
}

export function PromoEditor({ section, onChange }: PromoEditorProps) {
    const update = (key: keyof typeof section.data, value: any) => {
        onChange({ ...section.data, [key]: value })
    }

    // Helper for safe value access since Schema encoded types might differ slightly in runtime
    const data: any = section.data

    return (
        <div className="space-y-6">
            {/* Visibility Controls */}
             <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-base">Active</Label>
                        <p className="text-sm text-muted-foreground">Turn off to hide this section immediately.</p>
                    </div>
                    <Switch
                        checked={data.isActive !== false} // Default true
                        onCheckedChange={(checked) => update("isActive", checked)}
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Visible From (Optional)</Label>
                        <Input 
                            type="datetime-local"
                            value={data.validFrom || ""} 
                            onChange={(e) => update("validFrom", e.target.value)}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label>Visible Until (Optional)</Label>
                        <Input 
                            type="datetime-local"
                            value={data.validUntil || ""} 
                            onChange={(e) => update("validUntil", e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Content Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Title</Label>
                    <Input 
                        value={data.title || ""} 
                        onChange={(e) => update("title", e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Subtitle</Label>
                    <Input 
                        value={data.subtitle || ""} 
                        onChange={(e) => update("subtitle", e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Background Image</Label>
                <div className="flex items-center gap-4">
                     <div className="flex-1 border rounded px-3 py-2 text-sm text-muted-foreground truncate">
                        {data.backgroundId || "No image selected"}
                     </div>
                    <MediaPicker 
                        onSelect={(file) => {
                            update("backgroundId", file.storagePath)
                        }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>CTA Label</Label>
                    <Input 
                        value={data.ctaLabel || ""} 
                        onChange={(e) => update("ctaLabel", e.target.value)}
                    />
                </div>
                 <div className="space-y-2">
                    <Label>CTA Link (Redirect URL)</Label>
                    <Input 
                        value={data.ctaLink || ""} 
                        onChange={(e) => update("ctaLink", e.target.value)}
                        placeholder="/products/something"
                    />
                </div>
            </div>
             
             <div className="flex items-center space-x-4">
                <div className="flex-1">
                    <Label>Full Screen Height</Label>
                    <p className="text-sm text-muted-foreground">If enabled, takes the full height of the viewport.</p>
                </div>
                <Switch
                    checked={data.height === "screen"}
                    onCheckedChange={(checked) => update("height", checked ? "screen" : "auto")}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>Overlay Opacity (%)</Label>
                    <Input 
                        type="number"
                        min="0"
                        max="100"
                        value={data.overlayOpacity ?? 60} 
                        onChange={(e) => update("overlayOpacity", parseInt(e.target.value))}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Text Color</Label>
                     <div className="flex gap-2">
                        <Input 
                            type="color"
                            className="w-12 p-1 h-10"
                            value={data.textColor || "#ffffff"}
                            onChange={(e) => update("textColor", e.target.value)}
                        />
                        <Input 
                            value={data.textColor || "#ffffff"}
                            onChange={(e) => update("textColor", e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
