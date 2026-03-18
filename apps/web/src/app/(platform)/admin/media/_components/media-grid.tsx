"use client"

import { Card } from "@/shared/ui/atoms/card"
import { cn } from "@kemotsho/core/lib/utils"

export interface MediaFile {
  id: string
  name: string // maps to originalFilename or just a display name
  url: string // publicUrl
  storagePath: string
  altText?: string | null
}

interface MediaGridProps {
  files: any[] // relaxed type to match API return better
  onSelect?: (file: MediaFile) => void
  selectedFile?: MediaFile | null
}

export function MediaGrid({ files, onSelect, selectedFile }: MediaGridProps) {
  // Mapper to normalize API data to UI model if needed, but new MediaItem matches closely
  const items = files.map(f => ({
      id: f.id,
      name: f.originalFilename || f.name, // Support both new and old structure
      url: f.publicUrl || f.url,
      storagePath: f.storagePath,
      altText: f.altText
  }))

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((file) => (
        <Card 
          key={file.id} 
          className={cn(
            "overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all",
            selectedFile?.id === file.id && "ring-2 ring-primary"
          )}
          onClick={() => onSelect?.(file)}
        >
          <div className="aspect-square relative group">
            <img 
              src={file.url} 
              alt={file.name}
              className="object-cover w-full h-full transition-transform group-hover:scale-105"
            />
          </div>
          <div className="p-2 text-xs truncate text-center text-muted-foreground">
            {file.name.replace("uploads/", "").split("-").slice(1).join("-")}
          </div>
        </Card>
      ))}
      {files.length === 0 && (
         <div className="col-span-full h-48 flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
            No media files found.
         </div>
      )}
    </div>
  )
}
