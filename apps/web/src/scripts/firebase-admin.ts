import { initializeApp, getApps, getApp, type App } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"

console.log("Checking Env Vars in firebase-admin.ts")
console.log("FIREBASE_SERVICE_ACCOUNT_KEY length:", process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length)

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
const SERVICE_ACCOUNT_KEY = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL
const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
const STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET

function createAdminApp(): App {
  console.log("Existing apps:", getApps().length)
  if (getApps().length > 0) {
    return getApp()
  }

  // Re-implementing correctly using certify
  const { cert } = require("firebase-admin/app")
  
  if (SERVICE_ACCOUNT_KEY) {
     console.log("Initializing Firebase Admin with Service Account Key...")
     try {
         const serviceAccount = JSON.parse(SERVICE_ACCOUNT_KEY)
         console.log("Service Account Key parsed successfully. Project Id:", serviceAccount.project_id)
         return initializeApp({
           credential: cert(serviceAccount),
           ...(PROJECT_ID ? { projectId: PROJECT_ID } : {}),
           ...(STORAGE_BUCKET ? { storageBucket: STORAGE_BUCKET } : {})
         })
     } catch (e) {
         console.error("Failed to parse/use SERVICE_ACCOUNT_KEY", e)
     }
  } else if (PROJECT_ID && CLIENT_EMAIL && PRIVATE_KEY) {
     console.log("Initializing Firebase Admin with Client Email and Private Key...")
     return initializeApp({
        credential: cert({
            projectId: PROJECT_ID,
            clientEmail: CLIENT_EMAIL,
            privateKey: PRIVATE_KEY,
        }),
        projectId: PROJECT_ID,
        ...(STORAGE_BUCKET ? { storageBucket: STORAGE_BUCKET } : {})
     })
  } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY and (CLIENT_EMAIL+PRIVATE_KEY) are missing, falling back to default credentials.")
  }

  return initializeApp({ ...(PROJECT_ID ? { projectId: PROJECT_ID } : {}) })
}

export const app = createAdminApp()
export const db = getFirestore(app)
export const auth = getAuth(app)
