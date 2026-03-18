"use client"
import * as React from "react"
import { Button } from "@/shared/ui/atoms/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/atoms/dialog"
import { MediaGrid, MediaFile } from "./media-grid"
import { MediaUploader } from "./media-uploader"
import { listMediaAction } from "@/app/actions/media"
import { Image as ImageIcon, Loader2 } from "lucide-react"

interface MediaPickerProps {
  onSelect: (file: MediaFile) => void
  trigger?: React.ReactNode
}

export function MediaPicker({ onSelect, trigger }: MediaPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [files, setFiles] = React.useState<MediaFile[]>([])
  const [loading, setLoading] = React.useState(false)

  const loadFiles = React.useCallback(async () => {
    setLoading(true)
    const res = await listMediaAction()
    if (res.success) {
      setFiles(res.data as unknown as MediaFile[])
    }
    setLoading(false)
  }, [])

  React.useEffect(() => {
    if (open) {
      loadFiles()
    }
  }, [open, loadFiles])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
            <Button intent="outline">
                <ImageIcon className="mr-2 h-4 w-4" />
                Select Image
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
          <DialogDescription>
            Select an image from your library or upload a new one.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end py-2">
            <MediaUploader onUploadComplete={() => loadFiles()} />
        </div>

        <div className="flex-1 overflow-y-auto border rounded-md p-4">
            {loading ? (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <MediaGrid 
                    files={files} 
                    onSelect={(file) => {
                        onSelect(file)
                        setOpen(false)
                    }} 
                />
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
