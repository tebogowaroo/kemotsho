import { getProductAction } from "@/app/actions/products"
import { notFound } from "next/navigation"
import { ProductEditorForm } from "./_components/product-editor-form"

export default async function ProductEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const result = await getProductAction(id)

    if (!result.success || !result.data) {
        notFound()
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <ProductEditorForm product={result.data} />
        </div>
    )
}
