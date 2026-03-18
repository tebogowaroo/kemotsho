"use server"

import { Effect, Layer } from "effect"
import { revalidatePath } from "next/cache"
import { UpdateMenu } from "@kemotsho/platform-cms/navigation/application/UpdateMenu"
import { FirebaseNavigationRepositoryLive } from "@kemotsho/platform-cms/navigation/infrastructure/FirebaseNavigationRepository"
import { MenuItem } from "@kemotsho/platform-cms/navigation/domain/MenuItem"
import { requireAuth } from "@kemotsho/core/lib/auth-dal"

const NavigationUpdateLive = Layer.provide(
  UpdateMenu.Default,
  FirebaseNavigationRepositoryLive
)

export async function updateMenuAction(menuId: string, items: ReadonlyArray<MenuItem>) {
  await requireAuth()

  const program = Effect.gen(function* () {
    const updateMenu = yield* UpdateMenu
    yield* updateMenu(menuId, items)
  })

  await Effect.runPromise(program.pipe(Effect.provide(NavigationUpdateLive)))
  revalidatePath("/")
}
