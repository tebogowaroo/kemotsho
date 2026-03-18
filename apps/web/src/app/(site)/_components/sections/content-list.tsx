import { ContentListSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"
import { Option, Effect } from "effect"
import { listContentByKind } from "@kemotsho/platform-cms/content/application/ListContentByKind"
import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { ContentKind } from "@kemotsho/platform-cms/content/domain/Content"
import { MediaService } from "@kemotsho/platform-cms/media/domain/MediaService"
import Link from "next/link"
import Image from "next/image"

type ContentListData = Schema.Schema.Type<typeof ContentListSection>["data"]

// Helper to safely unwrap Option-like objects after JSON serialization
const getVal = <T,>(opt: any): T | null => {
    if (!opt) return null
    if (opt._tag === "Some") return opt.value
    if (opt._tag === "None") return null
    if (typeof opt === 'object' && opt !== null) return null
    return opt 
}

export async function ContentList({ data }: { data: ContentListData }) {
    
    // 1. Fetch Data & Resolve Images
    const items = await AppRuntime.runPromise(
        Effect.gen(function* (_) {
            // Fetch content items
            const contentItems = yield* _(listContentByKind(data.kind as any, data.limit))
            const mediaService = yield* _(MediaService)

            // Resolve image URLs in parallel
            return yield* _(
                Effect.forEach(contentItems, (item) => Effect.gen(function* (_) {
                    let imageUrl: string | null = null

                    // Extract featured image storage path if available
                    const media = Option.getOrNull(item.media)
                    const featured = media ? Option.getOrNull(media.featured) : null
                    
                    if (featured) {
                        // Generate signed URL
                        const url = yield* _(
                            mediaService.getPublicUrl(featured.storagePath).pipe(
                                Effect.catchAll(() => Effect.succeed(null))
                            )
                        )
                        imageUrl = url
                    }

                    return { ...item, imageUrl, featuredImage: featured }
                }), { concurrency: "unbounded" })
            )
        }).pipe(
            Effect.catchAll((err) => {
                console.error("Failed to fetch content list:", err)
                return Effect.succeed([])
            })
        )
    )

    const ctaLabel = getVal<string>(data.ctaLabel)
    const ctaLink = getVal<string>(data.ctaLink)

    return (
        <section className="w-full py-12 md:py-24 lg:py-32 border-t">
            <div className="container mx-auto px-4 md:px-6">
                 <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl capitalize">
                           Latest {data.kind}
                        </h2>
                        {ctaLabel && ctaLink && (
                            <Link href={ctaLink} className="text-primary hover:underline underline-offset-4">
                                {ctaLabel} →
                            </Link>
                        )}
                    </div>
                 </div>
                 
                 {items.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                          No {data.kind} items found.
                      </div>
                 ) : (
                    <div className="grid gap-6 py-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-8 auto-rows-[400px]">
                     {items.map((item) => (
                        <Link key={item.id} href={`/${data.kind}/${item.slug}`} className="group relative h-full w-full overflow-hidden rounded-xl bg-muted shadow-md transition-all hover:shadow-xl">
                            {/* Background Image */}
                            {item.imageUrl ? (
                                <Image 
                                    src={item.imageUrl}
                                    alt={item.featuredImage?.altText || item.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-secondary text-muted-foreground">
                                    No Image
                                </div>
                            )}

                            {/* Gradient Overlay for Text Readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 transition-opacity" />

                            {/* Content Foreground */}
                            <div className="absolute bottom-0 left-0 w-full p-6 text-white flex flex-col justify-end h-full">
                                <div className="transform transition-transform duration-300 translate-y-2 group-hover:translate-y-0">
                                    <div className="mb-2">
                                        <span className="inline-block px-2 py-1 text-xs font-medium bg-primary/90 text-primary-foreground rounded-md backdrop-blur-sm">
                                            {new Date(item.audit.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 leading-tight group-hover:text-primary-foreground/90 transition-colors">
                                        {item.title}
                                    </h3>
                                    {Option.isSome(item.excerpt) && (
                                        <p className="text-gray-200 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                            {item.excerpt.value}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Link>
                     ))}
                    </div>
                 )}
            </div>
        </section>
    )
}
