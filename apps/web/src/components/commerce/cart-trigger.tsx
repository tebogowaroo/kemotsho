"use client"
import { useCart } from "@/components/providers/cart-provider"
import { Button } from "@/shared/ui/atoms/button"
import { ShoppingCart } from "lucide-react"

export function CartTrigger() {
   // If the provider is missing, we simply don't render the trigger
   // This handles the case where commerce module is disabled
   try {
     const { count, setIsOpen } = useCart()
     const hasItems = count > 0

     return (
         <Button intent="ghost" size="icon" className="relative" onClick={() => setIsOpen(true)}>
             <ShoppingCart className="h-5 w-5" />
             {hasItems && (
                 <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white font-bold">
                     {count}
                 </span>
             )}
         </Button>
     )
   } catch {
       return null
   }
}
