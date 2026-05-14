'use server';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export async function getJudgesAction() {
  try {
    const snapshot = await adminDb.collection('users')
      .where('role', '==', 'judge')
      .get();

    const data = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }))
      .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching judges:', error);
    return { success: false, error: error.message };
  }
}

export async function createJudgeAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim();
  const password = (formData.get('password') as string)?.trim();
  const fullName = (formData.get('fullName') as string)?.trim();

  if (!email || !password || password.length < 6) {
    return { success: false, error: 'Email and password are required. Password must be at least 6 characters.' };
  }

  try {
    // 1. Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: fullName,
    });

    // 2. Create profile in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      full_name: fullName,
      email: email,
      role: 'judge',
      created_at: new Date().toISOString(),
    });

    revalidatePath('/admin/judges');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating judge:', error);
    return { success: false, error: error.message };
  }
}

export async function bulkCreateJudgesAction(judges: any[]) {
  try {
    const results = [];
    for (const judge of judges) {
      try {
        const email = judge.email?.trim();
        const password = judge.password?.trim();
        const fullName = judge.full_name?.trim();

        if (!email || !password || password.length < 6) {
          throw new Error(`Invalid credentials for ${judge.full_name}. Password must be at least 6 characters.`);
        }

        // 1. Create user in Firebase Auth
        const userRecord = await adminAuth.createUser({
          email: email,
          password: password,
          displayName: fullName,
        });

        // 2. Create profile in Firestore
        await adminDb.collection('users').doc(userRecord.uid).set({
          id: userRecord.uid,
          full_name: fullName,
          email: email,
          password: password, // <-- Fixed: Now saving the password
          role: 'judge',
          created_at: new Date().toISOString(),
        });
        results.push({ email: email, success: true });
      } catch (err: any) {
        results.push({ email: judge.email, success: false, error: err.message });
      }
    }

    revalidatePath('/admin/judges');
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      return { 
        success: false, 
        error: `Imported ${results.length - failed.length} judges. ${failed.length} failed: ${failed[0].error}` 
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error bulk creating judges:', error);
    return { success: false, error: error.message };
  }
}

export async function syncJudgesAction() {
  try {
    // Fetch EVERYONE to be 100% sure we don't miss anyone
    const snapshot = await adminDb.collection('users').get();
    let repairedCount = 0;
    const errors: string[] = [];

    console.log(`Scanning ${snapshot.size} users...`);

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const role = (data.role || '').toString().trim().toLowerCase();
      
      // Fuzzy check for judge role
      if (role !== 'judge') continue;

      const email = data.email?.trim();
      let password = (data.password || '').trim();
      const fullName = data.full_name?.trim();

      if (!email || !password) continue;

      try {
        if (password.length < 6) {
          password = password + '0';
          await doc.ref.update({ password: password });
        }

        try {
          const authUser = await adminAuth.getUserByEmail(email);
          await adminAuth.deleteUser(authUser.uid);
        } catch (e) {}

        await adminAuth.createUser({
          uid: doc.id,
          email: email,
          password: password,
          displayName: fullName,
        });
        repairedCount++;
      } catch (err: any) {
        errors.push(`${email}: ${err.message}`);
      }
    }

    revalidatePath('/admin/judges');
    
    if (repairedCount === 0 && errors.length > 0) {
      return { success: false, error: `Sync failed for all: ${errors[0]}` };
    }

    return { success: true, message: `Successfully synced ${repairedCount} accounts.` };
  } catch (error: any) {
    console.error('Error syncing judges:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteJudgeAction(id: string) {
  try {
    // 1. Delete from Firebase Auth
    await adminAuth.deleteUser(id);

    // 2. Delete from Firestore
    await adminDb.collection('users').doc(id).delete();

    revalidatePath('/admin/judges');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting judge:', error);
    return { success: false, error: error.message };
  }
}

export async function updateJudgeAction(id: string, fullName: string, email: string, password?: string) {
  try {
    if (!email || !fullName) {
      return { success: false, error: 'Name and email are required.' };
    }

    const authUpdate: any = {
      email: email,
      displayName: fullName,
    };
    if (password && password.trim().length >= 6) {
      authUpdate.password = password.trim();
    }

    // 1. Update Firebase Auth
    await adminAuth.updateUser(id, authUpdate);

    const dbUpdate: any = {
      full_name: fullName,
      email: email,
      updated_at: new Date().toISOString(),
    };
    if (password && password.trim().length >= 6) {
      dbUpdate.password = password.trim();
    }

    // 2. Update Firestore
    await adminDb.collection('users').doc(id).update(dbUpdate);

    revalidatePath('/admin/judges');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating judge:', error);
    return { success: false, error: error.message };
  }
}

