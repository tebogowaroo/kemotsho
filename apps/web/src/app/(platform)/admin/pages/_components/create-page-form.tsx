"use client"

import { useActionState, useEffect } from "react"
import { createPageAction } from "@/app/actions/pages"
import { Button } from "@/shared/ui/atoms/button"
import {
  Card,
  CardContent,
  CardDescription,
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
  
  const handleAction = async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
       const title = formData.get("title") as string
       let slug = formData.get("slug") as string
       
       // Basic client-side slug generation if empty
       if (!slug && title) {
           slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
       }

       const payload = {
           title,
           slug,
           seoTitle: title, // Default
           seoDescription: ""
       }

       const result = await createPageAction(payload)
       
       if (result.success) {
           return { success: true, data: result.data }
       } else {
           return { success: false, error: result.error || "Unknown Error", details: (result as any).details }
       }
  }

  const [state, formAction, isPending] = useActionState(handleAction, initialState)

  useEffect(() => {
    if (state.success) {
      router.push("/admin/pages")
    }
  }, [state.success, router])

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Create Page</CardTitle>
        <CardDescription>
          Start building a new landing page. You can add sections later.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="grid gap-6">
            {state.error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {state.error}
                    {state.details && (
                        <pre className="mt-2 w-full overflow-x-auto text-xs opacity-70">
                            {JSON.stringify(state.details, null, 2)}
                        </pre>
                    )}
                </div>
            )}

          <div className="grid gap-2">
            <Label htmlFor="title">Page Title</Label>
            <Input id="title" name="title" placeholder="e.g. Home, About Us" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">URL Slug</Label>
            <Input 
                id="slug" 
                name="slug" 
                placeholder="e.g. / or /about-us" 
                // Removed strict pattern to allow '/' and paths. 
                // We rely on backend validation or a more complex regex if needed.
                // For user friendliness, we can just remove the HTML pattern constraint or use the broad one.
                pattern="^(\/|(\/?[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*))$"
                title="Use '/' for home. Lowercase letters, numbers, hyphens and forward slashes allowed."
                required 
            />
            <p className="text-xs text-muted-foreground">The URL path for this page (e.g. '/' for home).</p>
          </div>

          <div className="flex justify-end pt-4">
             <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Page
             </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}
