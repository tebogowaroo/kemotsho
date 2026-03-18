"use client"

import { useEffect, useState } from "react"
import { User } from "firebase/auth"
import { auth } from "@kemotsho/core/infra/firebase/client"
import { Button } from "@/shared/ui/atoms/button"
import { UserCheck, User as UserIcon, Package, MapPin, Lock, Activity, ShoppingBag } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/atoms/dropdown-menu"
import { LogoutButton } from "./client-logout-button"
import { TenantConfig } from "@kemotsho/core/config/tenant"

interface AuthStatusProps {
  config?: TenantConfig
}

export function AuthStatus({ config }: AuthStatusProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) return <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />

  if (!user) {
    const showRegister = config ? (config.features.commerce || config.features.medical) : true

    return (
      <div className="flex items-center gap-2">
        <Button intent="ghost" size="sm" asChild>
          <Link href="/login">Log In</Link>
        </Button>
        {showRegister && (
            <Button size="sm" asChild>
            <Link href="/register">Sign Up</Link>
            </Button>
        )}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button intent="ghost" size="icon" className="rounded-full">
            <UserIcon className="h-5 w-5" />
            <span className="sr-only">Open user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">My Account</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Settings</DropdownMenuLabel>
        <DropdownMenuItem asChild>
            <Link href="/account/profile" className="cursor-pointer">
                <UserCheck className="mr-2 h-4 w-4" />
                <span>Profile</span>
            </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
            <Link href="/account/security" className="cursor-pointer">
                <Lock className="mr-2 h-4 w-4" />
                <span>Security</span>
            </Link>
        </DropdownMenuItem>

        {config?.features.medical && (
            <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Medical</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <Link href="/account/portal" className="cursor-pointer">
                        <Activity className="mr-2 h-4 w-4" />
                        <span>Patient Portal</span>
                    </Link>
                </DropdownMenuItem>
            </>
        )}
        
        {config?.features.commerce && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Shopping</DropdownMenuLabel>
            <DropdownMenuItem asChild>
                <Link href="/account/orders" className="cursor-pointer">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    <span>My Orders</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/addresses" className="cursor-pointer">
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>Address Book</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        <div className="p-1">
             <div className="flex w-full items-center pl-2">
                 <LogoutButton variant="ghost" className="w-full justify-start gap-2 px-2" />
             </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
