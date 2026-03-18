import { ManagedRuntime, Layer } from "effect"
import { FirebaseUserRepositoryLive } from "@kemotsho/platform-cms/identity/infrastructure/FirebaseUserRepository"
import { FirebaseContentRepositoryLive } from "@kemotsho/platform-cms/content/infrastructure/FirebaseContentRepository"
import { FirebasePageRepositoryLive } from "@kemotsho/platform-cms/pages/infrastructure/FirebasePageRepository"
import { FirebaseStorageServiceLive } from "@kemotsho/platform-cms/media/infrastructure/FirebaseStorageService"
import { FirebaseMediaRepositoryLive } from "@kemotsho/platform-cms/media/infrastructure/FirebaseMediaRepository"

// Combine all infrastructure layers not specific to a request
// (In the future, email service, config, etc. go here)
const AppLive = Layer.mergeAll(
  FirebaseUserRepositoryLive,
  FirebaseContentRepositoryLive,
  FirebasePageRepositoryLive,
  FirebaseStorageServiceLive,
  FirebaseMediaRepositoryLive
)

// Create a managed runtime that keeps resources alive (if needed) 
// or allows us to run effects cleanly.
// Since Next.js is serverless (mostly), we generally start/stop per request or use a global singleton for connections.
export const AppRuntime = ManagedRuntime.make(AppLive)
