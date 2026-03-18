import { LogoutButton } from "@/components/auth/client-logout-button"
import Link from "next/link"
import { verifySession } from "@kemotsho/core/lib/auth-dal"
import { redirect } from "next/navigation"
import { User, Lock, Activity, ShoppingBag, MapPin } from "lucide-react"

const MENU_SECTIONS = [
    {
        title: "Account Settings",
        items: [
            { label: "Profile", href: "/account/profile", icon: User },
            { label: "Security", href: "/account/security", icon: Lock },
        ]
    },
    ...(process.env.NEXT_PUBLIC_ENABLE_MEDICAL_PRACTICE === 'true' ? [{
        title: "Medical",
        items: [
             { label: "Patient Portal", href: "/account/portal", icon: Activity }
        ]
    }] : []),
    ...(process.env.NEXT_PUBLIC_ENABLE_COMMERCE === 'true' ? [{
        title: "Shopping",
        items: [
             { label: "My Orders", href: "/account/orders", icon: ShoppingBag },
             { label: "Address Book", href: "/account/addresses", icon: MapPin }
        ]
    }] : [])
]

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession()

  if (!session) {
    const target = process.env.NEXT_PUBLIC_ENABLE_COMMERCE === 'true' ? "/account/orders" : "/account/portal"
    redirect(`/login?redirect=${target}`)
  }

  return (
    <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-6 px-4">
             {MENU_SECTIONS.map((section) => (
               <div key={section.title}>
                 <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                   {section.title}
                 </h3>
                 <div className="space-y-1">
                   {section.items.map((item) => (
                     <Link 
                        key={item.href}
                        href={item.href} 
                        className="flex items-center gap-2 p-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors font-medium"
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                     </Link>
                   ))}
                  </div>
               </div>
             ))}
             
             <div className="pt-4 mt-auto border-t">
               <LogoutButton variant="ghost" className="w-full justify-start gap-2 pl-2" />
             </div>
          </nav>
        </aside>
        <div className="flex-1 lg:max-w-4xl min-h-[50vh]">{children}</div>
      </div>
    </div>
  )
}
