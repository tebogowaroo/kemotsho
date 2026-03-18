import { Effect, Option } from "effect"
import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { ContentKind } from "@kemotsho/platform-cms/content/domain/Content"
import { MediaService } from "@kemotsho/platform-cms/media/domain/MediaService"
import { searchContent } from "@kemotsho/platform-cms/content/application/SearchContent"
import { SearchInput } from "@/shared/ui/atoms/search-input"
import { Pagination } from "@/shared/ui/atoms/pagination"
import Link from "next/link"
import Image from "next/image"

interface Props {
    kind: typeof ContentKind.Type
    searchParams: { [key: string]: string | string[] | undefined }
    baseUrl: string
    limit?: number
}

export async function PaginatedContentList({ kind, searchParams, baseUrl, limit = 6 }: Props) {
    const query = typeof searchParams.q === "string" ? searchParams.q : undefined
    const page = typeof searchParams.page === "string" ? Math.max(1, parseInt(searchParams.page)) : 1

    const result = await AppRuntime.runPromise(
        Effect.gen(function* (_) {
            const mediaService = yield* _(MediaService)
            
            // Search core
            const { items, total } = yield* _(
                searchContent({ 
                    kind, 
                    ...(query ? { term: query } : {}),
                    page, 
                    limit 
                })
            )

            // Resolve images
            const enrichedItems = yield* _(
                Effect.forEach(items, (item) => Effect.gen(function* (_) {
                    let imageUrl: string | null = null
                    const media = Option.getOrNull(item.media)
                    const featured = media ? Option.getOrNull(media.featured) : null
                    
                    if (featured) {
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

            return { items: enrichedItems, total, error: null as string | null, link: null as string | null }
        }).pipe(
            Effect.catchAll((err) => {
                console.error("Search failed:", err)
                let errorMessage = "Failed to load content."
                let link = null

                if (err._tag === "UnexpectedError") {
                    const msg = String(err.error)
                    if (msg.includes("requires an index") || msg.includes("FAILED_PRECONDITION")) {
                        errorMessage = "Firestore Index Required"
                        // Try to extract the link
                        const match = msg.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)
                        if (match) link = match[0]
                    }
                }

                return Effect.succeed({ items: [], total: 0, error: errorMessage, link })
            })
        )
    )

    const totalPages = Math.ceil(result.total / limit)

    return (
        <section className="w-full py-12">
            <div className="container mx-auto px-4 md:px-6">
                <SearchInput placeholder={`Search ${kind}...`} />
                
                {result.error ? (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive">
                         <h3 className="font-semibold mb-2">{result.error}</h3>
                         {result.link ? (
                             <p className="text-sm text-foreground/80">
                                 This query requires a new index. <a href={result.link} target="_blank" className="underline font-bold text-destructive hover:text-destructive/80">Click here to create it</a> in the Firebase Console.
                             </p>
                         ) : (
                             <p className="text-sm">Check the server logs for details.</p>
                         )}
                    </div>
                ) : result.items.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No results found found for "{query}".
                    </div>
                ) : (
                    <div className="grid gap-6 py-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                        {result.items.map((item) => (
                            <Link key={item.id} href={`/${kind}/${item.slug}`} className="group h-full">
                                <div className="flex flex-col justify-between space-y-4 border rounded-lg p-6 hover:shadow-lg transition-shadow h-full bg-card text-card-foreground">
                                    <div>
                                        <div className="relative h-48 w-full bg-muted rounded-md overflow-hidden mb-4">
                                            {item.imageUrl ? (
                                                <Image 
                                                    src={item.imageUrl}
                                                    alt={item.featuredImage?.altText || item.title}
                                                    fill
                                                    className="object-cover transition-transform group-hover:scale-105"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-muted-foreground bg-secondary">
                                                    No Image
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                                                {item.title}
                                            </h3>
                                            {Option.isSome(item.excerpt) && (
                                                <p className="text-muted-foreground text-sm line-clamp-3">
                                                    {item.excerpt.value}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pt-4 flex items-center justify-between text-xs text-muted-foreground">
                                        <span>
                                            {new Date(item.audit.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                <Pagination 
                    currentPage={page} 
                    totalPages={totalPages} 
                    baseUrl={baseUrl}
                    queryParams={{ q: query }}
                />
            </div>
        </section>
    )
}
