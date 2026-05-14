'use server';

import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { ensureAdmin } from '@/lib/security';

export async function getAssignmentsAction() {
  try {
    await ensureAdmin();
    const snapshot = await adminDb.collection('assignments')
      .orderBy('created_at', 'desc')
      .get();

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    return { success: false, error: error.message };
  }
}

export async function createAssignmentAction(judgeIds: string[], teamIds: string[], editId?: string) {
  try {
    await ensureAdmin();
    
    if (editId) {
      await adminDb.collection('assignments').doc(editId).update({
        judge_ids: judgeIds,
        team_ids: teamIds,
      });
    } else {
      const docRef = adminDb.collection('assignments').doc();
      await docRef.set({
        id: docRef.id,
        judge_ids: judgeIds,
        team_ids: teamIds,
        revealed: false,
        started: false,
        current_team_index: 0,
        created_at: new Date().toISOString(),
      });
    }

    revalidatePath('/admin/assignments');
    return { success: true };
  } catch (error: any) {
    console.error('Error in createAssignmentAction:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleAssignmentRevealAction(id: string, currentStatus: boolean) {
  try {
    await ensureAdmin();
    await adminDb.collection('assignments').doc(id).update({ 
      revealed: !currentStatus 
    });

    revalidatePath('/admin/assignments');
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling reveal:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteAssignmentAction(id: string) {
  try {
    await ensureAdmin();
    await adminDb.collection('assignments').doc(id).delete();

    revalidatePath('/admin/assignments');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    return { success: false, error: error.message };
  }
}
