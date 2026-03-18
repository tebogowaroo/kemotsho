import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import { Textarea } from "@/shared/ui/atoms/textarea"
import { Button } from "@/shared/ui/atoms/button"
import { X } from "lucide-react"
import { MediaPicker } from "@/app/(platform)/admin/media/_components/media-picker"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/atoms/select"
import { CtaBlockSection, PageSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"

type CtaBlockData = Extract<Schema.Schema.Encoded<typeof PageSection>, { type: "ctaBlock" }>["data"]

interface CtaEditorProps {
    data: CtaBlockData
    onChange: (data: CtaBlockData) => void
}

export function CtaEditor({ data, onChange }: CtaEditorProps) {
    if (!data) return null
    
    const titleVal = data.title || ""
    const bodyVal = data.body || ""
 
    const update = (patch: Partial<CtaBlockData>) => {
        onChange({ ...data, ...patch })
    }

    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label>Headline</Label>
                <Input 
                    value={titleVal} 
                    onChange={(e) => update({ title: e.target.value })} 
                    placeholder="e.g. Let's Talk Tech."
                />
            </div>

             <div className="grid gap-2">
                <Label>Body Text (Optional)</Label>
                <Textarea 
                    value={bodyVal} 
                    onChange={(e) => update({ body: e.target.value || null })} 
                    placeholder="Ready to see under the hood?..."
                    className="min-h-[100px]"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>CTA Label</Label>
                    <Input 
                        value={data.ctaLabel || ""} 
                        onChange={(e) => update({ ctaLabel: e.target.value })} 
                        placeholder="e.g. Schedule a Consultation"
                    />
                </div>
                 <div className="grid gap-2">
                    <Label>CTA Link</Label>
                    <Input 
                        value={data.ctaLink || ""} 
                        onChange={(e) => update({ ctaLink: e.target.value })} 
                        placeholder="e.g. /contact"
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Button Background Color</Label>
                <div className="flex gap-2">
                    <Input 
                        type="color"
                        className="w-16 p-1 h-10"
                        value={data.buttonColor || "#10b981"} 
                        onChange={(e) => update({ buttonColor: e.target.value })} 
                    />
                    <Input 
                        value={data.buttonColor || ""} 
                        onChange={(e) => update({ buttonColor: e.target.value || undefined })}
                        placeholder="Hex code (e.g. #10b981)" 
                    />
                </div>
            </div>
            
            <div className="pt-4 mt-2 border-t space-y-4">
                <Label className="text-base font-semibold">Background & Theme Options</Label>
                
                <div className="grid gap-2">
                    <Label>Theme Variant</Label>
                    <Select 
                        value={data.theme || "dark"} 
                        onValueChange={(val: "dark" | "light") => update({ theme: val })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="dark">Dark Theme (White Text)</SelectItem>
                            <SelectItem value="light">Light Theme (Dark Text)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="grid gap-2">
                    <Label>Background Image (Optional)</Label>
                    <div className="flex items-center gap-3">
                        <div className="text-xs truncate max-w-[200px] border p-2 rounded bg-muted flex-grow">
                            {data.backgroundId || "No image selected"}
                        </div>
                        {data.backgroundId ? (
                            <Button 
                                intent="outline" 
                                size="icon"
                                onClick={() => update({ backgroundId: undefined })}
                                title="Remove Image"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        ) : null}
                        <MediaPicker 
                            onSelect={(file) => update({ backgroundId: file.storagePath || undefined })} 
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">If selected, custom gradients will be ignored.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Gradient Start</Label>
                        <div className="flex gap-2">
                            <Input type="color" className="w-[50px] p-1 h-10" value={data.gradientStart || "#0f172a"} onChange={(e) => update({ gradientStart: e.target.value })} />
                            <Input value={data.gradientStart || ""} onChange={(e) => update({ gradientStart: e.target.value || undefined })} placeholder="#0f172a" />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Gradient End</Label>
                        <div className="flex gap-2 relative">
                            <Input type="color" className="w-[50px] p-1 h-10" value={data.gradientEnd || "#020617"} onChange={(e) => update({ gradientEnd: e.target.value })} />
                            <Input value={data.gradientEnd || ""} onChange={(e) => update({ gradientEnd: e.target.value || undefined })} placeholder="#020617" />
                        </div>
                    </div>
                </div>
                
                {(data.gradientStart || data.gradientEnd) && (
                    <Button 
                        intent="ghost" 
                        size="sm" 
                        onClick={() => update({ gradientStart: undefined, gradientEnd: undefined })}
                        className="text-muted-foreground text-xs w-fit h-auto p-0"
                    >
                        Reset Gradients to Default
                    </Button>
                )}
            </div>
            
            <div className="text-sm text-muted-foreground mt-4 border-t pt-4">
                Note: By default, the CTA block applies a smooth dark gradient unless custom fields above are configured.
            </div>
        </div>
    )
}
