'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { ensureAdmin } from '@/lib/security';

export async function getCriteriaAction() {
  try {
    await ensureAdmin();
    const { data, error } = await supabaseAdmin
      .from('criteria')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
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

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
      throw new Error('Server configuration error: Missing Service Role Key');
    }

    const { data, error } = await supabaseAdmin
      .from('criteria')
      .insert([{ name, label }])
      .select();

    if (error) {
      console.error('❌ Supabase DB Error:', error);
      throw error;
    }

    revalidatePath('/admin/criteria');
    revalidatePath('/admin/results');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Action failed:', error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteCriterionAction(id: string) {
  try {
    await ensureAdmin();
    const { error } = await supabaseAdmin
      .from('criteria')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Supabase DB Error:', error);
      throw error;
    }

    revalidatePath('/admin/criteria');
    revalidatePath('/admin/results');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Action failed:', error.message);
    return { success: false, error: error.message };
  }
}
