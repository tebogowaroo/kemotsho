import { PageSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"
import { Input } from "@kemotsho/core/ui/input"
import { Label } from "@kemotsho/core/ui/label"
import { Textarea } from "@kemotsho/core/ui/textarea"
import { Button } from "@/shared/ui/atoms/button"
import { Plus, Trash2 } from "lucide-react"

type ValuesBlockData = Extract<Schema.Schema.Encoded<typeof PageSection>, { type: "valuesBlock" }>["data"]

interface ValuesBlockEditorProps {
    data: ValuesBlockData
    onChange: (data: ValuesBlockData) => void
}

export function ValuesBlockEditor({ data, onChange }: ValuesBlockEditorProps) {
    if (!data) return null
    const titleVal = data.title || ""
    const descVal = data.description || ""

    const update = (patch: Partial<ValuesBlockData>) => {
        onChange({ ...data, ...patch })
    }

    const addItem = () => {
        const current = data.items || []
        update({ 
            items: [...current, { title: "New Value", description: "" }]
        })
    }

    const updateItem = (index: number, patch: { title?: string, description?: string }) => {
        const current = [...(data.items || [])]
        if (current[index]) {
            current[index] = { ...current[index], ...patch }
            update({ items: current })
        }
    }

    const removeItem = (index: number) => {
        const current = [...(data.items || [])]
        current.splice(index, 1)
        update({ items: current })
    }

    return (
        <div className="space-y-6">
             <div className="grid gap-2">
                <Label>Section Title</Label>
                <Input 
                   value={titleVal}
                   onChange={(e) => update({ title: e.target.value || null })}
                   placeholder="e.g. Our Core Values"
                />
            </div>
            
            <div className="grid gap-2">
                <Label>Section Description</Label>
                <Textarea
                   value={descVal}
                   onChange={(e) => update({ description: e.target.value || null })}
                   placeholder="Short description for the section..."
                />
            </div>

            <div className="space-y-4">
                 <div className="flex items-center justify-between">
                     <Label>Values (3 Columns)</Label>
                     <Button type="button" intent="outline" size="sm" onClick={addItem}>
                        <Plus className="mr-2 h-4 w-4" /> Add Value
                     </Button>
                 </div>

                 <div className="grid gap-4">
                     {(data.items || []).map((item, idx) => (
                         <div key={idx} className="border p-4 rounded-md space-y-3 relative bg-card">
                             <div className="absolute right-4 top-4">
                                 <Button intent="ghost" size="sm" onClick={() => removeItem(idx)}>
                                     <Trash2 className="h-4 w-4 text-destructive" />
                                 </Button>
                             </div>

                             <div className="grid gap-2 pr-10">
                                 <Label>Title</Label>
                                 <Input 
                                    value={item.title} 
                                    onChange={(e) => updateItem(idx, { title: e.target.value })}
                                 />
                             </div>
                             <div className="grid gap-2">
                                 <Label>Description</Label>
                                 <Textarea 
                                    value={item.description} 
                                    onChange={(e) => updateItem(idx, { description: e.target.value })}
                                    rows={3}
                                 />
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
        </div>
    )
}
