import { Label } from "@/shared/ui/atoms/label"
import { Textarea } from "@/shared/ui/atoms/textarea"
import { HtmlSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"

type HtmlData = Schema.Schema.Encoded<typeof HtmlSection>["data"]

interface HtmlEditorProps {
    section: any
    onChange: (data: HtmlData) => void
}

export function HtmlEditor({ section, onChange }: HtmlEditorProps) {
    const data = section.data as HtmlData

    const update = (key: keyof HtmlData, value: any) => {
        onChange({ ...data, [key]: value })
    }

    return (
        <div className="grid gap-2">
            <Label>Custom HTML</Label>
            <Textarea 
                value={data.html} 
                onChange={(e) => update("html", e.target.value)} 
                className="font-mono text-sm min-h-[150px]"
                placeholder="<div>...</div>"
            />
            <p className="text-xs text-muted-foreground">Be careful with raw HTML.</p>
        </div>
    )
}
