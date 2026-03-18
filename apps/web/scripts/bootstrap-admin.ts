import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the .env.local file from the web app
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function bootstrapAdmin() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY is missing from .env.local');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const auth = admin.auth();
  const db = admin.firestore();

  const adminEmail = 'tebogos@gmail.com'; // Replace with desired email
  const adminPassword = 'SuperSecretPassword123!'; // Replace with desired password
  const adminName = 'Tebogo Sikwane';
  const roles = ['sys:admin', 'cms:editor', 'cms:author'];

  try {
    console.log(`Creating user: ${adminEmail}...`);
    
    // 1. Create the user in Firebase Auth
    const userRecord = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: adminName,
      emailVerified: true,
    });

    console.log(`User created with UID: ${userRecord.uid}`);

    // 2. Set Custom Claims in Firebase Auth
    console.log(`Setting custom claims...`);
    await auth.setCustomUserClaims(userRecord.uid, { roles });

    // 3. Create the Domain User Record in Firestore
    console.log(`Writing to Firestore 'users' collection...`);
    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email: adminEmail,
      name: adminName,
      roles: roles,
      tenantId: process.env.NEXT_PUBLIC_TENANT_ID ?? 'tenant-kemotsho-demo',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Initial admin user bootstrapped successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error bootstrapping admin:', error);
    process.exit(1);
  }
}

bootstrapAdmin();
