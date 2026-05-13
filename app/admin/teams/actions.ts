'use server';

import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { ensureAdmin } from '@/lib/security';

export async function getTeamsAction() {
  try {
    await ensureAdmin();
    const snapshot = await adminDb.collection('teams')
      .orderBy('created_at', 'desc')
      .get();

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    })).sort((a, b) => (a.slot_number || '').localeCompare(b.slot_number || '', undefined, { numeric: true, sensitivity: 'base' }));

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
    const docRef = adminDb.collection('teams').doc();
    await docRef.set({
      id: docRef.id,
      team_name: teamName,
      project_title: projectTitle,
      description,
      slot_number: slotNumber,
      created_at: new Date().toISOString(),
    });

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
    const batch = adminDb.batch();
    
    teams.forEach(team => {
      const docRef = adminDb.collection('teams').doc();
      batch.set(docRef, {
        ...team,
        id: docRef.id,
        created_at: new Date().toISOString(),
      });
    });

    await batch.commit();

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
    await adminDb.collection('teams').doc(id).delete();

    revalidatePath('/admin/teams');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting team:', error);
    return { success: false, error: error.message };
  }
}
