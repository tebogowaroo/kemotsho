import { Schema } from "effect"
import { makeId } from "@kemotsho/core/domain/ids"
import { UserRole } from "./roles"

export { UserRole } from "./roles"

/* 
 * 1. Branded ID 
 */
export const UserId = makeId("UserId")
export type UserId = Schema.Schema.Type<typeof UserId>

/*
 * 2. User Entity
 */
export const User = Schema.Struct({
  id: UserId,
  email: Schema.String,
  roles: Schema.Array(UserRole),
  status: Schema.Literal("active", "suspended", "banned"),
  displayName: Schema.OptionFromNullOr(Schema.String),
  createdAt: Schema.Date,
  updatedAt: Schema.Date
})

export type User = Schema.Schema.Type<typeof User>

/*
 * 4. User Creation DTO (Input)
 */
export const CreateUser = Schema.Struct({
  id: UserId, // ID matches Firebase Auth UID
  email: Schema.String,
  displayName: Schema.OptionFromNullOr(Schema.String)
})
export type CreateUser = Schema.Schema.Type<typeof CreateUser>

export const UpdateUser = Schema.Struct({
  id: UserId,
  displayName: Schema.OptionFromNullOr(Schema.String),
  roles: Schema.Array(UserRole),
  status: Schema.Literal("active", "suspended", "banned")
})
export type UpdateUser = Schema.Schema.Type<typeof UpdateUser>
