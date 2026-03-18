import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/atoms/select"
import { ContentListSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"

type ContentListData = Schema.Schema.Encoded<typeof ContentListSection>["data"]

interface ContentListEditorProps {
    section: any
    onChange: (data: ContentListData) => void
}

export function ContentListEditor({ section, onChange }: ContentListEditorProps) {
    const data = section.data as ContentListData

    const update = (key: keyof ContentListData, value: any) => {
        onChange({ ...data, [key]: value })
    }

    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label>Content Type</Label>
                <Select 
                    value={data.kind} 
                    onValueChange={(val: any) => update("kind", val)}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="blog">Blog Posts</SelectItem>
                        <SelectItem value="news">News Articles</SelectItem>
                        <SelectItem value="service">Services</SelectItem>
                        <SelectItem value="product">Products</SelectItem>
                    </SelectContent>
                </Select>
            </div>

             <div className="grid gap-2">
                <Label>Number of Items</Label>
                <Input 
                    type="number"
                    min={1}
                    max={12}
                    value={data.limit} 
                    onChange={(e) => update("limit", parseInt(e.target.value))} 
                />
            </div>

             <div className="grid gap-2">
                <Label>CTA Label (Optional)</Label>
                <Input 
                    value={data.ctaLabel || ""} 
                    onChange={(e) => update("ctaLabel", e.target.value || null)} 
                    placeholder="e.g. View All"
                />
            </div>
             <div className="grid gap-2">
                <Label>CTA Link (Optional)</Label>
                <Input 
                    value={data.ctaLink || ""} 
                    onChange={(e) => update("ctaLink", e.target.value || null)} 
                    placeholder="e.g. /blog"
                />
            </div>
        </div>
    )
}
