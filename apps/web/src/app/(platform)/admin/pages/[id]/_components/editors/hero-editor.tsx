import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import { MediaPicker } from "@/app/(platform)/admin/media/_components/media-picker"
import { HeroSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/atoms/select"

type HeroData = Schema.Schema.Encoded<typeof HeroSection>["data"]

interface HeroEditorProps {
    section: any
    onChange: (data: HeroData) => void
}

export function HeroEditor({ section, onChange }: HeroEditorProps) {
    const data = section.data as HeroData

    const update = (key: keyof HeroData, value: any) => {
        onChange({ ...data, [key]: value })
    }

    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label>Headline</Label>
                <Input 
                    value={data.title || ""} 
                    onChange={(e) => update("title", e.target.value || null)} 
                    placeholder="Enter hero title"
                />
            </div>

             <div className="grid gap-2">
                <Label>Subtitle</Label>
                <Input 
                    value={data.subtitle || ""} 
                    onChange={(e) => update("subtitle", e.target.value || null)} 
                    placeholder="Enter optional description"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>CTA Label</Label>
                    <Input 
                        value={data.ctaLabel || ""} 
                        onChange={(e) => update("ctaLabel", e.target.value || null)} 
                        placeholder="e.g. Get Started"
                    />
                </div>
                 <div className="grid gap-2">
                    <Label>CTA Link</Label>
                    <Input 
                        value={data.ctaLink || ""} 
                        onChange={(e) => update("ctaLink", e.target.value || null)} 
                        placeholder="e.g. /contact"
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Text Position</Label>
                <Select
                    value={data.textPosition || "center"}
                    onValueChange={(value) => update("textPosition", value)}
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
                        onChange={(e) => update("textColor", e.target.value || null)} 
                        placeholder="#ffffff or black"
                    />
                </div>
                 <div className="grid gap-2">
                    <Label>Button Color</Label>
                    <Input 
                        value={data.ctaColor || ""} 
                        onChange={(e) => update("ctaColor", e.target.value || null)} 
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
                         onChange={(e) => update("overlayOpacity", Number(e.target.value))} 
                     />
                </div>
                 <div className="grid gap-2">
                     <Label>Text Max Width (px)</Label>
                     <Input 
                         type="number"
                         min="0"
                         value={data.textMaxWidth || ""} 
                         onChange={(e) => update("textMaxWidth", Number(e.target.value) || null)} 
                         placeholder="e.g. 800"
                     />
                </div>
            </div>
            
             <div className="grid gap-2">
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
        </div>
    )
}
