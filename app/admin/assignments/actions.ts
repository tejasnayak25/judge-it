'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { ensureAdmin } from '@/lib/security';

export async function getAssignmentsAction() {
  try {
    await ensureAdmin();
    const { data, error } = await supabaseAdmin
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    return { success: false, error: error.message };
  }
}

export async function createAssignmentAction(judgeIds: string[], teamIds: string[]) {
  try {
    await ensureAdmin();
    const { data, error } = await supabaseAdmin
      .from('assignments')
      .insert([
        {
          judge_ids: judgeIds,
          team_ids: teamIds,
          revealed: false
        }
      ]);

    if (error) throw error;

    revalidatePath('/admin/assignments');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleAssignmentRevealAction(id: string, currentStatus: boolean) {
  try {
    await ensureAdmin();
    const { error } = await supabaseAdmin
      .from('assignments')
      .update({ revealed: !currentStatus })
      .eq('id', id);

    if (error) throw error;

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
    const { error } = await supabaseAdmin
      .from('assignments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/admin/assignments');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    return { success: false, error: error.message };
  }
}
