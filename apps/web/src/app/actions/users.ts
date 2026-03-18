"use server"

import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { createUserByAdmin } from "@kemotsho/platform-cms/identity/application/CreateUserByAdmin"
import { unsubscribeUser } from "@kemotsho/platform-cms/identity/application/UnsubscribeUser"
import { listUsers } from "@kemotsho/platform-cms/identity/application/ListUsers"
import { updateUser } from "@kemotsho/platform-cms/identity/application/UpdateUser"
import { CreateUser, UserId, UserRole, User, UpdateUser } from "@kemotsho/platform-cms/identity/domain/User"
import { Schema } from "effect"
import { Effect, Exit, Cause, Option } from "effect"
import { getCurrentUser, AuthError } from "@kemotsho/core/lib/auth"

// Helper to serialize User for Client
const serializeUser = (user: User) => ({
    ...user,
    displayName: Option.getOrNull(user.displayName),
    createdAt: user.createdAt.toISOString()
})


// Define Schema for Admin Creation Input (extends CreateUser but handles roles)
const CreateUserAdminInput = Schema.Struct({
    email: Schema.String,
    displayName: Schema.OptionFromNullOr(Schema.String),
    roles: Schema.Array(UserRole)
})

export async function createUserByAdminAction(input: unknown) {
  const program = Effect.gen(function* (_) {
    // 1. Auth Check (Must be Admin)
    const currentUser = yield* _(getCurrentUser)
    if (!currentUser.roles.includes("sys:admin")) {
        return yield* _(Effect.fail(new AuthError({ message: "Forbidden" })))
    }

    // 2. Decode Input
    const payload = yield* _(Schema.decodeUnknown(CreateUserAdminInput)(input))
    
    // 3. Create
    // We mock the ID for schema validation because CreateUser needs it, 
    // but the use case will overwrite it with the real Auth ID.
    const useCaseInput = { 
        ...payload, 
        id: "placeholder" as any 
    }

    const user = yield* _(createUserByAdmin(useCaseInput))
    return serializeUser(user)
  })

  return run(program)
}

export async function unsubscribeUserAction(userId: string) {
    const program = Effect.gen(function* (_) {
        const currentUser = yield* _(getCurrentUser)
        if (!currentUser.roles.includes("sys:admin")) {
            return yield* _(Effect.fail(new AuthError({ message: "Forbidden" })))
        }

        const validId = yield* _(Schema.decodeUnknown(UserId)(userId))
        const user = yield* _(unsubscribeUser(validId))
        return serializeUser(user)
    })

    return run(program)
}

export async function updateUserAction(input: unknown) {
    const program = Effect.gen(function* (_) {
       const currentUser = yield* _(getCurrentUser)
       if (!currentUser.roles.includes("sys:admin")) {
          return yield* _(Effect.fail(new AuthError({ message: "Forbidden" })))
       }
  
       const payload = yield* _(Schema.decodeUnknown(UpdateUser)(input))
       const updated = yield* _(updateUser(payload))
       return serializeUser(updated)
    })
    return run(program)
  }

export async function listUsersAction() {
    const program = Effect.gen(function* (_) {
        yield* _(getCurrentUser)
         // UseCase is a function that returns an Effect, so we must call it.
         const users = yield* _(listUsers())
         return users.map(serializeUser)
    })
    return run(program)
}

export async function listStaffUsersAction() {
    const program = Effect.gen(function* (_) {
        yield* _(getCurrentUser)
         const users = yield* _(listUsers())
         // Filter for users who have roles other than or in addition to 'subscriber'
         // For now, we assume anyone with a role that is NOT 'subscriber' is staff/admin.
         const staff = users.filter(u => u.roles.some(r => (r as string) !== 'subscriber'))
         return staff.map(serializeUser)
    })
    return run(program)
}

async function run(effect: any) {
  const result = await AppRuntime.runPromiseExit(effect)
  if (Exit.isSuccess(result)) {
    return { success: true, data: JSON.parse(JSON.stringify(result.value)) }
  } else {
    const failure = Cause.failureOption(result.cause)
    if (failure._tag === "Some") {
        const errorValue = failure.value as any
        let serializedError = errorValue
        
        // Handle wrapping errors that contain raw Error objects
        if (errorValue && typeof errorValue === 'object' && errorValue.error instanceof Error) {
             serializedError = {
                 ...errorValue,
                 error: {
                     message: errorValue.error.message,
                     stack: errorValue.error.stack,
                     name: errorValue.error.name
                 }
             }
        }
        
        return { 
            success: false, 
            error: "Operation failed", 
            details: JSON.parse(JSON.stringify(serializedError)) 
        }
    }
    return { success: false, error: "Unexpected system error" }
  }
}
