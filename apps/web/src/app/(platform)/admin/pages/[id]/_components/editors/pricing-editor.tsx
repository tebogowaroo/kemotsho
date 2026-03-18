"use client"

import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import { Button } from "@/shared/ui/atoms/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/atoms/card"
import { Textarea } from "@/shared/ui/atoms/textarea"
import { Switch } from "@/shared/ui/atoms/switch" 
import { PricingSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"
import { Plus, Trash2, X } from "lucide-react"

type PricingData = Schema.Schema.Encoded<typeof PricingSection>["data"]

interface PricingEditorProps {
    section: any
    onChange: (data: PricingData) => void
}

export function PricingEditor({ section, onChange }: PricingEditorProps) {
    const data = section.data as PricingData

    const update = (key: keyof PricingData, value: any) => {
        onChange({ ...data, [key]: value })
    }

    const addPlan = () => {
        const newPlan = {
            name: "New Plan",
            price: "$0",
            frequency: "/mo",
            description: "",
            features: ["Feature 1", "Feature 2"],
            ctaLabel: "Get Started",
            ctaLink: "#",
            isPopular: false
        }
        update("plans", [...(data.plans || []), newPlan])
    }

    const removePlan = (index: number) => {
        const plans = [...(data.plans || [])]
        plans.splice(index, 1)
        update("plans", plans)
    }

    const updatePlan = (index: number, key: string, value: any) => {
        const plans = [...(data.plans || [])]
        plans[index] = { ...plans[index], [key]: value } as any
        update("plans", plans)
    }

    const addFeature = (planIndex: number) => {
        const plans = [...(data.plans || [])]
        const plan = plans[planIndex]
        if (!plan) return

        plans[planIndex] = {
            ...plan,
            features: [...(plan.features || []), ""]
        } as any
        update("plans", plans)
    }

    const removeFeature = (planIndex: number, featureIndex: number) => {
        const plans = [...(data.plans || [])]
        const plan = plans[planIndex]
        if (!plan) return

        const features = [...(plan.features || [])]
        features.splice(featureIndex, 1)
        plans[planIndex] = { ...plan, features } as any
        update("plans", plans)
    }

    const updateFeature = (planIndex: number, featureIndex: number, value: string) => {
        const plans = [...(data.plans || [])]
        const plan = plans[planIndex]
        if (!plan) return

        const features = [...(plan.features || [])]
        features[featureIndex] = value
        plans[planIndex] = { ...plan, features } as any
        update("plans", plans)
    }

    return (
        <div className="grid gap-6">
            <div className="grid gap-2">
                <Label>Section Title</Label>
                <Input 
                    value={data.title || ""} 
                    onChange={(e) => update("title", e.target.value || null)} 
                    placeholder="e.g. Simple Pricing"
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
                    <Label className="text-lg font-semibold">Plans</Label>
                    <Button onClick={addPlan} size="sm" intent="outline" type="button">
                        <Plus className="w-4 h-4 mr-2" /> Add Plan
                    </Button>
                </div>

                {(!data.plans || data.plans.length === 0) && (
                    <div className="text-sm text-muted-foreground italic border border-dashed p-4 rounded text-center">
                        No pricing plans added yet.
                    </div>
                )}

                {data.plans?.map((plan, i) => (
                    <Card key={i} className="relative">
                        <Button
                            intent="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 text-destructive"
                            onClick={() => removePlan(i)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Plan #{i + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>Name</Label>
                                    <Input 
                                        value={plan.name} 
                                        onChange={(e) => updatePlan(i, "name", e.target.value)}
                                        placeholder="e.g. Standard"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Price</Label>
                                    <Input 
                                        value={plan.price} 
                                        onChange={(e) => updatePlan(i, "price", e.target.value)}
                                        placeholder="$29"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>Frequency</Label>
                                    <Input 
                                        value={plan.frequency || ""} 
                                        onChange={(e) => updatePlan(i, "frequency", e.target.value || null)}
                                        placeholder="/month"
                                    />
                                </div>
                                <div className="flex items-end pb-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch 
                                            id={`popular-${i}`}
                                            checked={plan.isPopular}
                                            onCheckedChange={(checked) => updatePlan(i, "isPopular", checked)}
                                        />
                                        <Label htmlFor={`popular-${i}`}>Highlight as Popular</Label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label>Description</Label>
                                <Input 
                                    value={plan.description || ""} 
                                    onChange={(e) => updatePlan(i, "description", e.target.value || null)}
                                    placeholder="Short plan description"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>CTA Label</Label>
                                    <Input 
                                        value={plan.ctaLabel} 
                                        onChange={(e) => updatePlan(i, "ctaLabel", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>CTA Link</Label>
                                    <Input 
                                        value={plan.ctaLink} 
                                        onChange={(e) => updatePlan(i, "ctaLink", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Features</Label>
                                <div className="space-y-2">
                                    {plan.features.map((feature, fIndex) => (
                                        <div key={fIndex} className="flex gap-2">
                                            <Input 
                                                value={feature} 
                                                onChange={(e) => updateFeature(i, fIndex, e.target.value)}
                                                className="h-8"
                                            />
                                            <Button
                                                intent="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground"
                                                onClick={() => removeFeature(i, fIndex)}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button size="sm" intent="ghost" className="w-full h-8 dashed" onClick={() => addFeature(i)}>
                                        <Plus className="w-3 h-3 mr-1" /> Add Feature
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
