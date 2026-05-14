import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin initialized using service-account.json');
    } else {
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        console.error('Missing Firebase Admin environment variables');
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: (process.env.FIREBASE_PROJECT_ID || '').trim(),
          clientEmail: (process.env.FIREBASE_CLIENT_EMAIL || '').trim(),
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || '')
            .replace(/^"|"$/g, '') // Remove start/end quotes
            .replace(/\\n/g, '\n')  // Replace escaped newlines
            .replace(/\n\s+/g, '\n') // Remove spaces after newlines
            .trim(),
        }),
      });
      console.log('Firebase Admin initialized using environment variables');
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
