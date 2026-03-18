
import { getProductBySlugAction } from "@/app/actions/products"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { ProductGallery } from "./_components/product-gallery"
import { ProductDetails } from "./_components/product-details"
import { Option } from "effect"
import { getTenantConfig } from "@kemotsho/core/config/tenant"

interface ProductPageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    const slug = (await params).slug
    const res = await getProductBySlugAction(slug)
    
    if (!res.success || !res.data) {
        return { title: 'Product Not Found' }
    }

    const product = res.data
    // Handle Option type in metadata if needed, though most metatags want simple strings
    const description = product.description

    return {
        title: product.title,
        description: description || `Buy ${product.title}`,
        // eslint-disable-next-line @next/next/no-img-element
        openGraph: {
            images: product.images[0] ? [product.images[0]] : []
        }
    }
}

export default async function ProductPage({ params }: ProductPageProps) {
    const config = getTenantConfig();
    if (!config.features.commerce) {
        notFound();
    }

    const slug = (await params).slug
    const res = await getProductBySlugAction(slug)

    if (!res.success || !res.data) {
        notFound()
    }

    const product = res.data

    return (
        <div className="container px-4 md:px-6 py-12">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                {/* Interactive Image Gallery */}
                <ProductGallery images={[...product.images]} title={product.title} />

                {/* Product Info (Interactive) */}
                <ProductDetails product={product} />
            </div>
        </div>
    )
}
