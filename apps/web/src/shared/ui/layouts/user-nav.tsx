"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/atoms/dropdown-menu"
import { Button } from "@/shared/ui/atoms/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/atoms/avatar"
import { logoutAction } from "@/app/actions/auth"
import { auth as clientAuth } from "@kemotsho/core/infra/firebase/client"
import { signOut } from "firebase/auth"

export function UserNav() {
  const handleLogout = async () => {
    // 1. Sign out from Firebase Client (clears IndexedDB/localStorage)
    try {
        await signOut(clientAuth)
    } catch (e) {
        console.error("Firebase SignOut Error", e)
    }
    
    // 2. Call Server Action to clear Session Cookie and Redirect
    await logoutAction()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button intent="secondary" size="icon" className="rounded-full">
          <Avatar>
            <AvatarImage src="" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>Support</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
            Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
