"use client"

import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import { Button } from "@/shared/ui/atoms/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/atoms/card"
import { Textarea } from "@/shared/ui/atoms/textarea"
import { MediaPicker } from "@/app/(platform)/admin/media/_components/media-picker"
import { FeaturesSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"
import { Plus, Trash2, X } from "lucide-react"

type FeaturesData = Schema.Schema.Encoded<typeof FeaturesSection>["data"]

interface FeaturesEditorProps {
    section: any
    onChange: (data: FeaturesData) => void
}

export function FeaturesEditor({ section, onChange }: FeaturesEditorProps) {
    const data = section.data as FeaturesData

    const update = (key: keyof FeaturesData, value: any) => {
        onChange({ ...data, [key]: value })
    }

    const addItem = () => {
        const newItem = {
            title: "New Feature",
            description: "Feature description goes here.",
            iconPath: null,
            linkUrl: null,
            linkText: null
        }
        update("items", [...(data.items || []), newItem])
    }

    const removeItem = (index: number) => {
        const items = [...(data.items || [])]
        items.splice(index, 1)
        update("items", items)
    }

    const updateItem = (index: number, key: string, value: any) => {
        const items = [...(data.items || [])]
        items[index] = { ...items[index], [key]: value } as any
        update("items", items)
    }

    return (
        <div className="grid gap-6">
            <div className="grid gap-2">
                <Label>Section Title</Label>
                <Input 
                    value={data.title || ""} 
                    onChange={(e) => update("title", e.target.value || null)} 
                    placeholder="e.g. Our Features"
                />
            </div>

            <div className="grid gap-2">
                <Label>Subtitle</Label>
                <Textarea 
                    value={data.subtitle || ""} 
                    onChange={(e) => update("subtitle", e.target.value || null)} 
                    placeholder="Brief description below the title"
                />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">Features</Label>
                    <Button onClick={addItem} size="sm" intent="outline" type="button">
                        <Plus className="w-4 h-4 mr-2" /> Add Feature
                    </Button>
                </div>

                {(!data.items || data.items.length === 0) && (
                    <div className="text-sm text-muted-foreground italic border border-dashed p-4 rounded text-center">
                        No features added yet.
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                    {data.items?.map((item, i) => (
                        <Card key={i} className="relative">
                            <Button
                                intent="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 text-destructive z-10"
                                onClick={() => removeItem(i)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            <CardContent className="grid gap-4 pt-6">
                                <div className="flex gap-4 items-start">
                                    <div className="w-20 shrink-0">
                                        <Label className="mb-2 block text-xs">Icon</Label>
                                        <div className="border rounded-md overflow-hidden aspect-square flex items-center justify-center bg-muted/20 relative group">
                                            {item.iconPath ? (
                                                 // eslint-disable-next-line @next/next/no-img-element
                                                <img 
                                                    src={item.iconPath} 
                                                    alt="icon" 
                                                    className="w-full h-full object-contain p-2" 
                                                />
                                            ) : (
                                                <span className="text-xs text-muted-foreground">None</span>
                                            )}
                                            
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <MediaPicker 
                                                    onSelect={(file) => updateItem(i, "iconPath", file.url)}
                                                    trigger={
                                                        <Button size="icon" intent="ghost" className="h-6 w-6 text-white hover:text-white hover:bg-white/20">
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                />
                                            </div>
                                        </div>
                                         {item.iconPath && (
                                            <Button 
                                                intent="ghost" 
                                                size="sm" 
                                                className="w-full text-[10px] h-6 mt-1 text-destructive"
                                                onClick={() => updateItem(i, "iconPath", null)}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid gap-3 flex-1">
                                        <div>
                                            <Label className="text-xs">Title</Label>
                                            <Input 
                                                value={item.title} 
                                                onChange={(e) => updateItem(i, "title", e.target.value)}
                                                className="h-8"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Description</Label>
                                            <Textarea 
                                                value={item.description} 
                                                onChange={(e) => updateItem(i, "description", e.target.value)}
                                                className="min-h-[60px]"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-xs">Link URL</Label>
                                                <Input 
                                                    value={item.linkUrl || ""} 
                                                    onChange={(e) => updateItem(i, "linkUrl", e.target.value || null)}
                                                    className="h-8"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Link Text</Label>
                                                <Input 
                                                    value={item.linkText || ""} 
                                                    onChange={(e) => updateItem(i, "linkText", e.target.value || null)}
                                                    className="h-8"
                                                    placeholder="Learn more"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
