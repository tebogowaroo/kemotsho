import { ReactNode } from "react"
import { SiteHeader } from "./site-header"
import { Footer } from "./site-footer"
import { TenantConfig } from "@kemotsho/core/config/tenant"
import { MenuItem } from "@kemotsho/platform-cms/navigation/domain/MenuItem"

export function StandardLayout({ 
    children, 
    config,
    menu
}: { 
    children: ReactNode
    config: TenantConfig
    menu: ReadonlyArray<MenuItem>
}) {
    return (
        <div className="flex min-h-screen flex-col">
          <SiteHeader config={config} menu={menu} />
          <main className="flex-1">
              {children}
          </main>
          <Footer config={config} />
        </div>
    )
}
