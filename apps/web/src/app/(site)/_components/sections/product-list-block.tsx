
import { ProductListSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"
import { listProductsAction } from "@/app/actions/products"
import { ProductFilterableList } from "./product-filterable-list"
import { Option } from "effect"

type ProductListData = Schema.Schema.Type<typeof ProductListSection>["data"]

export async function ProductListBlock({ data }: { data: ProductListData }) {
    // Fetch products
    const res = await listProductsAction()
    const allProducts = res.success && res.data ? res.data : []
    
    // Filter published
    let products = allProducts.filter((p: any) => p.isPublished)

    // Only apply limit if we are NOT showing the filter bar.
    // If we show the filter bar, we want the user to be able to filter through the entire catalog.
    let displayProducts = products
    if (!data.showFilterBar) {
        displayProducts = products.slice(0, 8) // Default limit
    }

    if (displayProducts.length === 0) return null

    return (
        <section className="py-12 md:py-16">
            <div className="container px-4 md:px-6">
                 {(Option.getOrNull(data.title) || Option.getOrNull(data.subtitle)) && (
                    <div className="flex flex-col items-center justify-center space-y-4 text-center mb-8">
                         <div className="space-y-2">
                             {Option.getOrNull(data.title) && (
                                 <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">{Option.getOrNull(data.title)}</h2>
                             )}
                             {Option.getOrNull(data.subtitle) && (
                                 <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                     {Option.getOrNull(data.subtitle)}
                                 </p>
                             )}
                         </div>
                    </div>
                )}

                <ProductFilterableList 
                    products={displayProducts}
                    showFilterBar={!!data.showFilterBar}
                    showPrices={!!data.showPrices}
                    showBuyButton={!!data.showBuyButton}
                />
            </div>
        </section>
    )
}
