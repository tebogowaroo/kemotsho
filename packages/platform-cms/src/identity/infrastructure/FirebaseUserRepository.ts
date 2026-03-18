import { Effect, Layer, Option, Either } from "effect"
import { db } from "@kemotsho/core/infra/firebase/admin"
import { UserRepository } from "../domain/UserRepository"
import { User, UserId, CreateUser } from "../domain/User"
import { NotFound, UnexpectedError } from "@kemotsho/core/domain/errors"
import { Schema } from "effect"

/*
 * Implementation of UserRepository using Firestore
 */
const make = Effect.succeed({
  findById: (id: UserId) =>
    Effect.tryPromise({
      try: async () => {
        const snap = await db.collection("users").doc(id).get()
        if (!snap.exists) {
          throw new Error("NOT_FOUND")
        }
        const data = snap.data() || {}
        
        // Normalization helpers (shared with list)
        const toDate = (val: any) => {
            if (!val) return new Date(0)
            if (typeof val.toDate === 'function') return val.toDate()
            return new Date(val)
        }
        const fixDisplayName = (val: any) => {
            if (val && typeof val === 'object' && val._tag === 'Some') return val.value
            if (val && typeof val === 'object' && val._tag === 'None') return null
            return val
        }

        return { 
            id: snap.id, 
            ...data,
            displayName: fixDisplayName(data.displayName),
            createdAt: toDate(data.createdAt).toISOString(),
            updatedAt: toDate(data.updatedAt).toISOString()
        }
      },
      catch: (error) => {
        if (error instanceof Error && error.message === "NOT_FOUND") {
          return new NotFound({ entity: "User", id })
        }
        return new UnexpectedError({ error })
      }
    }).pipe(
      // Validate schema on read (runtime safety)
      Effect.flatMap(Schema.decodeUnknown(User)),
      Effect.mapError(e => e._tag === "ParseError" ? new UnexpectedError({ error: e }) : e)
    ),

  create: (input: CreateUser) =>
    Effect.gen(function* (_) {
       const now = new Date()
       const newUser: User = {
            id: input.id,
            email: input.email,
            displayName: input.displayName,
            // Default role is now namespaced to CMS content consumer
            roles: ["cms:subscriber"], 
            status: "active",
            createdAt: now,
            updatedAt: now
        }
        
       const encoded = yield* _(Schema.encode(User)(newUser))
       
       yield* _(Effect.tryPromise({
          try: async () => {
             await db.collection("users").doc(input.id).set(encoded)
          },
          catch: (error) => new UnexpectedError({ error })
       }))
       
       return newUser
    }).pipe(
       Effect.mapError(e => e._tag === "ParseError" ? new UnexpectedError({ error: e }) : e)
    ),

  update: (user: User) => 
    Effect.gen(function* (_) {
       const encoded = yield* _(Schema.encode(User)(user))
       
       yield* _(Effect.tryPromise({
          try: async () => {
              await db.collection("users").doc(user.id).set(encoded, { merge: true })
          },
          catch: (error) => new UnexpectedError({ error })
       }))
       
       return user
    }).pipe(
       Effect.mapError(e => e._tag === "ParseError" ? new UnexpectedError({ error: e }) : e)
    ),

  delete: (id: UserId) =>
    Effect.tryPromise({
        try: async () => {
             await db.collection("users").doc(id).delete()
        },
        catch: (error) => new UnexpectedError({ error })
    }),

  list: (params?: { limit?: number; offset?: number }) =>
    Effect.tryPromise({
      try: async () => {
        let query: FirebaseFirestore.Query = db.collection("users")
        
        if (params?.limit) query = query.limit(params.limit)
        if (params?.offset) query = query.offset(params.offset)
        
        const snap = await query.get()
        return snap.docs.map(doc => {
            const data = doc.data()
            // Helper to safe convert Firestore Timestamps to JS Dates
            const toDate = (val: any) => {
                if (!val) return new Date(0) // Default to Epoch if missing
                if (typeof val.toDate === 'function') return val.toDate()
                return new Date(val)
            }

            // Helper to fix displayName if it was saved as Effect Option (Legacy data fix)
            const fixDisplayName = (val: any) => {
                if (val && typeof val === 'object' && val._tag === 'Some') return val.value
                if (val && typeof val === 'object' && val._tag === 'None') return null
                return val
            }
            
            return { 
                id: doc.id, 
                ...data,
                displayName: fixDisplayName(data.displayName),
                // Explicitly convert known Date fields to ISO Strings (Schema.Date expects string input)
                createdAt: toDate(data.createdAt).toISOString(),
                updatedAt: toDate(data.updatedAt).toISOString()
            }
        })
      },
      catch: (error) => new UnexpectedError({ error })
    }).pipe(
      // Soft validation: Decode each item individually, log errors, but return valid items.
      Effect.flatMap((rawItems: any[]) => 
         Effect.forEach(rawItems, (item) => 
            Schema.decodeUnknown(User)(item).pipe(
                Effect.either
            )
         )
      ),
      Effect.map((results) => {
          const validUsers: User[] = []
          results.forEach(res => {
              if (Either.isLeft(res)) {
                  // Log the failure but don't crash
                  console.error(`[ListUsers] Skipping invalid user:`, res.left)
              } else {
                  validUsers.push(res.right)
              }
          })
          return validUsers
      })
    )
})

/*
 * Live Layer for Dependency Injection
 */
export const FirebaseUserRepositoryLive = Layer.effect(UserRepository, make)
