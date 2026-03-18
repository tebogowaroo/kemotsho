import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import { Switch } from "@kemotsho/core/ui/switch"
import { RichTextEditor } from "@/shared/ui/atoms/rich-text-editor"
import { PageSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"

type TextBlockData = Extract<Schema.Schema.Encoded<typeof PageSection>, { type: "textBlock" }>["data"]

interface TextBlockEditorProps {
    data: TextBlockData
    onChange: (data: TextBlockData) => void
}

export function TextBlockEditor({ data, onChange }: TextBlockEditorProps) {
    if (!data) return null
    const titleVal = data.title || ""

    const update = (patch: Partial<TextBlockData>) => {
        onChange({ ...data, ...patch })
    }

    return (
        <div className="space-y-4">
             <div className="grid gap-2">
                <Label>Section Title (Optional)</Label>
                <Input 
                   value={titleVal}
                   onChange={(e) => update({ title: e.target.value || null })}
                   placeholder="e.g. Our Story"
                />
            </div>

            <div className="flex items-center space-x-2">
                 <input 
                    type="checkbox"
                    id="centered"
                    checked={data.centered}
                    onChange={(e) => update({ centered: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                 />
                 <Label htmlFor="centered">Center Align Text</Label>
            </div>

            <div className="grid gap-2">
                 <Label>Body Content</Label>
                 <RichTextEditor 
                    value={data.body}
                    onChange={(val) => update({ body: val })}
                 />
            </div>
        </div>
    )
}
