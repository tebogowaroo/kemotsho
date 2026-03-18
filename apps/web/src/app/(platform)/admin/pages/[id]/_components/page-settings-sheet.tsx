"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updatePageAction } from "@/app/actions/pages"
import { Button } from "@/shared/ui/atoms/button"
import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/shared/ui/atoms/sheet"
import { Settings, Loader2 } from "lucide-react"

interface PageSettingsSheetProps {
    page: any
}

export function PageSettingsSheet({ page }: PageSettingsSheetProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const [formData, setFormData] = useState({
        title: page.title || "",
        slug: page.slug || "",
        seoTitle: page.seo?.title || "",
        seoDescription: page.seo?.description || "",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const result = await updatePageAction({
                id: page.id,
                title: formData.title,
                seoTitle: formData.seoTitle || null,
                seoDescription: formData.seoDescription || null
            })

            if (result.success) {
                setOpen(false)
                router.refresh()
            } else {
                 alert("Failed to update page settings: " + (result.error || "Unknown error"))
            }
        } catch (err) {
            console.error(err)
            alert("An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button intent="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Page Settings</SheetTitle>
                    <SheetDescription>
                        Manage page metadata and SEO settings.
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Internal Title</Label>
                        <Input
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>
                
                    <div className="grid gap-2">
                        <Label htmlFor="slug">URL Slug</Label>
                        <Input
                            id="slug"
                            name="slug"
                            value={formData.slug}
                            disabled 
                        />
                        <p className="text-xs text-muted-foreground">URL slug cannot be changed safely.</p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="seoTitle">SEO Title</Label>
                        <Input
                            id="seoTitle"
                            name="seoTitle"
                            value={formData.seoTitle}
                            onChange={handleChange}
                            placeholder="Browser Tab Title"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="seoDescription">SEO Description</Label>
                        <Input
                            id="seoDescription"
                            name="seoDescription"
                            value={formData.seoDescription}
                            onChange={handleChange}
                            placeholder="Meta description for search engines"
                        />
                    </div>
                    <SheetFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
