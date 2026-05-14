'use server';

import { adminDb } from '@/lib/firebase-admin';
import { ensureAdmin } from '@/lib/security';

export async function getFinaleResultsAction() {
  try {
    await ensureAdmin();

    // 1. Get Finale Assignment
    const finaleSnap = await adminDb.collection('assignments')
      .where('type', '==', 'grand_finale')
      .limit(1)
      .get();

    if (finaleSnap.empty) return { success: true, results: [] };
    const finale = finaleSnap.docs[0].data();

    // 2. Fetch data
    const [teamsSnap, reviewsSnap, criteriaSnap, usersSnap] = await Promise.all([
      adminDb.collection('teams').get(),
      adminDb.collection('reviews').where('assignment_id', '==', finaleSnap.docs[0].id).get(),
      adminDb.collection('criteria').orderBy('created_at', 'asc').get(),
      adminDb.collection('users').get(),
    ]);

    const teams = teamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    const reviews = reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    const criteria = criteriaSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    const users = usersSnap.docs.reduce((acc: any, doc) => {
      acc[doc.id] = doc.data();
      return acc;
    }, {});

    // 3. Process
    const processedResults = finale.team_ids.map((teamId: string) => {
      const team = teams.find(t => t.id === teamId);
      const teamReviews = reviews.filter(r => r.team_id === teamId);

      const judge_reviews = teamReviews.map(r => {
        const total_score = Object.values(r.scores as Record<string, number>).reduce((a, b) => a + b, 0);
        return {
          judge_name: users[r.judge_id]?.full_name || 'Judge',
          total_score: total_score,
          scores: r.scores
        };
      });

      const totalPoints = judge_reviews.reduce((sum, r) => sum + r.total_score, 0);
      const averageScore = judge_reviews.length > 0 ? totalPoints / judge_reviews.length : 0;

      return {
        team_id: teamId,
        team_name: team?.team_name || 'Unknown',
        project_title: team?.project_title || 'Unknown',
        slot_number: team?.slot_number || '',
        judge_reviews,
        average_score: averageScore,
        review_count: judge_reviews.length
      };
    });

    processedResults.sort((a: any, b: any) => b.average_score - a.average_score);

    return {
      success: true,
      results: processedResults,
      criteria
    };
  } catch (error: any) {
    console.error('Error in getFinaleResultsAction:', error);
    return { success: false, error: error.message };
  }
}
