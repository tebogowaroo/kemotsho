const admin = require('firebase-admin');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env vars manually
const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env.local')));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const serviceAccount = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}');
// Or simpler, construct from env vars we just set
const certConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(certConfig),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const bucket = admin.storage().bucket();

async function check() {
  console.log(`Checking bucket: ${bucket.name}`);
  try {
    const [exists] = await bucket.exists();
    console.log(`Bucket exists: ${exists}`);
    if (exists) {
        console.log('Attempting to get metadata...');
        const [metadata] = await bucket.getMetadata();
        console.log('Bucket metadata retrieved successfully.');
        console.log('Location:', metadata.location);
    } else {
        console.error('Bucket does NOT exist!');
    }
  } catch (error) {
    console.error('Error accessing bucket:', error.message);
    if (error.code === 403) {
        console.error('Permission denied. Service account might incorrectly configured or API disabled.');
    }
  }
}

check();
