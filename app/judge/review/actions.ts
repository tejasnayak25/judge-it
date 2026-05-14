'use server';

import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { ensureJudge } from '@/lib/security';

export async function getReviewStateAction(assignmentId: string, targetIndex?: number) {
  try {
    const session = await ensureJudge();
    
    // 1. Fetch Assignment
    const assignDoc = await adminDb.collection('assignments').doc(assignmentId).get();
    if (!assignDoc.exists) throw new Error('Assignment not found');
    const assignment = { id: assignDoc.id, ...assignDoc.data() } as any;

    // 2. Fetch Criteria
    const criteriaSnap = await adminDb.collection('criteria')
      .orderBy('created_at', 'asc')
      .get();
    const criteria = criteriaSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 3. Fetch all reviews by this judge for this assignment to see progress
    const reviewsSnap = await adminDb.collection('reviews')
      .where('assignment_id', '==', assignmentId)
      .where('judge_id', '==', session.uid)
      .get();
    
    const reviewsMap = new Map();
    reviewsSnap.docs.forEach(doc => {
      reviewsMap.set(doc.data().team_id, doc.data().scores);
    });
    
    // 4. Determine which team to show
    let currentTeamIndex = targetIndex !== undefined ? targetIndex : 0;
    
    // If no target index, find first unreviewed
    if (targetIndex === undefined) {
      for (let i = 0; i < assignment.team_ids.length; i++) {
        if (!reviewsMap.has(assignment.team_ids[i])) {
          currentTeamIndex = i;
          break;
        }
      }
    }

    // Check if finished (if we are at the end and all are reviewed)
    if (currentTeamIndex >= assignment.team_ids.length) {
      return { success: true, assignment: { ...assignment, current_team_index: assignment.team_ids.length }, criteria, team: null, finished: true };
    }

    const teamId = assignment.team_ids[currentTeamIndex];
    const teamDoc = await adminDb.collection('teams').doc(teamId).get();
    if (!teamDoc.exists) throw new Error('Team not found');
    const team = { id: teamDoc.id, ...teamDoc.data() };

    // Get existing scores for this team if any
    const existingScores = reviewsMap.get(teamId) || null;

    // 5. Fetch all teams basic info for dropdown
    const allTeams = await Promise.all(
      assignment.team_ids.map(async (tId: string) => {
        const tDoc = await adminDb.collection('teams').doc(tId).get();
        if (tDoc.exists) {
          const data = tDoc.data();
          return { id: tDoc.id, project_title: data?.project_title || 'Unknown', slot_number: data?.slot_number || 'N/A' };
        }
        return null;
      })
    );
    const validTeams = allTeams.filter(t => t !== null);

    return { 
      success: true, 
      assignment: { ...assignment, current_team_index: currentTeamIndex }, 
      criteria, 
      team, 
      allTeams: validTeams,
      existingScores,
      finished: false 
    };
  } catch (error: any) {
    console.error('Error in getReviewStateAction:', error);
    return { success: false, error: error.message };
  }
}

export async function submitReviewAction(assignmentId: string, teamId: string, scores: any) {
  try {
    const session = await ensureJudge();

    // 0. Verify assignment ownership
    const assignDoc = await adminDb.collection('assignments').doc(assignmentId).get();
    const assignment = assignDoc.data();

    if (!assignment?.judge_ids.includes(session.uid)) {
      throw new Error('Unauthorized: You are not assigned to this panel');
    }

    // 1. Upsert Review (use deterministic ID to overwrite if exists)
    const reviewId = `${assignmentId}_${session.uid}_${teamId}`;
    const reviewRef = adminDb.collection('reviews').doc(reviewId);
    
    await reviewRef.set({
      id: reviewId,
      assignment_id: assignmentId,
      judge_id: session.uid,
      team_id: teamId,
      scores: scores,
      submitted_at: new Date().toISOString(),
    }, { merge: true });

    // 2. Check if finished
    const reviewsSnap = await adminDb.collection('reviews')
      .where('assignment_id', '==', assignmentId)
      .where('judge_id', '==', session.uid)
      .get();

    const isFinished = reviewsSnap.size >= (assignment?.team_ids.length || 0);

    revalidatePath('/judge/history');
    revalidatePath('/judge');

    return { success: true, finished: isFinished };
  } catch (error: any) {
    console.error('Error in submitReviewAction:', error);
    return { success: false, error: error.message };
  }
}

export async function getJudgeHistoryAction() {
  try {
    const session = await ensureJudge();

    const reviewsSnap = await adminDb.collection('reviews')
      .where('judge_id', '==', session.uid)
      .orderBy('submitted_at', 'desc')
      .get();

    const reviews = await Promise.all(reviewsSnap.docs.map(async (doc) => {
      const data = doc.data();
      const teamDoc = await adminDb.collection('teams').doc(data.team_id).get();
      return {
        ...data,
        id: doc.id,
        teams: teamDoc.exists ? { id: teamDoc.id, ...teamDoc.data() } : null
      };
    }));

    return { success: true, reviews };
  } catch (error: any) {
    console.error('Error in getJudgeHistoryAction:', error);
    return { success: false, error: error.message };
  }
}
