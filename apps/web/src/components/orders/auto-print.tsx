"use client"

import { useEffect } from "react"

export function AutoPrint() {
    useEffect(() => {
        // Short delay to ensure styles load
        const t = setTimeout(() => {
            window.print()
        }, 500)
        return () => clearTimeout(t)
    }, [])
    return null
}
