"use client"

import { useActionState, useEffect, useState } from "react"
import { createPageAction } from "@/app/actions/pages"
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
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

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

export function CreatePageForm() {
  const router = useRouter()
  const [slug, setSlug] = useState("")

  const handleAction = async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
     const data = Object.fromEntries(formData.entries())
     const result = await createPageAction(data)
     
     if (result.success) {
         return { success: true, data: result.data }
     } else {
         return { success: false, error: result.error || "Unknown Error", details: (result as any).details }
     }
  }

  const [state, formAction, isPending] = useActionState(handleAction, initialState)

  useEffect(() => {
    if (state.success && state.data?.id) {
      router.push(`/admin/pages/${state.data.id}`)
    }
  }, [state.success, state.data, router])

  const generateSlug = (title: string) => {
    return title.toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create Page</CardTitle>
        <CardDescription>
          Start building a new landing page. You can add sections later.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="grid gap-6">
          
          <div className="grid gap-2">
            <Label htmlFor="title">Page Title</Label>
            <Input 
                id="title" 
                name="title" 
                placeholder="Product Landing Page" 
                required 
                onChange={(e) => setSlug(generateSlug(e.target.value))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">URL Slug</Label>
            <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-sm">/</span>
                <Input 
                    id="slug" 
                    name="slug" 
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="product-landing-page" 
                    required 
                />
            </div>
            <p className="text-xs text-muted-foreground">Unique identifier for the URL (e.g. /my-page).</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="seoTitle">SEO Title (Optional)</Label>
            <Input id="seoTitle" name="seoTitle" placeholder="Browser Tab Title" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="seoDescription">SEO Description (Optional)</Label>
            <Input id="seoDescription" name="seoDescription" placeholder="Search Engine Description" />
          </div>

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
            Create Page
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
