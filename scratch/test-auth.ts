
import * as admin from 'firebase-admin';
import fs from 'fs';

async function testAuth() {
  try {
    const sa = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));
    const app = admin.initializeApp({
      credential: admin.credential.cert(sa),
    }, 'test-auth');
    
    console.log('Testing Auth connection...');
    const listUsers = await app.auth().listUsers(1);
    console.log('Auth connection successful, users found:', listUsers.users.length);
  } catch (error) {
    console.error('Auth connection failed:', error);
  }
}

testAuth();
