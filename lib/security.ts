import { getSession } from './auth';
import { db } from './db';

export async function ensureAdmin() {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized: No active session found');
  }

  const profile = await db.getProfile(session.uid);

  if ((profile as any)?.role !== 'admin') {
    throw new Error('Unauthorized: Admin privileges required');
  }

  return session;
}

export async function ensureJudge() {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized: No active session found');
  }

  const profile = await db.getProfile(session.uid) as any;
  const role = profile?.role;

  if (role !== 'judge' && role !== 'admin') {
    throw new Error('Unauthorized: Access restricted to judges and administrators');
  }

  return session;
}
