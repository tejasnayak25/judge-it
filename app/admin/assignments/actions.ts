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

    const assignments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // Fetch all reviews and existing teams to calculate progress
    const [reviewsSnap, teamsSnap] = await Promise.all([
      adminDb.collection('reviews').get(),
      adminDb.collection('teams').get()
    ]);
    
    const allReviews = reviewsSnap.docs.map(doc => doc.data());
    const existingTeamIds = new Set(teamsSnap.docs.map(doc => doc.id));

    const data = assignments.map(a => {
      const assignmentReviews = allReviews.filter(r => r.assignment_id === a.id);
      
      // Calculate how many teams in this assignment actually still exist
      const validTeamIds = a.team_ids.filter((tid: string) => existingTeamIds.has(tid));
      const validTeamCount = validTeamIds.length;
      
      const judgeProgress = a.judge_ids.map((jid: string) => {
        const judgeReviews = assignmentReviews.filter(r => r.judge_id === jid);
        return {
          judge_id: jid,
          count: judgeReviews.length,
          completed: validTeamCount > 0 && judgeReviews.length >= validTeamCount
        };
      });

      const allCompleted = judgeProgress.length > 0 && judgeProgress.every((jp: any) => jp.completed);
      const anyStarted = judgeProgress.some((jp: any) => jp.count > 0);

      return {
        ...a,
        judge_progress: judgeProgress,
        all_completed: allCompleted,
        any_started: anyStarted,
        valid_team_count: validTeamCount
      };
    });

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
