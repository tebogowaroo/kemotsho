"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react" 
import { Button } from "@kemotsho/core/ui/button" 
import { cn } from "@kemotsho/core/lib/utils" 
import { logoutAction } from "@/app/actions/auth" 
import { auth } from "@kemotsho/core/infra/firebase/client"
import { signOut } from "firebase/auth"

export function LogoutButton({ variant = "outline", className }: { variant?: "outline" | "ghost" | "default" | "destructive" | "link", className?: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setLoading(true)
    try {
      // 1. Sign out from Firebase Client SDK (clears IndexedDB/localStorage)
      await signOut(auth)

      // 2. Call server action to delete session cookie
      await logoutAction() 
      
      // 3. Refresh and redirect
      router.refresh()
      // router.push("/login") // Handled by server action redirect usually, but safe to have
    } catch (error) {
      console.error("Logout failed", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant={variant} 
      onClick={handleLogout} 
      disabled={loading}
      className={cn("gap-2 justify-start pl-0", className)}
    >
      <LogOut className="h-4 w-4" />
      {loading ? "Logging out..." : "Log out"}
    </Button>
  )
}
