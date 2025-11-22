import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Initialize Firebase Admin SDK
 */
export async function initializeFirebase() {
  try {
    // Load service account key
    const serviceAccountPath = join(__dirname, '../../game-phaser-web-firebase-adminsdk-fbsvc-5696f41fa9.json');
    const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    });

    console.log('✓ Firebase Admin SDK initialized');
    return admin;
  } catch (error) {
    console.error('✗ Failed to initialize Firebase:', error.message);
    throw error;
  }
}

/**
 * Get Firestore instance
 */
export function getFirestore() {
  return admin.firestore();
}

/**
 * Get Auth instance
 */
export function getAuth() {
  return admin.auth();
}

/**
 * Verify Firebase ID token
 */
export async function verifyToken(idToken) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}
