import { Package2, ShoppingBagIcon, Ticket, Settings, LineChart } from "lucide-react";
import { ModuleDefinition } from "@kemotsho/core/lib/modules";
import { CartProvider } from "@/components/providers/cart-provider";

export const CommerceModule: ModuleDefinition = {
  id: "commerce",
  name: "E-Commerce Store",
  isEnabled: (c) => c.features.commerce,
  
  adminNavInfo: [
    { 
        label: "Products", 
        href: "/admin/products", 
        icon: Package2 
    },
    { 
        label: "Orders", 
        href: "/admin/orders", 
        icon: ShoppingBagIcon 
    },
    {
        label: "Marketing",
        href: "/admin/marketing",
        icon: Ticket
    },
    {
        label: "Settings",
        href: "/admin/settings",
        icon: Settings
    },
    {
        label: "Analytics",
        href: "/admin/analytics",
        icon: LineChart
    }
  ],
  
  globalProviders: [CartProvider] 
};
