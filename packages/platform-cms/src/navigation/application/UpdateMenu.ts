import { Effect } from "effect"
import { NavigationRepository } from "../domain/NavigationRepository"
import { MenuItem } from "../domain/MenuItem"

export class UpdateMenu extends Effect.Service<UpdateMenu>()("navigation/UpdateMenu", {
  effect: Effect.gen(function* () {
    const repo = yield* NavigationRepository

    return (menuId: string, items: ReadonlyArray<MenuItem>) => 
      repo.saveMenu(menuId, items)
  }),
  dependencies: []
}) {}
