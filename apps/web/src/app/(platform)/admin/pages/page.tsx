import { listPagesAction } from "@/app/actions/pages"
import { Button } from "@/shared/ui/atoms/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/atoms/table"
import { Badge } from "@/shared/ui/atoms/badge"
import { Plus, PenLine, Globe } from "lucide-react"
import Link from "next/link"

export default async function PagesPage() {
  const result = await listPagesAction()
  
  const pages = result.success ? (result.data as any[]) : []

  return (
     <div className="flex flex-col gap-8 p-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Pages</h1>
                <p className="text-muted-foreground">Manage your website's landing pages and structure.</p>
            </div>
             <Button asChild>
                <Link href="/admin/pages/new">
                    <Plus className="mr-2 h-4 w-4" />
                    New Page
                </Link>
            </Button>
        </div>

        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pages && pages.length > 0 ? pages.map((page) => (
                        <TableRow key={page.id}>
                            <TableCell className="font-medium">
                                <Link href={`/admin/pages/${page.id}`} className="hover:underline">
                                    {page.title}
                                </Link>
                            </TableCell>
                            <TableCell>
                                <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                                    {page.slug}
                                </code>
                            </TableCell>
                            <TableCell>
                                <Badge variant={page.isPublished ? "default" : "secondary"}>
                                    {page.isPublished ? "Published" : "Draft"}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {new Date(page.updatedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right flex justify-end gap-2">
                                <Button intent="ghost" size="icon" asChild>
                                    <Link href={`/${page.slug}`} target="_blank" title="View Live">
                                        <Globe className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button intent="ghost" size="icon" asChild>
                                    <Link href={`/admin/pages/${page.id}`}>
                                        <PenLine className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                             <TableCell colSpan={5} className="h-24 text-center">
                                No pages found. Create your first page above.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
     </div>
  )
}
