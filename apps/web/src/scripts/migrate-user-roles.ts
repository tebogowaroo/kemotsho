import { auth, db } from "@kemotsho/core/infra/firebase/admin" // Adjust import if needed based on verification
import { UserRole } from "@kemotsho/platform-cms/identity/domain/roles"

// Usage: npx tsx src/scripts/migrate-user-roles.ts

const ROLE_MAPPING: Record<string, string> = {
  "admin": "sys:admin",
  "editor": "cms:editor",
  "author": "cms:author",
  "subscriber": "cms:subscriber",
  
  // Hypothetical legacy roles if they existed
  "doctor": "medical:practitioner",
  "nurse": "medical:clinical-support",
  "patient": "medical:patient"
}

async function migrate() {
  console.log("🚀 Starting Role Migration...")
  
  const usersSnap = await db.collection("users").get()
  
  if (usersSnap.empty) {
    console.log("No users found to migrate.")
    return
  }
  
  console.log(`Found ${usersSnap.size} users. Processing...`)
  
  let updatedCount = 0
  let errorCount = 0
  
  for (const doc of usersSnap.docs) {
    const data = doc.data()
    const oldRoles: string[] = Array.isArray(data.roles) ? data.roles : []
    
    // Check if migration is needed (presence of un-namespaced roles)
    const needsMigration = oldRoles.some(r => !r.includes(":"))
    
    if (!needsMigration) {
      console.log(`Skipping ${doc.id} (already migrated or empty)`)
      continue
    }

    const newRoles = new Set<string>()
    
    for (const role of oldRoles) {
      if (role.includes(":")) {
         newRoles.add(role) // Keep existing namespaced roles
      } else if (ROLE_MAPPING[role]) {
         newRoles.add(ROLE_MAPPING[role])
      } else {
         console.warn(`⚠️  Warning: Unknown role '${role}' for user ${doc.id}. Preserving as is? No, defaulting to cms:subscriber`)
         newRoles.add("cms:subscriber")
      }
    }
    
    const finalRoles = Array.from(newRoles)
    
    try {
        // 1. Update Firestore
        await doc.ref.update({ roles: finalRoles })
        
        // 2. Update Auth Claims
        await auth.setCustomUserClaims(doc.id, { roles: finalRoles })
        
        console.log(`✅ Migrated ${doc.id}: [${oldRoles.join(", ")}] -> [${finalRoles.join(", ")}]`)
        updatedCount++
    } catch (error) {
        console.error(`❌ Failed to migrate ${doc.id}:`, error)
        errorCount++
    }
  }
  
  console.log(`\nMigration Complete!`)
  console.log(`Updated: ${updatedCount}`)
  console.log(`Errors:  ${errorCount}`)
  process.exit(0)
}

migrate().catch(err => {
  console.error(err)
  process.exit(1)
})
