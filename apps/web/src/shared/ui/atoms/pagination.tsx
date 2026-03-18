import Link from 'next/link'
import { Button } from './button'

interface PaginationProps {
    currentPage: number
    totalPages: number
    baseUrl: string
    queryParams?: Record<string, string | undefined>
}

export function Pagination({ currentPage, totalPages, baseUrl, queryParams = {} }: PaginationProps) {
    if (totalPages <= 1) return null

    const createPageUrl = (page: number) => {
        const params = new URLSearchParams()
        Object.entries(queryParams).forEach(([key, value]) => {
            if (value) params.set(key, value)
        })
        params.set('page', page.toString())
        return `${baseUrl}?${params.toString()}`
    }

    return (
        <div className="flex gap-2 items-center justify-center mt-8">
            <Button 
                intent="outline" 
                disabled={currentPage <= 1}
                asChild={currentPage > 1}
            >
                {currentPage > 1 ? (
                    <Link href={createPageUrl(currentPage - 1)}>
                        Previous
                    </Link>
                ) : (
                    <span>Previous</span>
                )}
            </Button>
            
            <span className="text-sm font-medium text-muted-foreground mx-2">
                Page {currentPage} of {totalPages}
            </span>

            <Button 
                intent="outline" 
                disabled={currentPage >= totalPages}
                asChild={currentPage < totalPages}
            >
                {currentPage < totalPages ? (
                    <Link href={createPageUrl(currentPage + 1)}>
                        Next
                    </Link>
                ) : (
                    <span>Next</span>
                )}
            </Button>
        </div>
    )
}
