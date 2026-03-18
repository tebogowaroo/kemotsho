import "server-only"
import { cookies } from "next/headers"
import { auth } from "@kemotsho/core/infra/firebase/admin"
import { Effect, Data } from "effect"

export class AuthError extends Data.TaggedError("AuthError")<{
  message: string
}> {}

export interface CurrentUser {
  readonly uid: string
  readonly email?: string
  readonly displayName?: string
  readonly roles: string[]
}

export const getCurrentUser = Effect.gen(function* (_) {
  const cookieStore = yield* _(Effect.promise(() => cookies()))
  const sessionCookie = cookieStore.get("session")?.value

  if (!sessionCookie) {
    return yield* _(Effect.fail(new AuthError({ message: "No Session Cookie" })))
  }

  try {
    const decodedClaims = yield* _(
      Effect.tryPromise({
        try: () => auth.verifySessionCookie(sessionCookie, true),
        catch: (error) => new AuthError({ message: "Invalid Session: " + String(error) })
      })
    )

    return {
      uid: decodedClaims.uid,
      ...(decodedClaims.email ? { email: decodedClaims.email } : {}),
      ...(decodedClaims.name ? { displayName: decodedClaims.name } : {}),
      roles: (decodedClaims.roles as string[]) || []
    } satisfies CurrentUser
  } catch (e) {
     return yield* _(Effect.fail(new AuthError({ message: "Token verification failed" })))
  }
})
