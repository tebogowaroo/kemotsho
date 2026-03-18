import Link from "next/link"
import { TenantConfig } from "@kemotsho/core/config/tenant"
import { MenuItem } from "@kemotsho/platform-cms/navigation/domain/MenuItem"
import { ChevronDown } from "lucide-react"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/shared/ui/atoms/navigation-menu"
import { cn } from "@kemotsho/core/lib/utils"
import { CartTrigger } from "@/components/commerce/cart-trigger"
import { AuthStatus } from "@/components/auth/auth-status"

interface HeaderProps {
    config: TenantConfig
    menu?: ReadonlyArray<MenuItem>
}

export function SiteHeader({ config, menu = [] }: HeaderProps) {
    return (
        <header className="sticky  top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between  px-4 md:px-6">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl mr-8 ">
                    {/* If logoUrl exists, could render an Image here using config.assets.logoUrl */}
                    {config.assets.logoUrl ? (
                         // eslint-disable-next-line @next/next/no-img-element
                        <img src={config.assets.logoUrl} alt={config.name} className="h-20 w-auto" />
                    ) : (
                        <span>{config.name}</span>
                    )}
                </Link>
                <div className="hidden md:flex flex-1 justify-end  ">
                  <NavigationMenu className=" ">
                    <NavigationMenuList>
                      {menu.map(item => (
                        <NavigationMenuItem key={item.id}>
                          {item.children && item.children.length > 0 ? (
                            <>
                              <NavigationMenuTrigger asChild>
                                <Link 
                                    href={item.path || "#"} 
                                    className="group flex flex-1 list-none items-center justify-center space-x-1"
                                >
                                    {item.label}
                                    <ChevronDown
                                        className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
                                        aria-hidden="true"
                                    />
                                </Link>
                              </NavigationMenuTrigger>
                              <NavigationMenuContent>
                                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]  ">
                                  {item.children.map((child) => (
                                    <li key={child.id}>
                                      <NavigationMenuLink asChild>
                                        <Link
                                          href={child.path}
                                          target={child.target}
                                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                        >
                                          <div className="text-sm font-medium leading-none">{child.label}</div>
                                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                            {/* We could add descriptions to MenuItem schema later */}
                                          </p>
                                        </Link>
                                      </NavigationMenuLink>
                                    </li>
                                  ))}
                                </ul>
                              </NavigationMenuContent>
                            </>
                          ) : (
                            <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent")}>
                              <Link href={item.path}>
                                {item.label}
                              </Link>
                            </NavigationMenuLink>
                          )}
                        </NavigationMenuItem>
                      ))}
                      {!menu.length && (
                        <NavigationMenuItem>
                          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                            <Link href="/">Home</Link>
                          </NavigationMenuLink>
                        </NavigationMenuItem>
                      )}
                    </NavigationMenuList>
                  </NavigationMenu>
                </div>

                <div className="flex items-center gap-2">
                   <AuthStatus config={config} />
                   {config.features.commerce && <CartTrigger />}
                </div>
            </div>
        </header>
    )
}
