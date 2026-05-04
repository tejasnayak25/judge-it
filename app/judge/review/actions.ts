'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { ensureJudge } from '@/lib/security';

export async function getReviewStateAction(assignmentId: string) {
  try {
    const user = await ensureJudge();
    // 1. Fetch Assignment
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (assignmentError) throw assignmentError;

    // 2. Fetch Criteria
    const { data: criteria, error: criteriaError } = await supabaseAdmin
      .from('criteria')
      .select('*')
      .order('created_at', { ascending: true });

    if (criteriaError) throw criteriaError;

    // 3. Fetch Current Team
    const teamId = assignment.team_ids[assignment.current_team_index];
    if (!teamId) {
      return { success: true, assignment, criteria, team: null, finished: true };
    }

    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (teamError) throw teamError;

    return { 
      success: true, 
      assignment, 
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
    const user = await ensureJudge();

    // 0. Verify assignment ownership
    const { data: checkAssign } = await supabaseAdmin
      .from('assignments')
      .select('judge_ids')
      .eq('id', assignmentId)
      .single();

    if (!checkAssign?.judge_ids.includes(user.id)) {
      throw new Error('Unauthorized: You are not assigned to this panel');
    }

    // 1. Insert Review
    const { error: reviewError } = await supabaseAdmin
      .from('reviews')
      .insert([
        {
          assignment_id: assignmentId,
          judge_id: user.id,
          team_id: teamId,
          scores: scores
        }
      ]);

    if (reviewError) throw reviewError;

    // 2. Increment Assignment Index
    const { data: assignment } = await supabaseAdmin
      .from('assignments')
      .select('current_team_index, team_ids')
      .eq('id', assignmentId)
      .single();

    const nextIndex = (assignment?.current_team_index || 0) + 1;
    
    await supabaseAdmin
      .from('assignments')
      .update({
        current_team_index: nextIndex,
        started: true
      })
      .eq('id', assignmentId);

    revalidatePath('/judge/history');
    revalidatePath('/judge');

    console.log(`Review submitted successfully for team ${teamId} by judge ${user.id}`);

    return { success: true, finished: nextIndex >= (assignment?.team_ids.length || 0) };
  } catch (error: any) {
    console.error('Error in submitReviewAction:', error);
    return { success: false, error: error.message };
  }
}

export async function getJudgeHistoryAction() {
  try {
    const user = await ensureJudge();

    console.log(`Fetching history for judge: ${user.id}`);

    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select('*, teams(*)')
      .eq('judge_id', user.id)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    console.log(`Found ${reviews?.length || 0} reviews in history`);

    return { success: true, reviews };
  } catch (error: any) {
    console.error('Error in getJudgeHistoryAction:', error);
    return { success: false, error: error.message };
  }
}
