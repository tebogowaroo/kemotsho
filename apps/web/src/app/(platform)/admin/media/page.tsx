import { listMediaAction } from "@/app/actions/media"
import { MediaUploader } from "./_components/media-uploader"
import { MediaGrid, MediaFile } from "./_components/media-grid"

export default async function MediaPage() {
  const result = await listMediaAction()
  const files = result.success ? (result.data as unknown as MediaFile[]) : []

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">Manage your images and documents.</p>
        </div>
        <MediaUploader />
      </div>

      <MediaGrid files={files} />
    </div>
  )
}
