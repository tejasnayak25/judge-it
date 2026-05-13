
import { adminDb } from '../lib/firebase-admin';

async function testConnection() {
  try {
    console.log('Testing Firestore connection...');
    const snapshot = await adminDb.collection('test').get();
    console.log('Connection successful, found docs:', snapshot.size);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();
