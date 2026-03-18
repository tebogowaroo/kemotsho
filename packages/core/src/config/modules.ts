import { TenantConfig } from "@kemotsho/core/config/tenant";
import { ModuleDefinition } from "@kemotsho/core/lib/modules";
import { CommerceModule } from "@kemotsho/module-commerce/commerce/module";

export const ALL_MODULES: ModuleDefinition[] = [
    CommerceModule,
];

export function getActiveModules(config: TenantConfig) {
    return ALL_MODULES.filter(m => m.isEnabled(config));
}
