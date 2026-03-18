import { notFound } from "next/navigation";
import { getTenantConfig } from "@kemotsho/core/config/tenant";

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
    const config = getTenantConfig();
    if (!config.features.commerce) {
        return notFound();
    }
    return <>{children}</>;
}
