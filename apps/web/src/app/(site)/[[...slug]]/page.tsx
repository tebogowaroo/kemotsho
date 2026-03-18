import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { getCachedPageBySlug, getCachedAllPages, getCachedContentBySlug } from "@kemotsho/core/lib/cached-queries"
import { Slug } from "@kemotsho/platform-cms/content/domain/Content"
import { Schema } from "effect"
import { Effect, Exit } from "effect"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { Hero } from "../_components/sections/hero"
import { ContentList } from "../_components/sections/content-list"
import { PaginatedContentList } from "../_components/sections/paginated-content-list"
import { HtmlBlock } from "../_components/sections/html-block"
import { ContactBlock } from "../_components/sections/contact-block"
import { TextBlock } from "../_components/sections/text-block"
import { ValuesBlock } from "../_components/sections/values-block"
import { PageHeader } from "../_components/sections/page-header"
import { PricingBlock } from "../_components/sections/pricing-block"
import { FeaturesBlock } from "../_components/sections/features-block"
import { PromoBlock } from "../_components/sections/promo-block"
import { CtaBlock } from "../_components/sections/cta-block"
import { TabsBlock } from "../_components/sections/tabs-block"
import { ContentItemTemplate } from "../_components/templates/content-item-template"

// Separate component for rendering sections to keep the page clean
function PageRenderer({ page, searchParams, slug }: { page: any, searchParams: any, slug: string }) {
    if (!page.sections || page.sections.length === 0) {
        return (
             <div className="min-h-[50vh] flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold mb-4">{page.title}</h1>
                <p className="text-muted-foreground">This page is empty.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen">
             {page.sections.map((section: any) => {
                 switch(section.type) {
                     case "hero":
                         return <Hero key={section.uniqueId} data={section.data as any} />
                     case "contentList":
                         return <ContentList key={section.uniqueId} data={section.data as any} />
                     case "paginatedContentList":
                         return (
                            <PaginatedContentList 
                                key={section.uniqueId} 
                                kind={section.data.kind}
                                limit={section.data.limit}
                                baseUrl={section.data.baseUrl || (slug.startsWith("/") ? slug : `/${slug}`)}
                                searchParams={searchParams}
                            />
                         )
                     case "html":
                         return <HtmlBlock key={section.uniqueId} data={section.data as any} />
                     case "contact":
                         return <ContactBlock key={section.uniqueId} data={section.data as any} />
                     case "textBlock":
                         return <TextBlock key={section.uniqueId} data={section.data as any} />
                     case "valuesBlock":
                         return <ValuesBlock key={section.uniqueId} data={section.data as any} />
                     case "pageHeader":
                         return <PageHeader key={section.uniqueId} data={section.data as any} />
                     case "pricing":
                         return <PricingBlock key={section.uniqueId} data={section.data as any} />
                     case "features":
                         return <FeaturesBlock key={section.uniqueId} data={section.data as any} />
                     case "promo":
                         return <PromoBlock key={section.uniqueId} data={section.data as any} />
                     case "tabsBlock":
                         return <TabsBlock key={section.uniqueId} data={section.data as any} />
                     case "ctaBlock":
                         return <CtaBlock key={section.uniqueId} data={section.data as any} />
                     default:
                         return null
                 }
             })}
        </div>
    )
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
    try {
        const { slug } = await params
        
        // Construct slug path
        const path = slug ? slug.join("/") : "/"
        
        // Check cache for Page
        const page = await getCachedPageBySlug(path)

        if (page) {
            const title = page.seo.title || page.title
            const description = page.seo.description || ""

            return {
                title: title,
                description: description,
                openGraph: {
                    title: title,
                    description: description,
                }
            }
        }

        // Checking for content item (try exact path first, then try slug only for prefixed paths like /blog/my-post)
        let content = await getCachedContentBySlug(path)
        
        if (!content && slug && slug.length > 1) {
            const lastSegment = slug[slug.length - 1]
            // Ensure lastSegment is defined before using it
            if (lastSegment) {
                content = await getCachedContentBySlug(lastSegment)
            }
        }

        if (content) {
            const title = content.seo?.title || content.title
            const description = content.seo?.description || content.excerpt || ""

            return {
                title: title,
                description: description,
                openGraph: {
                    title: title,
                    description: description,
                }
            }
        }
    } catch (error) {
        console.warn("Generating metadata failed seamlessly during build:", error)
    }
    
    return {
            title: "Page Not Found",
            description: "The page you are looking for does not exist."
    }
}

export const dynamic = "force-dynamic"

export default async function PublicPage({ 
    params,
    searchParams 
}: { 
    params: Promise<{ slug?: string[] }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    try {
        const p = await params;
        const slug = p?.slug;
        const resolvedSearchParams = await searchParams
        const path = slug ? slug.join("/") : "/"
        
        // 1. Try Page
        const page = await getCachedPageBySlug(path)

        if (page) {
            // Page is already plain JSON from cache, no need to serialize manually
            return <PageRenderer page={page} searchParams={resolvedSearchParams} slug={path} />
        }
        
        // 2. Try Content Item
        let content = await getCachedContentBySlug(path)
        
        // 3. Try Content Item (Prefixed Match)
        if (!content && slug && slug.length > 1) {
            const lastSegment = slug[slug.length - 1]
            if (lastSegment) {
                content = await getCachedContentBySlug(lastSegment)
            }
        }
        
        if (content) {
            return <ContentItemTemplate data={content} />
        }

        // 4. 404
        notFound()
    } catch (error) {
        console.error("Failed to render page uniquely:", error)
        // Ensure the build doesn't crash if Next.js tries to pre-evaluate the page structure
        return (
             <div className="min-h-[50vh] flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold mb-4">Temporarily Unavailable</h1>
                <p className="text-muted-foreground">This content could not be loaded.</p>
            </div>
        )
    }
}
