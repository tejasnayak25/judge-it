'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export async function getJudgesAction() {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('role', 'judge')
      .order('full_name', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching judges:', error);
    return { success: false, error: error.message };
  }
}

export async function createJudgeAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error) throw error;

    revalidatePath('/admin/judges');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating judge:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteJudgeAction(id: string) {
  try {
    // Delete from auth (this will cascade to profiles if set up correctly)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;

    revalidatePath('/admin/judges');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting judge:', error);
    return { success: false, error: error.message };
  }
}
