const admin = require('firebase-admin');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// 1. Load Environment Variables
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
} else {
  console.error("No .env.local file found!");
  process.exit(1);
}

// 2. Initialize Firebase Admin
let certConfig;
try {
  // Prefer the JSON string if available
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const jsonInfo = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      certConfig = admin.credential.cert(jsonInfo);
  } else {
      certConfig = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      });
  }
} catch (e) {
  console.error("Failed to parse credentials", e);
  process.exit(1);
}

admin.initializeApp({
  credential: certConfig,
  projectId: process.env.FIREBASE_PROJECT_ID || "website-base-pro", 
});

const auth = admin.auth();
const db = admin.firestore();

// 3. Script Logic
async function setAdmin(email) {
  try {
    console.log(`Looking up user: ${email}...`);
    const user = await auth.getUserByEmail(email);
    console.log(`Found user ${user.uid}`);

    // Set Custom Claims
    console.log("Setting custom claims...");
    await auth.setCustomUserClaims(user.uid, { roles: ['admin'] });

    // Update Firestore
    console.log("Updating Firestore...");
    await db.collection('users').doc(user.uid).set({
      roles: ['admin'],
      updatedAt: new Date(), // Just update fields
    }, { merge: true });

    console.log(`SUCCESS: User ${email} is now an ADMIN.`);
    console.log("NOTE: You must LOG OUT and LOG IN again for the changes to take effect.");
    process.exit(0);
  } catch (error) {
    console.error("Error setting admin:", error.message);
    process.exit(1);
  }
}

// Get Email from args
const targetEmail = process.argv[2];
if (!targetEmail) {
  console.error("Usage: node set-admin.js <email>");
  process.exit(1);
}

setAdmin(targetEmail);
