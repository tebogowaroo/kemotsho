import { Context, Effect } from "effect"
import { MenuItem } from "./MenuItem"
import { RepositoryError } from "@kemotsho/core/domain/errors"

export interface NavigationRepository {
  readonly getMenu: (menuId: string) => Effect.Effect<ReadonlyArray<MenuItem>, RepositoryError>
  readonly saveMenu: (menuId: string, items: ReadonlyArray<MenuItem>) => Effect.Effect<void, RepositoryError>
}

export const NavigationRepository = Context.GenericTag<NavigationRepository>("@services/NavigationRepository")
