"use client"

import { useState } from "react"
import { Page, PageSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Button } from "@/shared/ui/atoms/button"
import { Plus, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { updatePageAction } from "@/app/actions/pages"
import { useRouter } from "next/navigation"
import { SectionList } from "./section-list"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/atoms/dropdown-menu"
import { PageSettingsSheet } from "./page-settings-sheet"


import { Schema } from "effect"
import { getTenantConfig } from "@kemotsho/core/config/tenant"

interface PageEditorProps {
    page: any
}

export function PageEditor({ page }: PageEditorProps) {
    const config = getTenantConfig();
    const [sections, setSections] = useState<Schema.Schema.Encoded<typeof PageSection>[]>(page.sections || [])
    const [isSaving, setIsSaving] = useState(false)
    const router = useRouter()

    const handleAddSection = (type: Schema.Schema.Encoded<typeof PageSection>["type"]) => {
        const newSection: any = {
            type,
            uniqueId: crypto.randomUUID(),
            data: {}
        }

        // Initialize default data based on type
        if (type === "hero") {
            newSection.data = { title: "New Hero Section", subtitle: null, backgroundId: null }
        } else if (type === "tabsBlock") {
            newSection.data = { title: "Features by Industry", subtitle: "Select your industry to see tailored capabilities", tabs: [] }

        } else if (type === "ctaBlock") {
            newSection.data = { title: "Let's Talk Tech.", body: "Ready to see under the hood? Speak directly with one of our lead engineers to discuss how our architecture can support your specific technical requirements.", ctaLabel: "Schedule a Technical Consultation", ctaLink: "/contact" }
        } else if (type === "contentList") {
            newSection.data = { kind: "blog", limit: 3, ctaLabel: null, ctaLink: null }
        } else if (type === "paginatedContentList") {
            newSection.data = { kind: "blog", limit: 6, baseUrl: null }
        } else if (type === "html") {
            newSection.data = { html: "<p>Enter content...</p>" }
        } else if (type === "contact") {
            newSection.data = { title: "Get in Touch", subtitle: null, email: null, phone: null, address: null, schedules: null, showForm: true, branches: [] }
        } else if (type === "textBlock") {
            newSection.data = { title: null, body: "<p>Enter text...</p>", centered: false }
        } else if (type === "valuesBlock") {
            newSection.data = { title: null, description: null, items: [] }
        } else if (type === "pageHeader") {
            newSection.data = { title: "New Page Title", subtitle: null, backgroundId: null }
        } else if (type === "pricing") {
            newSection.data = { title: "Simple Pricing", subtitle: "Choose the plan that fits you", plans: [] }
        } else if (type === "features") {
            newSection.data = { title: "Our Features", subtitle: "Discover what makes us unique", items: [] }
        } else if (type === "productList") {
            newSection.data = { title: "Our Products", subtitle: null, showPrices: true, showBuyButton: false, limit: 12 }
        } else if (type === "featuredProductsHero") {
            newSection.data = { title: null, productIds: [] }
        } else if (type === "promo") {
            newSection.data = { 
                title: "Flash Sale", 
                subtitle: "Limited time offer", 
                isActive: true, // Default to visible
                validFrom: null,
                validUntil: null,
                ctaLabel: "Shop Now",
                ctaLink: "/products",
                height: "auto",
                textColor: "#ffffff",
                overlayOpacity: 60
            }
        }

        setSections([...sections, newSection])
    }

    const handleUpdateSection = (updatedSection: any) => {
        setSections(sections.map(s => s.uniqueId === updatedSection.uniqueId ? updatedSection : s))
    }

    const handleRemoveSection = (uniqueId: string) => {
        setSections(sections.filter(s => s.uniqueId !== uniqueId))
    }

    const handleMoveSection = (uniqueId: string, direction: "up" | "down") => {
        const index = sections.findIndex(s => s.uniqueId === uniqueId)
        if (index === -1) return
        
        const newSections = [...sections]
        if (direction === "up" && index > 0) {
            const temp = newSections[index]
            newSections[index] = newSections[index - 1]!
            newSections[index - 1] = temp!
        } else if (direction === "down" && index < sections.length - 1) {
            const temp = newSections[index]
            newSections[index] = newSections[index + 1]!
            newSections[index + 1] = temp!
        }
        setSections(newSections)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const result = await updatePageAction({
                id: page.id,
                sections: sections
            })
            if (result.success) {
                // Toast success
                router.refresh()
            } else {
                alert("Failed to save: " + result.error)
            }
        } catch (e) {
            alert("Error saving page")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-muted/10">
            {/* Toolbar */}
            <div className="border-b bg-background px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button intent="ghost" size="icon" asChild>
                        <Link href="/admin/pages">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">{page.title}</h1>
                        <div className="text-sm text-muted-foreground flex gap-2">
                            <span>{page.slug}</span>
                            <span className="text-muted-foreground/50">•</span>
                            <span>{sections.length} Sections</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <PageSettingsSheet page={page} />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button intent="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Section
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAddSection("hero")}>
                                Hero Section
                            </DropdownMenuItem>
                            {config.features.commerce && (
                                <>
                                    <DropdownMenuItem onClick={() => handleAddSection("featuredProductsHero")}>
                                        Featured Products Hero (3 Cards)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleAddSection("promo")}>
                                        Promo Banner (Scheduled)
                                    </DropdownMenuItem>
                                </>
                            )}
                            <DropdownMenuItem onClick={() => handleAddSection("pageHeader")}>
                                Page Header (Mini Hero)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddSection("tabsBlock")}>
                                Interactive Tabs
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddSection("ctaBlock")}>
                                Dark Tech CTA Block
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddSection("contentList")}>
                                Featured Content (Static)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddSection("paginatedContentList")}>
                                Paginated List (Searchable)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddSection("textBlock")}>
                                Text Block
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddSection("valuesBlock")}>
                                Values Grid (3-Col)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddSection("pricing")}>
                                Pricing Plans
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddSection("features")}>
                                Features Grid
                            </DropdownMenuItem>
                            {config.features.commerce && (
                                <DropdownMenuItem onClick={() => handleAddSection("productList")}>
                                    Product Grid (Catalog)
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleAddSection("html")}>
                                Custom HTML
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddSection("contact")}>
                                Contact Block
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                    </Button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    <SectionList 
                        sections={sections} 
                        onUpdate={handleUpdateSection}
                        onRemove={handleRemoveSection}
                        onMove={handleMoveSection}
                    />
                    
                    {sections.length === 0 && (
                        <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
                            <p>This page is empty.</p>
                            <p className="text-sm">Click "Add Section" to start building.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
