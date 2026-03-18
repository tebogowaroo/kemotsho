import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import { MediaPicker } from "@/app/(platform)/admin/media/_components/media-picker"
import { PageHeaderSection, PageSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/atoms/select"

type PageHeaderData = Extract<Schema.Schema.Encoded<typeof PageSection>, { type: "pageHeader" }>["data"]

interface PageHeaderEditorProps {
    data: PageHeaderData
    onChange: (data: PageHeaderData) => void
}

export function PageHeaderEditor({ data, onChange }: PageHeaderEditorProps) {
    if (!data) return null
    
    const titleVal = data.title || ""
    const subtitleVal = data.subtitle || ""
    const bgVal = data.backgroundId || ""
 
    const update = (patch: Partial<PageHeaderData>) => {
        onChange({ ...data, ...patch })
    }

    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label>Page Title (Optional)</Label>
                <Input 
                    value={titleVal} 
                    onChange={(e) => update({ title: e.target.value || null })} 
                    placeholder="e.g. About Us"
                />
            </div>

             <div className="grid gap-2">
                <Label>Subtitle (Optional)</Label>
                <Input 
                    value={subtitleVal} 
                    onChange={(e) => update({ subtitle: e.target.value || null })} 
                    placeholder="Brief description or tagline"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>CTA Label</Label>
                    <Input 
                        value={data.ctaLabel || ""} 
                        onChange={(e) => update({ ctaLabel: e.target.value || undefined })} 
                        placeholder="e.g. Get Started"
                    />
                </div>
                 <div className="grid gap-2">
                    <Label>CTA Link</Label>
                    <Input 
                        value={data.ctaLink || ""} 
                        onChange={(e) => update({ ctaLink: e.target.value || undefined })} 
                        placeholder="e.g. /contact"
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Text Position</Label>
                <Select
                    value={data.textPosition || "center"}
                    onValueChange={(value: "left" | "center" | "right") => update({ textPosition: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>Text Color</Label>
                    <Input 
                        value={data.textColor || ""} 
                        onChange={(e) => update({ textColor: e.target.value || undefined })} 
                        placeholder="#ffffff or black"
                    />
                </div>
                 <div className="grid gap-2">
                    <Label>Button Color</Label>
                    <Input 
                        value={data.ctaColor || ""} 
                        onChange={(e) => update({ ctaColor: e.target.value || undefined })} 
                        placeholder="#ea580c"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                     <Label>Overlay Opacity (%)</Label>
                     <Input 
                         type="number"
                         min="0"
                         max="100"
                         value={data.overlayOpacity ?? 50} 
                         onChange={(e) => update({ overlayOpacity: Number(e.target.value) })} 
                     />
                </div>
                 <div className="grid gap-2">
                     <Label>Text Max Width (px)</Label>
                     <Input 
                         type="number"
                         min="0"
                         value={data.textMaxWidth || ""} 
                         onChange={(e) => update({ textMaxWidth: Number(e.target.value) || undefined })} 
                         placeholder="e.g. 800"
                     />
                </div>
            </div>
            
             <div className="grid gap-2">
                <Label>Header Background Image (Optional)</Label>
                <div className="flex items-center gap-4">
                     <div className="flex-1 border rounded px-3 py-2 text-sm text-muted-foreground truncate bg-muted/50">
                          {bgVal || "No image selected (Default: Grey Background)"}
                     </div>
                    <MediaPicker 
                        onSelect={(file) => {
                            update({ backgroundId: file.storagePath })
                        }}
                    />
                    {bgVal && (
                        <button 
                            className="text-xs text-destructive hover:underline"
                            onClick={() => update({ backgroundId: null })}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
