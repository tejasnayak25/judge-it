'use server';

import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { ensureJudge } from '@/lib/security';

export async function getReviewStateAction(assignmentId: string) {
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

    // 3. Calculate Current Team Dynamically for THIS Judge
    // Fetch all reviews by this judge for this assignment
    const reviewsSnap = await adminDb.collection('reviews')
      .where('assignment_id', '==', assignmentId)
      .where('judge_id', '==', session.uid)
      .get();
    
    const reviewedTeamIds = new Set(reviewsSnap.docs.map(doc => doc.data().team_id));
    
    // Find first team in the list that hasn't been reviewed by this judge
    let currentTeamIndex = 0;
    let teamId = null;

    for (let i = 0; i < assignment.team_ids.length; i++) {
      if (!reviewedTeamIds.has(assignment.team_ids[i])) {
        currentTeamIndex = i;
        teamId = assignment.team_ids[i];
        break;
      }
    }

    if (!teamId) {
      return { success: true, assignment: { ...assignment, current_team_index: assignment.team_ids.length }, criteria, team: null, finished: true };
    }

    const teamDoc = await adminDb.collection('teams').doc(teamId).get();
    if (!teamDoc.exists) throw new Error('Team not found');
    const team = { id: teamDoc.id, ...teamDoc.data() };

    return { 
      success: true, 
      assignment: { ...assignment, current_team_index: currentTeamIndex }, 
      criteria, 
      team, 
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

    // 1. Insert Review
    const reviewRef = adminDb.collection('reviews').doc();
    await reviewRef.set({
      id: reviewRef.id,
      assignment_id: assignmentId,
      judge_id: session.uid,
      team_id: teamId,
      scores: scores,
      submitted_at: new Date().toISOString(),
    });

    // 2. Check if finished (now based on review count for this judge)
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
