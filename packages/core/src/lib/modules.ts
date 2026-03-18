import { ReactNode, ComponentType } from "react";
import { TenantConfig } from "@kemotsho/core/config/tenant";
import { LucideIcon } from "lucide-react";

export interface ModuleDefinition {
  id: string;
  name: string;
  // Function to check if enabled in config
  isEnabled: (config: TenantConfig) => boolean; 
  // Admin Sidebar Items
  adminNavInfo?: {
    label: string;
    href: string;
    icon: LucideIcon;
    matches?: string[]; // Optional: for active state matching if href is not enough
  }[];
  // Providers to wrap the App with (e.g. CartProvider)
  globalProviders?: ComponentType<{ children: ReactNode }>[];
}
