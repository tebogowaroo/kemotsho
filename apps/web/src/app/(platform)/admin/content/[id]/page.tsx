import { getContentAction } from "@/app/actions/content"
import { EditContentForm } from "./_components/edit-content-form"
import { notFound } from "next/navigation"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EditContentPage({ params }: PageProps) {
    const { id } = await params
    const result = await getContentAction(id)
    
    if (!result.success) {
        notFound()
    }
    
    return (
        <div className="flex justify-center p-6">
            <EditContentForm initialData={result.data} />
        </div>
    )
}
