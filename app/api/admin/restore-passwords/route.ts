import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { passwordMap } = await req.json();
    const snapshot = await adminDb.collection('users').where('role', '==', 'judge').get();
    
    let count = 0;
    for (const doc of snapshot.docs) {
      const email = doc.data().email?.trim();
      if (passwordMap[email]) {
        await doc.ref.update({ password: passwordMap[email] });
        count++;
      }
    }

    return NextResponse.json({ success: true, message: `Restored ${count} passwords in the database.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
