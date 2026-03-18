"use client"

import { useTenant } from "@/components/providers/tenant-provider"
import { useState, useEffect } from "react"
import { Button } from "@/shared/ui/atoms/button"
import { X, Settings } from "lucide-react"

export function ThemeDebug() {
  const config = useTenant()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Only run on client
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || process.env.NODE_ENV !== "development") return null

  if (!isOpen) {
    return (
      <Button 
        intent="outline" 
        size="sm" 
        className="fixed bottom-4 right-4 z-[9999] bg-background shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <Settings className="mr-2 h-4 w-4" />
        Theme Info
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-80 rounded-lg border bg-background p-4 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-semibold">Current Theme Config</h4>
        <Button intent="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4 text-xs">
        <div>
            <div className="mb-1 font-medium text-muted-foreground">Typography</div>
            <div className="grid grid-cols-2 gap-2 rounded bg-muted/50 p-2">
                <div>Heading</div>
                <div className="font-mono">{config.theme.fontHeading}</div>
                <div>Body</div>
                <div className="font-mono">{config.theme.fontBody}</div>
            </div>
        </div>

        <div>
            <div className="mb-1 font-medium text-muted-foreground">Computed Styles</div>
            <div className="rounded bg-muted/50 p-2 font-mono">
                <div className="grid grid-cols-[1fr,auto] gap-2">
                    <span>--font-heading</span>
                    <span style={{ fontFamily: "var(--font-heading)" }}>Sample</span>
                </div>
                <div className="grid grid-cols-[1fr,auto] gap-2 mt-1">
                    <span>--font-body</span>
                    <span style={{ fontFamily: "var(--font-body)" }}>Sample</span>
                </div>
            </div>
        </div>

        <div>
            <div className="mb-1 font-medium text-muted-foreground">Environment</div>
            <code className="block break-all rounded bg-muted/50 p-2">
               {config.id}
            </code>
        </div>
      </div>
    </div>
  )
}
