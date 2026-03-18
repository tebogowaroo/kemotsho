"use client"

import { useActionState, useEffect } from "react"
import { createContentAction } from "@/app/actions/content"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/atoms/select"
import { Textarea } from "@/shared/ui/atoms/textarea"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { MediaPicker } from "@/app/(platform)/admin/media/_components/media-picker"
import { MediaFile } from "@/app/(platform)/admin/media/_components/media-grid"
import { useState } from "react"
import { RichTextEditor } from "@/shared/ui/atoms/rich-text-editor"
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

export function CreateContentForm() {
  const router = useRouter()
  const [featuredImage, setFeaturedImage] = useState<MediaFile | null>(null)
  const [content, setContent] = useState("")

  // Title & Slug Sync Logic
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [isSlugSynced, setIsSlugSynced] = useState(true)

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value
      setTitle(newTitle)
      if (isSlugSynced) {
          setSlug(slugify(newTitle))
      }
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSlug(e.target.value)
      setIsSlugSynced(false)
  }

  const handleAction = async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
     const data = Object.fromEntries(formData.entries())
     const result = await createContentAction(data)
     
     if (result.success) {
         return { success: true, data: result.data }
     } else {
         return { success: false, error: result.error || "Unknown Error", details: (result as any).details }
     }
  }

  const [state, formAction, isPending] = useActionState(handleAction, initialState)

  useEffect(() => {
    if (state.success) {
      router.push("/admin/content")
    }
  }, [state.success, router])

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create Content</CardTitle>
        <CardDescription>
          Add a new article, page, or post to your site.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="kind">Content Type</Label>
            <Select name="kind" defaultValue="blog">
              <SelectTrigger id="kind">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blog">Blog Post</SelectItem>
                <SelectItem value="news">News Article</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="product">Product</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input 
                id="title" 
                name="title" 
                placeholder="My New Awesome Post" 
                required 
                value={title}
                onChange={handleTitleChange}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input 
                id="slug" 
                name="slug" 
                placeholder="my-new-awesome-post" 
                required 
                value={slug}
                onChange={handleSlugChange}
            />
            <p className="text-xs text-muted-foreground">URL-friendly unique identifier.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="excerpt">Short Description / Excerpt</Label>
            <Textarea 
                id="excerpt" 
                name="excerpt" 
                placeholder="A brief summary of this content used for listings and SEO..." 
                rows={3} 
                maxLength={160}
            />
            <p className="text-xs text-muted-foreground text-right">Max 160 characters</p>
          </div>

          <div className="grid gap-2">
            <Label>Featured Image</Label>
            <div className="flex flex-col gap-4 items-start">
                {featuredImage && (
                    <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border bg-muted">
                        <img src={featuredImage.url} alt="Featured" className="object-cover w-full h-full" />
                        <Button 
                            intent="danger" 
                            size="sm" 
                            className="absolute top-2 right-2 h-6 px-2"
                            type="button"
                            onClick={() => setFeaturedImage(null)}
                        >
                            Remove
                        </Button>
                    </div>
                )}
                {!featuredImage && <MediaPicker onSelect={setFeaturedImage} />}
                <input type="hidden" name="featuredImagePath" value={featuredImage?.storagePath || ""} />
                <input type="hidden" name="featuredImageAlt" value="" /> 
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

          <input type="hidden" name="authorId" value="user_123" />
          
          {state.error && (
             <div className="text-sm font-medium text-destructive">
                {state.error}
             </div>
          )}
        </CardContent>
        <CardFooter className="justify-between">
          <Button intent="ghost" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Content
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
