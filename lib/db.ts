import { adminDb } from './firebase-admin';

export const db = {
  // Generic collection reference
  collection: (name: string) => adminDb.collection(name),

  // Helper for profiles
  async getProfile(uid: string) {
    const doc = await adminDb.collection('users').doc(uid).get();
    return doc.exists ? doc.data() : null;
  },

  async createProfile(uid: string, data: any) {
    await adminDb.collection('users').doc(uid).set({
      ...data,
      id: uid,
      created_at: new Date().toISOString(),
    });
  },

  // Add more helpers as needed during migration
};
