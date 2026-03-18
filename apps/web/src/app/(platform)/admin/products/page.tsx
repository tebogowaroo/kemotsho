import { listProductsAction, createProductAction } from "@/app/actions/products"
import { Button } from "@/shared/ui/atoms/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/atoms/table"
import { Plus, MoreHorizontal, AlertCircle } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@kemotsho/core/lib/utils"
import { Badge } from "@/shared/ui/atoms/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/atoms/dropdown-menu"
import { deleteProductAction } from '@/app/actions/products'
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export default async function ProductsPage() {
    const result = await listProductsAction()

    if (!result.success) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-destructive">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>Failed to load products</p>
                <div className="mt-2 text-xs font-mono bg-secondary p-2 rounded">
                    {JSON.stringify(result.error, null, 2)}
                </div>
            </div>
        )
    }

    const products = result.data

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Products</h1>
                <form action={async () => {
                   "use server"
                    // Quick create template
                    const result = await createProductAction({
                        title: "New Product",
                        slug: crypto.randomUUID() as any, // Will be auto-generated later but needs to be valid branded string now if schema checks it strict
                        images: [],
                        currency: "ZAR", // Default
                        isPurchasable: false,
                        isPublished: false,
                        description: null,
                        sku: null,
                        price: null,
                        buyLink: null,
                        id: crypto.randomUUID() as any, // Temporary ID to satisfy TS, ignored by create
                        createdAt: new Date().toISOString(), 
                        updatedAt: new Date().toISOString(),
                        stockStatus: "in_stock",
                        stockQuantity: 0,
                        category: null,
                        specifications: [],
                        variants: [],
                        variantOverrides: []
                    })
                    if (result.success && result.data) {
                        redirect(`/admin/products/${result.data.id}`)
                    }
                }}>
                    <Button type="submit">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                    </Button>
                </form>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px] hidden md:table-cell">Image</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead className="hidden md:table-cell">SKU</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead className="hidden md:table-cell">Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.length === 0 && (
                             <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        )}
                        {products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="hidden md:table-cell">
                                    {product.images[0] ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={product.images[0]}
                                            alt={product.title}
                                            className="h-10 w-10 rounded-md object-cover border"
                                        />
                                    ) : (
                                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                            <Package2 className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">
                                    <Link href={`/admin/products/${product.id}`} className="hover:underline">
                                        {product.title}
                                    </Link>
                                    <div className="text-xs text-muted-foreground md:hidden truncate max-w-[150px]">
                                        {product.sku}
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">{product.sku || "-"}</TableCell>
                                <TableCell>
                                    {product.price 
                                        ? formatCurrency(product.price) 
                                        : <span className="text-muted-foreground italic">Contact</span>
                                    }
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <Badge variant={product.isPublished ? "default" : "secondary"}>
                                        {product.isPublished ? "Published" : "Draft"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button intent="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/admin/products/${product.id}`}>Edit</Link>
                                            </DropdownMenuItem>
                                            {/* <DropdownMenuItem>View on Site</DropdownMenuItem> */}
                                            <DropdownMenuSeparator />
                                            <form action={async () => {
                                                "use server"
                                                await deleteProductAction(product.id)
                                            }}>
                                                <button className="w-full text-left cursor-default select-none rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-destructive focus:bg-destructive/10">
                                                    Delete
                                                </button>
                                            </form>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </main>
    )
}

function Package2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
      <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
      <path d="M12 3v6" />
    </svg>
  )
}
