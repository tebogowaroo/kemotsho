const fs = require('fs');
const file = './packages/core/src/infra/firebase/admin.ts';
let code = `import "server-only"
import { initializeApp, getApps, cert, getApp, type App } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL
const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, "\\n")
const SERVICE_ACCOUNT_KEY = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
const STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET

function createAdminApp(): App {
  if (getApps().length > 0) return getApp();

  try {
    if (SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(SERVICE_ACCOUNT_KEY)
        return initializeApp({
          credential: cert(serviceAccount),
          ...(STORAGE_BUCKET ? { storageBucket: STORAGE_BUCKET } : {})
        })
      } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY", e)
      }
    }
    if (PROJECT_ID && CLIENT_EMAIL && PRIVATE_KEY) {
       return initializeApp({
          credential: cert({
              projectId: PROJECT_ID,
              clientEmail: CLIENT_EMAIL,
              privateKey: PRIVATE_KEY,
          }),
          projectId: PROJECT_ID,
          ...(STORAGE_BUCKET ? { storageBucket: STORAGE_BUCKET } : {})
       })
    }
    return initializeApp(PROJECT_ID ? { projectId: PROJECT_ID, ...(STORAGE_BUCKET ? { storageBucket: STORAGE_BUCKET } : {}) } : undefined)
  } catch (error) {
    console.warn("⚠️ Fallback: Firebase Admin failed to initialize. Returning mock app for build phase.");
    return initializeApp({
        projectId: "demo-project",
        credential: { getAccessToken: () => Promise.resolve({ access_token: "mock_token", expires_in: 3600 }) }
    })
  }
}

export const app = createAdminApp()
export const db = (() => {
  try {
    const firestore = getFirestore(app);
    try {
      firestore.settings({ ignoreUndefinedProperties: true });
    } catch (e) {
      if (e instanceof Error && !e.message.includes("already been initialized")) throw e;
    }
    return firestore;
  } catch (error) {
    console.warn("⚠️ Firestore failed to initialize, returning offline proxy.");
    return new Proxy({}, {
      get: (target, prop) => {
        if (prop === 'collection' || prop === 'doc') {
          return () => new Promise((_, reject) => reject(new Error("Offline mock db")));
        }
        return undefined;
      }
    }) as ReturnType<typeof getFirestore>;
  }
})();

export const auth = (() => {
  try {
    return getAuth(app);
  } catch (error) {
    console.warn("⚠️ Auth failed to initialize, returning empty object.");
    return {} as ReturnType<typeof getAuth>;
  }
})();
`;
fs.writeFileSync(file, code);
