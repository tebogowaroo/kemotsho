import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { Effect, Layer } from "effect"

const run = async () => {
  // Dynamic imports ensure env vars are loaded first
  const { db } = await import("./firebase-admin")
  const { NavigationRepository } = await import("@kemotsho/platform-cms/navigation/domain/NavigationRepository")
  const { RepositoryError } = await import("@kemotsho/core/domain/errors")

  const menuItems = [
    {
      id: "home",
      label: "Home",
      path: "/",
      children: []
    },
    {
      id: "about",
      label: "About",
      path: "/about",
      children: []
    },
    {
      id: "services",
      label: "Services",
      path: "/services",
      children: []
    },
    {
      id: "blog",
      label: "Blog",
      path: "/blog",
      children: []
    },
    {
      id: "contact",
      label: "Contact",
      path: "/contact",
      children: []
    },
    {
        id: "privacy",
        label: "Privacy Policy",
        path: "/privacy",
        children: []
    },
    {
        id: "terms",
        label: "Terms of Service",
        path: "/terms",
        children: []
    }
  ]

  // Implementation using local db instance
  const SeedRepositoryLive = Layer.succeed(
    NavigationRepository,
    NavigationRepository.of({
      // @ts-ignore
      getMenu: (menuId) => Effect.fail(new RepositoryError({ message: "Not implemented for seed" })),
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

  const program = Effect.gen(function* () {
    const repo = yield* NavigationRepository
    
    console.log("Seeding navigation menu...")
    yield* repo.saveMenu("main", menuItems)
    console.log("Navigation menu seeded successfully.")
  })

  await Effect.runPromise(program.pipe(Effect.provide(SeedRepositoryLive)))
}

run().catch(console.error)
