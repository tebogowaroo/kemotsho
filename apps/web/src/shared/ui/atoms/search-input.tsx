"use client"

import { Input } from "./input"
import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { useCallback } from "react"

export function SearchInput({ placeholder = "Search posts..." }: { placeholder?: string }) {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { replace } = useRouter()

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleSearch = useCallback(
        debounce((term: string) => {
            const params = new URLSearchParams(searchParams)
            params.set("page", "1")
            if (term) {
                params.set("q", term)
            } else {
                params.delete("q")
            }
            replace(`${pathname}?${params.toString()}`)
        }, 300),
        [pathname, replace, searchParams]
    )

    return (
        <div className="relative w-full max-w-md mx-auto mb-8">
            <Input
                type="search"
                placeholder={placeholder}
                defaultValue={searchParams.get("q")?.toString()}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
            />
        </div>
    )
}

function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}
