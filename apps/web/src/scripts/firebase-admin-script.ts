import { config } from "dotenv"
config({ path: ".env.local" })

import { initializeApp, getApps, cert, getApp, type App } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL
const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
const SERVICE_ACCOUNT_KEY = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

function createAdminApp(): App {
  if (getApps().length > 0) {
    return getApp()
  }

  // 1. Try Service Account Key (JSON string)
  if (SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(SERVICE_ACCOUNT_KEY)
      return initializeApp({
        credential: cert(serviceAccount),
        ...(PROJECT_ID ? { projectId: PROJECT_ID } : {})
      })
    } catch (e) {
      console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY", e)
    }
  }

  // 2. Try Individual Env Vars
  if (PROJECT_ID && CLIENT_EMAIL && PRIVATE_KEY) {
    return initializeApp({
      credential: cert({
        projectId: PROJECT_ID,
        clientEmail: CLIENT_EMAIL,
        privateKey: PRIVATE_KEY,
      }),
      projectId: PROJECT_ID
    })
  }

  throw new Error("Missing Firebase Admin Credentials")
}

export const app = createAdminApp()
export const db = getFirestore(app)
