import { GetMenu } from "@kemotsho/platform-cms/navigation/application/GetMenu"
import { FirebaseNavigationRepositoryLive } from "@kemotsho/platform-cms/navigation/infrastructure/FirebaseNavigationRepository"
import { Effect, Layer } from "effect"
import { MenuEditor } from "./_components/menu-editor"

const NavigationLive = Layer.provide(
  GetMenu.Default,
  FirebaseNavigationRepositoryLive
)

async function getMenu() {
   const program = Effect.gen(function* () {
      const getMenu = yield* GetMenu
      return yield* getMenu("main")
   })
   return Effect.runPromise(program.pipe(Effect.provide(NavigationLive)))
}

export default async function NavigationPage() {
  const items = await getMenu()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Navigation</h1>
      </div>
      <div>
        <p className="text-muted-foreground mb-4">Manage your site's main navigation menu.</p>
        <MenuEditor initialItems={items} />
      </div>
    </div>
  )
}
