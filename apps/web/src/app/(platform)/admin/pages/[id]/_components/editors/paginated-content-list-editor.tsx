import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/atoms/select"
import { PaginatedContentListSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"

type PaginatedContentListData = Schema.Schema.Encoded<typeof PaginatedContentListSection>["data"]

interface PaginatedContentListEditorProps {
    data: PaginatedContentListData
    onChange: (data: PaginatedContentListData) => void
}

export function PaginatedContentListEditor({ data, onChange }: PaginatedContentListEditorProps) {
    const update = (key: keyof PaginatedContentListData, value: any) => {
        onChange({ ...data, [key]: value })
    }

    return (
        <div className="grid gap-4">
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
                    <Label>Items per page</Label>
                    <Input 
                        type="number"
                        min={1}
                        max={24}
                        value={data.limit} 
                        onChange={(e) => update("limit", parseInt(e.target.value))} 
                    />
                </div>
            </div>
            
            <div className="grid gap-2">
                <Label>Manual Base URL (Optional)</Label>
                <Input 
                    placeholder="e.g. /blog (Leave empty to use current page)"
                    value={data.baseUrl || ""}
                    onChange={(e) => update("baseUrl", e.target.value || null)}
                />
                <p className="text-xs text-muted-foreground">
                    Only set this if you are embedding this list on a page that isn't the main index for this content.
                </p>
            </div>
        </div>
    )
}
