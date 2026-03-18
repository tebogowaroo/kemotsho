import { FeaturedProductsHeroSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"
import { listProductsAction } from "@/app/actions/products"
import Link from "next/link"
import { formatCurrency } from "@kemotsho/core/lib/utils"
import { Button } from "@/shared/ui/atoms/button"
import { ArrowRight } from "lucide-react"
import { Option } from "effect"

interface FeaturedProductsHeroProps {
    data: Schema.Schema.Type<typeof FeaturedProductsHeroSection>["data"]
}

export async function FeaturedProductsHero({ data }: FeaturedProductsHeroProps) {
    // 1. Fetch available products (server-side)
    // Note: In a real high-scale scenario, we'd fetch ONLY the IDs needed (e.g. getProductsByIdsAction).
    // For now, listing all and filtering is fine for typical small catalogs.
    const res = await listProductsAction()
    
    if (!res.success || !data.productIds || data.productIds.length === 0) {
        return null
    }

    // 2. Filter and Sort to match the order of IDs selected
    const products = data.productIds
        .map(id => res.data.find(p => p.id === id))
        .filter(p => p !== undefined) // remove if not found (e.g. deleted)

    if (products.length === 0) return null

    const getVal = <T,>(opt: any): T | null => {
        if (!opt) return null
        if (opt._tag === "Some") return opt.value
        if (opt._tag === "None") return null
        if (typeof opt === 'object' && opt !== null && "_tag" in opt) return null // safe guard
        return opt 
    }

    const title = getVal<string>(data.title)
    const subtitle = getVal<string>(data.subtitle)

    return (
        <section className="py-12 md:py-24 bg-background border-t">
            <div className="container mx-auto px-4 md:px-6">
                 <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
                    <div className="space-y-2">
                         {title && (
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl capitalize">
                                {title}
                            </h2>
                        )}
                         {subtitle && (
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                {subtitle}
                            </p>
                        )}
                    </div>
                 </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[400px] md:h-[500px]">
                    {products.map((product) => (
                        <Link 
                            key={product.id} 
                            href={`/products/${product.slug}`}
                            className="group relative h-full w-full overflow-hidden rounded-xl bg-muted"
                        >
                            {/* Image Background */}
                            {product.images?.[0] ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={product.images[0]}
                                    alt={product.title}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <div className="h-full w-full bg-secondary flex items-center justify-center text-muted-foreground">
                                    No Image
                                </div>
                            )}

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity" />

                            {/* Content Overlay */}
                            <div className="absolute bottom-0 left-0 p-6 w-full transform transition-transform duration-300 translate-y-2 group-hover:translate-y-0">
                                <h3 className="text-xl font-bold text-white mb-2 leading-tight">
                                    {product.title}
                                </h3>
                                
                                <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                                    <p className="text-white/90 font-medium">
                                        {product.price 
                                            ? formatCurrency(product.price)
                                            : "View Details"}
                                    </p>
                                    <div className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center">
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
