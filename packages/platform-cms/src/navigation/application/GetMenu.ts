import { Effect } from "effect"
import { NavigationRepository } from "../domain/NavigationRepository"
import { MenuItem } from "../domain/MenuItem"
import { RepositoryError } from "@kemotsho/core/domain/errors"

export class GetMenu extends Effect.Service<GetMenu>()("navigation/GetMenu", {
  effect: Effect.gen(function* () {
    const repo = yield* NavigationRepository

    return (menuId: string) => 
      repo.getMenu(menuId).pipe(
        // Verify schema validity if needed or fallback
        Effect.map(items => items),
        Effect.catchAll(error => {
          console.error(`Error fetching menu ${menuId}:`, error)
          return Effect.succeed([]) // Return empty menu on error for robustness
        })
      )
  }),
  dependencies: []
}) {}
