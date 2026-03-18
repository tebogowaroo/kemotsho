
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// 1. Load Environment Variables
const envPath = path.resolve(__dirname, '../../../../.env.local'); // Assuming src/scripts location
// Or just try specific paths
// If running from root: apps/web/.env.local or .env.local
// Let's rely on standard dotenv flow or try to load explicit path

// If running in `apps/web/src/scripts`, __dirname is that.
// .env.local is usually in `apps/web/.env.local`

const possibleEnvPaths = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), 'apps/web/.env.local'),
    path.resolve(__dirname, '../../.env.local')
];

let envLoaded = false;
for (const p of possibleEnvPaths) {
    if (fs.existsSync(p)) {
        console.log(`Loading env from: ${p}`);
        const envConfig = dotenv.parse(fs.readFileSync(p));
        for (const k in envConfig) {
            process.env[k] = envConfig[k];
        }
        envLoaded = true;
        break;
    }
}

if (!envLoaded) {
    console.warn("⚠️ No .env.local found. Relying on process.env.");
}

// 2. Initialize Firebase Admin
let certConfig;
try {
  // Prefer the JSON string if available
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const jsonInfo = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      certConfig = admin.credential.cert(jsonInfo);
  } else {
      // Fallback to explicit params
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      if (!privateKey) throw new Error("Missing FIREBASE_PRIVATE_KEY");

      certConfig = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      });
  }
} catch (e) {
  console.error("Failed to parse credentials", e);
  process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
      credential: certConfig,
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, 
    });
}

const auth = admin.auth();
const db = admin.firestore();

async function main() {
  console.log("🚀 Starting Role Synchronization (Firestore -> Auth Claims)...");
  
  const usersSnap = await db.collection("users").get();
  
  if (usersSnap.empty) {
    console.log("No users found.");
    return;
  }
  
  console.log(`Found ${usersSnap.size} users.`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const roles = Array.isArray(data.roles) ? data.roles : [];
    const uid = doc.id;
    const email = data.email || uid;
    
    // Skip if role is empty? Maybe not, empty roles is valid (clearing claims)
    // But let's log everything
    
    console.log(`Syncing user ${email} (${uid})...`);
    console.log(`   Firestore Roles: [${roles.join(", ")}]`);
    
    try {
        // 1. Get current claims to compare (optional, but good for logs)
        let userRecord;
        try {
            userRecord = await auth.getUser(uid);
        } catch(e) {
             console.log(`   ⚠️ User not found in Auth. Skipping.`);
             continue;
        }
        
        const currentClaims = userRecord.customClaims || {};
        const currentRoles = (currentClaims.roles) || [];
        
        console.log(`   Current Auth Claims: [${currentRoles.join(", ")}]`);
        
        // Optimize: skip if same
        const sortedRoles = [...roles].sort().join(",");
        const sortedCurrent = [...currentRoles].sort().join(",");
        
        if (sortedRoles === sortedCurrent) {
            console.log(`   ✅ Already in sync.`);
            successCount++;
            continue;
        }

        // 2. Set Claims
        await auth.setCustomUserClaims(uid, { roles });
        console.log(`   ✅ UPDATED Auth Claims to: [${roles.join(", ")}]`);
        successCount++;
        
    } catch (err) {
        console.error(`   ❌ Error syncing user ${uid}:`, err);
        failCount++;
    }
  }
  
  console.log("\nSync Complete!");
  console.log(`Updated: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
