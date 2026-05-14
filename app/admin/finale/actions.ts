'use server';

import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { ensureAdmin } from '@/lib/security';

export async function getFinaleStatusAction() {
  try {
    await ensureAdmin();
    const doc = await adminDb.collection('assignments')
      .where('type', '==', 'grand_finale')
      .limit(1)
      .get();

    if (doc.empty) return { success: true, data: null };
    
    return { success: true, data: { id: doc.docs[0].id, ...doc.docs[0].data() } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createFinaleAssignmentAction(judgeIds: string[], teamIds: string[]) {
  try {
    await ensureAdmin();
    
    // Check if one already exists to update
    const existing = await adminDb.collection('assignments')
      .where('type', '==', 'grand_finale')
      .limit(1)
      .get();

    if (!existing.empty) {
      await existing.docs[0].ref.update({
        judge_ids: judgeIds,
        team_ids: teamIds,
        revealed: true, // Auto-reveal for finale
        updated_at: new Date().toISOString(),
      });
    } else {
      const docRef = adminDb.collection('assignments').doc();
      await docRef.set({
        id: docRef.id,
        type: 'grand_finale',
        judge_ids: judgeIds,
        team_ids: teamIds,
        revealed: true,
        started: false,
        current_team_index: 0,
        created_at: new Date().toISOString(),
      });
    }

    revalidatePath('/admin/finale');
    revalidatePath('/judge');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating finale assignment:', error);
    return { success: false, error: error.message };
  }
}
