import { listContentAction } from "@/app/actions/content"
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
import { Plus, PenLine } from "lucide-react"
import Link from "next/link"

export default async function ContentPage() {
  const result = await listContentAction()
  
  const content = result.success ? (result.data as any[]) : []

  return (
     <div className="flex flex-col gap-8 p-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Content</h1>
                <p className="text-muted-foreground">Manage your articles, news, and pages.</p>
            </div>
             <Button asChild>
                <Link href="/admin/content/new">
                    <Plus className="mr-2 h-4 w-4" />
                    New Content
                </Link>
            </Button>
        </div>

        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {content && content.length > 0 ? content.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">
                                <Link href={`/admin/content/${item.id}`} className="hover:underline">
                                    {item.title}
                                </Link>
                                <div className="text-xs text-muted-foreground">{item.slug}</div>
                            </TableCell>
                            <TableCell className="capitalize">{item.kind}</TableCell>
                            <TableCell>
                                <Badge variant={item.lifecycle.status === "published" ? "default" : "secondary"}>
                                    {item.lifecycle.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button intent="ghost" size="icon" asChild>
                                    <Link href={`/admin/content/${item.id}`}>
                                        <PenLine className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                             <TableCell colSpan={4} className="h-24 text-center">
                                No content found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
     </div>
  )
}
