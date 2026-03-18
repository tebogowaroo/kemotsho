import { getPageAction } from "@/app/actions/pages"
import { notFound } from "next/navigation"
import { PageEditor } from "./_components/page-editor"

export default async function PageBuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const result = await getPageAction(id)
    
    if (!result.success) {
        notFound()
    }
    
    // Check if sections are missing or malformed in legacy data and ensure they are an array
    const page = result.data
    // Ensure sections is at least an empty array if undefined
    if (!page.sections) {
        page.sections = []
    }

    return (
        <PageEditor page={page} />
    )
}

