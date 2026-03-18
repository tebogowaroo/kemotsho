"use client"

import { TenantConfig } from "@kemotsho/core/config/tenant"
import { createContext, useContext, ReactNode } from "react"

const TenantContext = createContext<TenantConfig | null>(null)

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) throw new Error("useTenant must be used within TenantProvider")
  return context
}

export function TenantProvider({
  config,
  children,
}: {
  config: TenantConfig
  children: ReactNode
}) {
  return (
    <TenantContext.Provider value={config}>
      <style dangerouslySetInnerHTML={{
        __html: `
        :root {
          --primary: ${config.theme.primary};
          --primary-foreground: ${config.theme.primaryForeground || "#ffffff"};
          --radius: ${config.theme.radius};
          ${config.theme.secondary ? `--secondary: ${config.theme.secondary};` : ''}
          ${config.theme.accent ? `--accent: ${config.theme.accent};` : ''}
          ${config.theme.background ? `--background: ${config.theme.background};` : ''}
          ${config.theme.foreground ? `--foreground: ${config.theme.foreground};` : ''}
        }
        `
      }} />
      {children}
    </TenantContext.Provider>
  )
}
