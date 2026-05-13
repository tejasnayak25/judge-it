'use server';

import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { ensureAdmin } from '@/lib/security';

export async function getCriteriaAction() {
  try {
    await ensureAdmin();
    const snapshot = await adminDb.collection('criteria')
      .orderBy('created_at', 'asc')
      .get();

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching criteria:', error);
    return { success: false, error: error.message };
  }
}

export async function createCriterionAction(label: string) {
  try {
    await ensureAdmin();
    const name = label.toLowerCase().replace(/\s+/g, '_');

    const docRef = adminDb.collection('criteria').doc();
    await docRef.set({
      id: docRef.id,
      name,
      label,
      created_at: new Date().toISOString(),
    });

    revalidatePath('/admin/criteria');
    revalidatePath('/admin/results');
    return { success: true };
  } catch (error: any) {
    console.error('Action failed:', error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteCriterionAction(id: string) {
  try {
    await ensureAdmin();
    await adminDb.collection('criteria').doc(id).delete();

    revalidatePath('/admin/criteria');
    revalidatePath('/admin/results');
    return { success: true };
  } catch (error: any) {
    console.error('Action failed:', error.message);
    return { success: false, error: error.message };
  }
}
