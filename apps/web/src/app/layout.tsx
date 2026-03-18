import { getActiveModules } from "@kemotsho/core/config/modules";
import type { Metadata } from "next";
import { getFont } from "@kemotsho/core/config/fonts";
import "./globals.css";
import { getTenantConfig } from "@kemotsho/core/config/tenant";
import { TenantProvider } from "@/components/providers/tenant-provider";
import { CartSheet } from "@/components/commerce/cart-sheet";
import { Toaster as SonnerToaster } from "sonner";
import { Toaster } from "@kemotsho/core/ui/toaster";

export async function generateMetadata(): Promise<Metadata> {
  const config = getTenantConfig();
  return {
    title: config.name,
    description: `Welcome to ${config.name}`,
    icons: config.assets.faviconUrl ? [{ url: config.assets.faviconUrl }] : undefined
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = getTenantConfig();
  // Serialize config to plain object to pass to Client Component
  const serializableConfig = JSON.parse(JSON.stringify(config));

  // Font Selection
  const headingFont = getFont(config.theme.fontHeading);
  const bodyFont = getFont(config.theme.fontBody);

  // Dynamic Theme Variables
  const themeStyle = {
    "--font-heading": `var(${headingFont.variableName})`,
    "--font-body": `var(${bodyFont.variableName})`,
    "--radius": config.theme.radius,
    "--border-width": config.theme.borderWidth,
    // Color Overrides (Hex supported in Tailwind v4)
    "--primary": config.theme.primary,
    ...(config.theme.primaryForeground && { "--primary-foreground": config.theme.primaryForeground }),
    ...(config.theme.secondary && { "--secondary": config.theme.secondary }),
    ...(config.theme.accent && { "--accent": config.theme.accent }),

    // Base Colors
    ...(config.theme.background && { "--background": config.theme.background }),
    ...(config.theme.foreground && { "--foreground": config.theme.foreground }),
  } as React.CSSProperties;

  const activeModules = getActiveModules(config);
  const providers = activeModules.flatMap(m => m.globalProviders || []);

  const wrappedContent = providers.reduceRight((acc, Provider) => (
    <Provider>{acc}</Provider>
  ), (
    <>
      {children}
      {config.features.commerce && <CartSheet />}
      <SonnerToaster />
      <Toaster />
    </>
  ));

  return (
    <html lang="en">
      <body
        className={`${headingFont.font.variable} ${bodyFont.font.variable} ${bodyFont.font.className} antialiased`}
        style={themeStyle}
      >
        <TenantProvider config={serializableConfig}>
          {wrappedContent}
        </TenantProvider>
      </body>
    </html>
  );
}
