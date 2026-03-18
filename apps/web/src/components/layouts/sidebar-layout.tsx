import { ReactNode } from "react"
import { TenantConfig } from "@kemotsho/core/config/tenant"
import Link from "next/link"
import { MenuItem } from "@kemotsho/platform-cms/navigation/domain/MenuItem"

export function SidebarLayout({ 
    children, 
    config,
    menu = []
}: { 
    children: ReactNode
    config: TenantConfig
    menu?: ReadonlyArray<MenuItem>
}) {
    return (
        <div className="flex min-h-screen">
            <aside className="w-64 border-r bg-muted/20 min-h-screen p-6 hidden md:block sticky top-0 h-screen overflow-y-auto">
                <div className="font-bold text-xl mb-8">
                     {config.assets.logoUrl ? (
                         // eslint-disable-next-line @next/next/no-img-element
                        <img src={config.assets.logoUrl} alt={config.name} className="h-8 w-auto" />
                    ) : (
                        <span>{config.name}</span>
                    )}
                </div>
                <nav className="flex flex-col gap-4">
                    {menu.map(item => (
                         <Link key={item.id} href={item.path} target={item.target} className="hover:text-primary transition-colors">
                             {item.label}
                         </Link>
                    ))}
                    {!menu.length && (
                        <>
                            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
                            <Link href="/services" className="hover:text-primary transition-colors">Services</Link>
                            <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
                        </>
                    )}
                </nav>
            </aside>
            <main className="flex-1 p-6">
                {children}
            </main>
        </div>
    )
}
