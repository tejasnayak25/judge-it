'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { ensureAdmin } from '@/lib/security';

export async function getTeamsAction() {
  try {
    await ensureAdmin();
    const { data, error } = await supabaseAdmin
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching teams:', error);
    return { success: false, error: error.message };
  }
}

export async function createTeamAction(formData: FormData) {
  const teamName = formData.get('teamName') as string;
  const projectTitle = formData.get('projectTitle') as string;
  const description = formData.get('description') as string;
  const slotNumber = formData.get('slotNumber') as string;

  try {
    await ensureAdmin();
    const { data, error } = await supabaseAdmin
      .from('teams')
      .insert([
        { 
          team_name: teamName, 
          project_title: projectTitle, 
          description, 
          slot_number: slotNumber 
        }
      ]);

    if (error) throw error;

    revalidatePath('/admin/teams');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating team:', error);
    return { success: false, error: error.message };
  }
}

export async function bulkCreateTeamsAction(teams: any[]) {
  try {
    await ensureAdmin();
    const { error } = await supabaseAdmin
      .from('teams')
      .insert(teams);

    if (error) throw error;

    revalidatePath('/admin/teams');
    return { success: true };
  } catch (error: any) {
    console.error('Error bulk creating teams:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteTeamAction(id: string) {
  try {
    await ensureAdmin();
    const { error } = await supabaseAdmin
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/admin/teams');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting team:', error);
    return { success: false, error: error.message };
  }
}
