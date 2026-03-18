import { PageSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Button } from "@/shared/ui/atoms/button"
import { Trash2, ArrowUp, ArrowDown, GripVertical } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/shared/ui/atoms/card"
import { Badge } from "@/shared/ui/atoms/badge"
import { HeroEditor } from "./editors/hero-editor"
import { ContentListEditor } from "./editors/content-list-editor"
import { PaginatedContentListEditor } from "./editors/paginated-content-list-editor"
import { HtmlEditor } from "./editors/html-editor"
import { ContactEditor } from "./editors/contact-editor"
import { TextBlockEditor } from "./editors/text-block-editor"
import { ValuesBlockEditor } from "./editors/values-block-editor"
import { PageHeaderEditor } from "./editors/page-header-editor"
import { PricingEditor } from "./editors/pricing-editor"
import { FeaturesEditor } from "./editors/features-editor"
import { ProductListEditor } from "./editors/product-list-editor"
import { PromoEditor } from "./editors/promo-editor"
import { CtaEditor } from "./editors/cta-editor"
import { TabsEditor } from "./editors/tabs-editor"
import { FeaturedHeroEditor } from "./editors/featured-hero-editor"
import { Schema } from "effect"

interface SectionListProps {
    sections: Schema.Schema.Encoded<typeof PageSection>[]
    onUpdate: (section: any) => void
    onRemove: (id: string) => void
    onMove: (id: string, direction: "up" | "down") => void
}

export function SectionList({ sections, onUpdate, onRemove, onMove }: SectionListProps) {
    return (
        <div className="space-y-4">
            {sections.map((section, index) => (
                <Card key={section.uniqueId} className="relative group border-l-4 border-l-primary/20 hover:border-l-primary transition-all">
                    <div className="absolute right-4 top-4 flex items-center gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                         <Button 
                            intent="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => onMove(section.uniqueId, "up")}
                            disabled={index === 0}
                         >
                            <ArrowUp className="h-4 w-4" />
                         </Button>
                         <Button 
                            intent="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => onMove(section.uniqueId, "down")}
                            disabled={index === sections.length - 1}
                         >
                            <ArrowDown className="h-4 w-4" />
                         </Button>
                         <div className="h-4 w-px bg-border mx-1" />
                         <Button 
                            intent="danger" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => onRemove(section.uniqueId)} // TODO: Confirm
                         >
                            <Trash2 className="h-4 w-4" />
                         </Button>
                    </div>

                    <CardHeader className="py-4 pb-2">
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="uppercase text-[10px] tracking-wider">
                                {section.type}
                            </Badge>
                            <span className="text-xs font-mono text-muted-foreground">{section.uniqueId.slice(0, 8)}</span>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="pt-2">
                        {section.type === "hero" && (
                            <HeroEditor 
                                section={section} 
                                onChange={(data) => onUpdate({ ...section, data } as any)} 
                            />
                        )}
                        {section.type === "contentList" && (
                            <ContentListEditor 
                                section={section}
                                onChange={(data) => onUpdate({ ...section, data } as any)}
                            />
                        )}
                        {section.type === "paginatedContentList" && (
                            <PaginatedContentListEditor 
                                data={section.data}
                                onChange={(data) => onUpdate({ ...section, data } as any)}
                            />
                        )} 
                        {section.type === "html" && (
                            <HtmlEditor
                                section={section}
                                onChange={(data) => onUpdate({ ...section, data } as any)}
                            />
                        )}
                        {section.type === "contact" && (
                            <ContactEditor
                                section={section}
                                onChange={(data) => onUpdate({ ...section, data } as any)}
                            />
                        )}
                        {section.type === "textBlock" && (
                            <TextBlockEditor
                                data={section.data}
                                onChange={(data) => onUpdate({ ...section, data } as any)}
                            />
                        )}
                        {section.type === "valuesBlock" && (
                            <ValuesBlockEditor
                                data={section.data}
                                onChange={(data) => onUpdate({ ...section, data } as any)}
                            />
                        )}
                        {section.type === "pageHeader" && (
                            <PageHeaderEditor
                                data={section.data}
                                onChange={(data) => onUpdate({ ...section, data } as any)}
                            />
                        )}                        {section.type === "pricing" && (
                            <PricingEditor
                                section={section}
                                onChange={(data) => onUpdate({ ...section, data } as any)}
                            />
                        )}
                        {section.type === "features" && (
                            <FeaturesEditor
                                section={section}
                                onChange={(data) => onUpdate({ ...section, data } as any)}
                            />
                        )}
                        {section.type === "productList" && (
                            <ProductListEditor 
                                section={section}
                                onChange={(data) => onUpdate({ ...section, data } as any)}
                            />
                        )}
                        {section.type === "promo" && (
                            <PromoEditor
                                section={section as any}
                                onChange={(data) => onUpdate({ ...section, data } as any)}
                            />
                        )}
                        {section.type === "tabsBlock" && (
                            <TabsEditor
                                data={section.data}
                                onChange={(data) => onUpdate({ ...section, data } as any)}
                            />
                        )}
                        {section.type === "ctaBlock" && (
                            <CtaEditor
                                data={section.data}
                                onChange={(data) => onUpdate({ ...section, data } as any)}
                            />
                        )}
                        {section.type === "featuredProductsHero" && (
                            <FeaturedHeroEditor
                                section={section}
                                onChange={(data) => onUpdate({ ...section, data } as any)}
                            />
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
