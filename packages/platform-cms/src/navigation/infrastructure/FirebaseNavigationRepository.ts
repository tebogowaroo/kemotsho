import { Effect, Layer } from "effect"
import { db } from "@kemotsho/core/infra/firebase/admin"
import { NavigationRepository } from "../domain/NavigationRepository"
import { MenuItem } from "../domain/MenuItem"
import { RepositoryError } from "@kemotsho/core/domain/errors"

export const FirebaseNavigationRepositoryLive = Layer.succeed(
  NavigationRepository,
  NavigationRepository.of({
    getMenu: (menuId) =>
      Effect.tryPromise({
        try: async () => {
          const doc = await db.collection("navigation").doc(menuId).get()
          if (!doc.exists) {
            return []
          }
          const data = doc.data()
          return (data?.items || []) as ReadonlyArray<MenuItem>
        },
        catch: (error) => new RepositoryError({ 
          message: `Failed to fetch menu ${menuId}: ${error}` 
        })
      }),

    saveMenu: (menuId, items) =>
      Effect.tryPromise({
        try: async () => {
          await db.collection("navigation").doc(menuId).set({ 
            items, 
            updatedAt: new Date() 
          })
        },
        catch: (error) => new RepositoryError({ 
          message: `Failed to save menu ${menuId}: ${error}` 
        })
      })
  })
)
