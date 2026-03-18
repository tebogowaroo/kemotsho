"use client"

import { useActionState, useEffect, useState } from "react"
import { updateContentAction } from "@/app/actions/content"
import { Button } from "@/shared/ui/atoms/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/atoms/card"
import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import { Textarea } from "@/shared/ui/atoms/textarea"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { MediaPicker } from "@/app/(platform)/admin/media/_components/media-picker"
import { MediaFile } from "@/app/(platform)/admin/media/_components/media-grid"
import { RichTextEditor } from "@/shared/ui/atoms/rich-text-editor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/atoms/select"
import { slugify } from "@kemotsho/core/lib/utils"

type ActionState = {
  success: boolean
  error?: string
  data?: any
  details?: any
}

const initialState: ActionState = {
  success: false,
  error: "",
  data: null
}

interface EditContentFormProps {
    initialData: any // using any for simplicity, but ideally ContentItem
}

export function EditContentForm({ initialData }: EditContentFormProps) {
  const router = useRouter()
  
  // Reconstruct MediaFile logic from initialData
  // Note: initialData is Serialized JSON, so Option types are unwrapped to nulls.
  // path: media.featured.storagePath (not media.value.featured.value...)
  
  const hasFeatured = initialData.media?.featured
  
  const initialImage: MediaFile | null = hasFeatured ? {
      id: "existing", 
      name: initialData.media.featured.storagePath,
      storagePath: initialData.media.featured.storagePath,
      url: "",
      altText: initialData.media.featured.altText
  } : null
  
  // Use state for Title and Slug to support auto-generation
  const [title, setTitle] = useState(initialData.title || "")
  const [slug, setSlug] = useState(initialData.slug || "")
  
  // Track if the slug is "synced" with the title.
  // Initial check: if the provided slug matches the slugified title, assume synced.
  const [isSlugSynced, setIsSlugSynced] = useState(() => {
     return initialData.slug === slugify(initialData.title || "")
  })

  const [featuredImage, setFeaturedImage] = useState<MediaFile | null>(initialImage)
  const [content, setContent] = useState(initialData.body)

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value
      setTitle(newTitle)
      if (isSlugSynced) {
          setSlug(slugify(newTitle))
      }
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSlug(e.target.value)
      setIsSlugSynced(false) // User manually edited slug, stop syncing
  }

  const handleAction = async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
     const data = Object.fromEntries(formData.entries())
     const result = await updateContentAction(data)
     
     if (result.success) {
         return { success: true, data: result.data }
     } else {
         return { success: false, error: result.error || "Unknown Error", details: (result as any).details }
     }
  }

  const [state, formAction, isPending] = useActionState(handleAction, initialState)

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Edit Content</CardTitle>
        <CardDescription>
          Update existing content.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <input type="hidden" name="id" value={initialData.id} />
        
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input 
                id="title" 
                name="title" 
                value={title} 
                onChange={handleTitleChange} 
                required 
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <div className="flex gap-2">
                <Input 
                    id="slug" 
                    name="slug" 
                    value={slug} 
                    onChange={handleSlugChange}
                    required 
                />
                 <Button 
                    type="button" 
                    intent="outline"
                    size="icon"
                    title="Regenerate Slug from Title"
                    onClick={() => {
                        const newSlug = slugify(title)
                        setSlug(newSlug)
                        setIsSlugSynced(true)
                    }}
                 >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                        <path d="M16 16h5v5" />
                    </svg>
                 </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="excerpt">Short Description / Excerpt</Label>
            <Textarea 
                id="excerpt" 
                name="excerpt" 
                defaultValue={initialData.excerpt || ""}
                placeholder="A brief summary of this content used for listings and SEO..." 
                rows={3} 
                maxLength={160}
            />
            <p className="text-xs text-muted-foreground text-right">Max 160 characters</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
             <Select name="status" defaultValue={initialData.lifecycle?.status || "draft"}>
                <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
             </Select>
          </div>

          <div className="grid gap-2">
            <Label>Featured Image</Label>
            <div className="flex flex-col gap-4 items-start">
                {featuredImage && (
                    <div className="relative w-full max-w-sm overflow-hidden rounded-lg border bg-muted p-4">
                        <p className="text-sm text-muted-foreground break-all">{featuredImage.name}</p>
                        {/* We don't render IMG tag here because we don't have the signed URL yet for existing item */}
                        <Button 
                            intent="danger" 
                            size="sm" 
                            className="mt-2"
                            type="button"
                            onClick={() => setFeaturedImage(null)}
                        >
                            Remove
                        </Button>
                    </div>
                )}
                {!featuredImage && <MediaPicker onSelect={setFeaturedImage} />}
                <input type="hidden" name="featuredImagePath" value={featuredImage?.storagePath || ""} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Content</Label>
             <RichTextEditor 
                value={content}
                onChange={setContent}
                className="min-h-[300px]"
            />
            <input type="hidden" name="body" value={content} />
          </div>

          {!state.success && state.error && (
             <div className="text-sm font-medium text-destructive">
                {state.error}
             </div>
          )}
          {state.success && (
              <div className="text-sm font-medium text-green-600">
                  Content updated successfully.
              </div>
          )}
        </CardContent>
        <CardFooter className="justify-between">
          <Button intent="ghost" type="button" onClick={() => router.back()}>
            Back
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
