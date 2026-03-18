import { Schema } from "effect"
import { CMSRole } from "@kemotsho/platform-cms/content/domain/roles"
import { CommerceRole } from "@kemotsho/module-commerce/commerce/domain/roles"

// Global System Roles (Platform Level)
export const SystemRole = Schema.Literal(
  "sys:admin",      // Tenant Owner / Super Admin
  "sys:developer"   // Technical Support / Maintenance
)

export type SystemRole = Schema.Schema.Type<typeof SystemRole>

// The Master Union of All Roles
export const UserRole = Schema.Union(
  SystemRole,
  CMSRole,
  CommerceRole
)

export type UserRole = Schema.Schema.Type<typeof UserRole>
