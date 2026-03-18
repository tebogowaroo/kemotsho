import { Context, Effect } from "effect"
import { type User, type UserId, type CreateUser } from "./User"
import { NotFound, UnexpectedError } from "@kemotsho/core/domain/errors"

export class UserRepository extends Context.Tag("identity/UserRepository")<
  UserRepository,
  {
    readonly findById: (id: UserId) => Effect.Effect<User, NotFound | UnexpectedError>
    readonly create: (user: CreateUser) => Effect.Effect<User, UnexpectedError>
    readonly update: (user: User) => Effect.Effect<User, NotFound | UnexpectedError>
    readonly delete: (id: UserId) => Effect.Effect<void, NotFound | UnexpectedError>
    
    readonly list: (
      params?: { limit?: number; offset?: number }
    ) => Effect.Effect<readonly User[], UnexpectedError>
  }
>() {}
