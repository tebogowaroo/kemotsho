import { ContentItem } from "@kemotsho/platform-cms/content/domain/Content"
import { getPublicUrlAction } from "@/app/actions/media"
import { formatDate } from "@kemotsho/core/lib/utils"
import { Schema } from "effect"

type ContentItemData = Schema.Schema.Encoded<typeof ContentItem>

export async function ContentItemTemplate({ data }: { data: ContentItemData }) {
    // 1. Resolve Featured Image
    let imageUrl: string | null = null
    const featured = data.media?.featured
    
    // Handle OptionFromNullOr (it might be null or object)
    if (featured) {
        // If it's the raw object directly (from JSON decode)
        const storagePath = featured.storagePath
        
        if (storagePath) {
             const result = await getPublicUrlAction(storagePath)
             if (result.success && result.url) {
                 imageUrl = result.url
             }
        }
    }

    // 2. Format Date
    const publishDate = data.lifecycle?.publishedAt ? new Date(data.lifecycle.publishedAt) : new Date(data.audit.createdAt)
    const formattedDate = formatDate(publishDate)

    return (
       <article className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="relative w-full h-[60vh] md:h-[70vh] flex flex-col justify-end pb-12 md:pb-24 overflow-hidden bg-muted">
                {imageUrl && (
                    <div className="absolute inset-0 z-0">
                        <img 
                            src={imageUrl} 
                            alt={featured?.altText || data.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50" />
                    </div>
                )}
                
                <div className="container relative z-10 px-4 md:px-6 mx-auto">
                     <div className="max-w-4xl">
                        {data.taxonomy?.categories && data.taxonomy.categories.length > 0 && (
                            <div className="flex gap-2 mb-4">
                                {data.taxonomy.categories.map((cat, i) => (
                                    <span key={i} className="inline-block px-3 py-1 text-xs font-medium text-white bg-primary/80 rounded-full">
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        )}
                        
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter text-white mb-6">
                            {data.title}
                        </h1>
                        
                        {data.excerpt && (
                            <p className="text-xl md:text-2xl text-white/90 max-w-2xl font-light leading-relaxed">
                                {data.excerpt}
                            </p>
                        )}

                        <div className="mt-8 flex items-center text-white/80 text-sm md:text-base">
                            <time dateTime={publishDate.toISOString()}>{formattedDate}</time>
                            {data.audit.createdBy && (
                                <>
                                    <span className="mx-2">•</span>
                                    {/* Placeholder for Author Name until we fetch it */}
                                    <span>Editorial Team</span>
                                </>
                            )}
                        </div>
                     </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="w-full py-12 md:py-24 bg-background">
                <div className="container px-4 md:px-6 mx-auto">
                    <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert">
                        {/* 
                           Since data.body is "MarkdownContent", we should render it as markdown.
                           For now, assuming it might be HTML or simple text. 
                           Ideally we use a markdown renderer.
                           I will just render it inside a div for now.
                        */}
                         <div dangerouslySetInnerHTML={{ __html: data.body }} />
                    </div>
                </div>
            </div>
       </article> 
    )
}
