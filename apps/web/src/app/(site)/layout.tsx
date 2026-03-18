import { getTenantConfig } from "@kemotsho/core/config/tenant"
import { StandardLayout } from "@/components/layouts/standard-layout"
import { SidebarLayout } from "@/components/layouts/sidebar-layout"
import { GetMenu } from "@kemotsho/platform-cms/navigation/application/GetMenu"
import { FirebaseNavigationRepositoryLive } from "@kemotsho/platform-cms/navigation/infrastructure/FirebaseNavigationRepository"
import { Effect, Layer } from "effect"

const NavigationLive = Layer.provide(
  GetMenu.Default,
  FirebaseNavigationRepositoryLive
)

async function getNavigationMenu() {
   const program = Effect.gen(function* () {
      const getMenu = yield* GetMenu
      return yield* getMenu("main")
   })
   return await Effect.runPromise(program.pipe(Effect.provide(NavigationLive)))
     .catch(() => []); // Prevents Layout render crashing if DB is offline at build
}

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const config = getTenantConfig()
  const plainConfig = JSON.parse(JSON.stringify(config))
  const menu = await getNavigationMenu()

  if (config.layout === "sidebar") {
    return <SidebarLayout config={plainConfig} menu={menu}>{children}</SidebarLayout>
  }

  return <StandardLayout config={plainConfig} menu={menu}>{children}</StandardLayout>
}
