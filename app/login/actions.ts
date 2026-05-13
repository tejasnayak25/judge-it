'use server';

import { createSession, removeSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { adminAuth } from '@/lib/firebase-admin';

export async function loginAction(idToken: string) {
  try {
    // Verify the token to get the user ID
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get user profile to check role
    const profile = await db.getProfile(uid);

    if (!profile) {
      return { success: false, error: 'User profile not found. Please contact an administrator.' };
    }

    // Create session cookie
    await createSession(idToken);

    return { 
      success: true, 
      role: (profile as any).role 
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

export async function logoutAction() {
  await removeSession();
}
