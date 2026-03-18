import { requireAdmin } from "@kemotsho/core/lib/auth-dal"
import UsersClient from "./users-client"

export default async function UsersPageWrapper() {
  await requireAdmin()
  return <UsersClient />
}
