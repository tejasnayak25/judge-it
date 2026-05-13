
import * as admin from 'firebase-admin';
import fs from 'fs';

async function testFresh() {
  try {
    const sa = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));
    const app = admin.initializeApp({
      credential: admin.credential.cert(sa),
    }, 'test-app');
    
    const db = app.firestore();
    console.log('Testing fresh connection...');
    const snapshot = await db.collection('test').get();
    console.log('Fresh connection successful!');
  } catch (error) {
    console.error('Fresh connection failed:', error);
  }
}

testFresh();
