"use client"

import { TabsBlockSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Input } from "@/shared/ui/atoms/input"
import { Textarea } from "@/shared/ui/atoms/textarea"
import { Label } from "@/shared/ui/atoms/label"
import { Button } from "@/shared/ui/atoms/button"
import { Card, CardContent } from "@/shared/ui/atoms/card"
import { MediaPicker } from "@/app/(platform)/admin/media/_components/media-picker"
import { Plus, Trash2 } from "lucide-react"


export function TabsEditor({
    data,
    onChange
}: {
    data: typeof TabsBlockSection.Type["data"]
    onChange: (data: typeof TabsBlockSection.Type["data"]) => void
}) {
    const handleAddTab = () => {
        onChange({
            ...data,
            tabs: [
                ...(data.tabs || []),
                {
                    label: "New Tab",
                    content: "",
                    imagePath: undefined,
                    callToActionLabel: undefined,
                    callToActionUrl: undefined
                }
            ]
        })
    }

    const handleUpdateTab = (index: number, updates: Partial<typeof TabsBlockSection.Type["data"]["tabs"][0]>) => {
        const newTabs = [...data.tabs]
        newTabs[index] = { ...newTabs[index], ...updates } as typeof TabsBlockSection.Type["data"]["tabs"][0]
        onChange({ ...data, tabs: newTabs })
    }

    const handleRemoveTab = (index: number) => {
        onChange({
            ...data,
            tabs: data.tabs.filter((_, i) => i !== index)
        })
    }

    return (
        <div className="space-y-8">
            <div className="space-y-4 max-w-xl">
                <div>
                    <Label>Section Title</Label>
                    <Input
                        value={data.title || ""}
                        onChange={(e) => onChange({ ...data, title: e.target.value || undefined })}
                        placeholder="e.g. Platform Features by Industry"
                    />
                </div>
                <div>
                    <Label>Subtitle</Label>
                    <Textarea
                        value={data.subtitle || ""}
                        onChange={(e) => onChange({ ...data, subtitle: e.target.value || undefined })}
                        placeholder="A brief description of this section"
                    />
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium">Tabs</h3>
                        <p className="text-sm text-muted-foreground">Manage industry/feature tabs.</p>
                    </div>
                    <Button onClick={handleAddTab} intent="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Tab
                    </Button>
                </div>

                <div className="space-y-4">
                    {data.tabs?.map((tab, idx) => (
                        <Card key={idx} className="relative shadow-sm rounded-lg border-slate-200">
                            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 relative group">
                                <Button
                                    intent="danger"
                                    size="icon"
                                    className="absolute -right-3 -top-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 w-8 h-8"
                                    onClick={() => handleRemoveTab(idx)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>

                                <div className="space-y-4">
                                    <div>
                                        <Label>Tab Label (Short)</Label>
                                        <Input
                                            value={tab.label}
                                            onChange={(e) => handleUpdateTab(idx, { label: e.target.value })}
                                            placeholder="e.g. Healthcare"
                                        />
                                    </div>
                                    <div>
                                        <Label>Tab Content</Label>
                                        <Textarea
                                            value={tab.content}
                                            onChange={(e) => handleUpdateTab(idx, { content: e.target.value })}
                                            className="h-32"
                                            placeholder="Description of the industry..."
                                        />
                                    </div>

                                    <div className="pt-2 grid grid-cols-2 gap-2">
                                        <div>
                                            <Label>CTA Label</Label>
                                            <Input
                                                value={tab.callToActionLabel || ""}
                                                onChange={(e) => handleUpdateTab(idx, { callToActionLabel: e.target.value || undefined })}
                                                placeholder="e.g. Learn More"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label>CTA URL</Label>
                                            <Input
                                                value={tab.callToActionUrl || ""}
                                                onChange={(e) => handleUpdateTab(idx, { callToActionUrl: e.target.value || undefined })}
                                                placeholder="e.g. /solutions/healthcare"
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 relative">
                                    <Label>Tab Image (Optional)</Label>
                                    <div className="mt-2 border rounded-md overflow-hidden bg-slate-50 relative aspect-[4/3] flex items-center justify-center">
                                        {tab.imagePath ? (
                                            <>
                                                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-100 text-slate-500 text-sm overflow-hidden text-center">
                                                    <span className="truncate max-w-full font-mono">{tab.imagePath}</span>
                                                </div>
                                                <Button
                                                    intent="secondary"
                                                    size="sm"
                                                    className="absolute top-2 right-2 opacity-80 hover:opacity-100 shadow-sm"
                                                    onClick={() => handleUpdateTab(idx, { imagePath: undefined })}
                                                >
                                                    Clear Image
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="p-4 w-full">
                                                <MediaPicker
                                                    onSelect={(file) => handleUpdateTab(idx, { imagePath: file.storagePath })}
                                                    trigger={
                                                        <Button intent="outline" className="w-full h-full border-dashed p-8">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <Plus className="w-4 h-4" />
                                                                <span>Select Image</span>
                                                            </div>
                                                        </Button>
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Recommended size: 800x600px</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    
                    {(!data.tabs || data.tabs.length === 0) && (
                        <div className="text-center py-12 border border-dashed rounded-lg text-slate-500 bg-slate-50">
                            No tabs configured. Add a tab to get started.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}