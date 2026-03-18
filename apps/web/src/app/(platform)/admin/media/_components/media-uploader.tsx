"use client"

import { useState, useRef } from "react"
import { getUploadUrlAction, createMediaAction } from "@/app/actions/media"
import { Button } from "@/shared/ui/atoms/button"
import { Upload, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface MediaUploaderProps {
  onUploadComplete?: () => void
}

export function MediaUploader({ onUploadComplete }: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
        setIsUploading(true)

        // 1. Get Signed URL
        const result = await getUploadUrlAction({
            fileName: file.name,
            contentType: file.type
        })

        if (!result.success) {
            throw new Error(result.error)
        }

        const { uploadUrl, storagePath } = result.data as { uploadUrl: string, storagePath: string }

        // 2. Upload to Storage
        const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: {
                "Content-Type": file.type
            }
        })

        if (!uploadRes.ok) {
            throw new Error("Upload failed")
        }

        // 3. Register in Database
        // We can get image dimensions here if we wanted to be fancy (FileReader), but let's keep it simple.
        const registerRes = await createMediaAction({
             originalFilename: file.name,
             storagePath: storagePath,
             mimeType: file.type,
             size: file.size,
             altText: null
        })

        if (!registerRes.success) {
           console.error("Media Registration Failed:", registerRes)
           throw new Error(registerRes.error || "Failed to register media")
        }

        // 4. Refresh UI
        router.refresh()
        onUploadComplete?.()
        
    } catch (error) {
        console.error("Upload Error:", error)
        alert("Failed to upload file")
    } finally {
        setIsUploading(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }
  }

  return (
    <>
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileSelect}
            accept="image/*,application/pdf"
        />
        <Button disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
           {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
           Upload File
        </Button>
    </>
  )
}
