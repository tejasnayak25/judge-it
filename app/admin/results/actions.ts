'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, HeadingLevel, BorderStyle, WidthType } from 'docx';
import { ensureAdmin } from '@/lib/security';

export async function getResultsAction() {
  try {
    await ensureAdmin();
    
    // 1. Fetch data from Firestore
    const [teamsSnap, reviewsSnap, criteriaSnap, usersSnap, assignmentsSnap] = await Promise.all([
      adminDb.collection('teams').get(),
      adminDb.collection('reviews').get(),
      adminDb.collection('criteria').orderBy('created_at', 'asc').get(),
      adminDb.collection('users').get(),
      adminDb.collection('assignments').get()
    ]);

    const teams = teamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    const reviews = reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    const criteria = criteriaSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    const assignments = assignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    const users = usersSnap.docs.reduce((acc: any, doc) => {
      acc[doc.id] = doc.data();
      return acc;
    }, {});

    // 2. Process results with detailed criteria scoring for tie-breaking
    const processedResults = teams.map((team: any) => {
      const teamReviews = reviews.filter((r: any) => r.team_id === team.id);

      const judge_reviews = teamReviews.map((r: any) => {
        const total_score = Object.values(r.scores as Record<string, number>).reduce((a, b) => a + b, 0);
        return {
          judge_name: users[r.judge_id]?.full_name || 'Judge',
          total_score: total_score,
          scores: r.scores as Record<string, number>
        };
      });

      const totalPoints = judge_reviews.reduce((sum, r) => sum + r.total_score, 0);
      const averageScore = judge_reviews.length > 0 ? totalPoints / judge_reviews.length : 0;

      // Calculate average per criterion for tie-breaking
      const criteriaAverages: Record<string, number> = {};
      criteria.forEach(c => {
        const scores = judge_reviews.map(jr => jr.scores[c.name] || 0);
        criteriaAverages[c.name] = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      });

      return {
        team_id: team.id,
        team_name: team.team_name,
        project_title: team.project_title,
        slot_number: team.slot_number || '',
        judge_reviews,
        average_score: averageScore,
        criteria_averages: criteriaAverages
      };
    });

    const tieBreaker = (a: any, b: any) => {
      // Primary Sort: Average Score
      if (Math.abs(b.average_score - a.average_score) > 0.001) {
        return b.average_score - a.average_score;
      }
      
      // Dynamic Tie-break: Check every single criterion in the order they were created
      // This respects your priority (Innovation, Real Time, etc. as the first ones)
      for (const crit of criteria) {
        const scoreA = a.criteria_averages[crit.name] || 0;
        const scoreB = b.criteria_averages[crit.name] || 0;
        
        if (Math.abs(scoreB - scoreA) > 0.001) {
          return scoreB - scoreA;
        }
      }
      
      return 0;
    };

    // Filter to only include teams that have actually been judged
    const judgedResults = processedResults.filter(r => r.judge_reviews.length > 0);
    judgedResults.sort(tieBreaker);

    // 4. Calculate Award Qualifiers based on Strict Quotas
    const winners: any = { F: [], S: [], T: [] };
    const selectedIds = new Set<string>();

    // Group teams by assignment (batch)
    const teamsByAssignment = assignments.map(a => {
      const batchTeams = judgedResults.filter(r => a.team_ids.includes(r.team_id));
      batchTeams.sort(tieBreaker);
      return {
        id: a.id,
        prefix: batchTeams[0]?.slot_number?.charAt(0).toUpperCase() || '',
        teams: batchTeams
      };
    });

    // --- First Year (F): Top 2 overall ---
    const fTeams = judgedResults.filter(r => r.slot_number?.startsWith('F'));
    fTeams.sort(tieBreaker);
    winners.F = fTeams.slice(0, 2);
    winners.F.forEach((w: any) => selectedIds.add(w.team_id));

    // --- Second Year (S): 1 from each batch ---
    const sBatches = teamsByAssignment.filter(b => b.prefix === 'S');
    sBatches.forEach(b => {
      if (b.teams.length > 0) {
        winners.S.push(b.teams[0]);
        selectedIds.add(b.teams[0].team_id);
      }
    });

    // --- Third Year (T): Top 1 from each batch (Max 2) + 1 next best overall ---
    const tBatches = teamsByAssignment.filter(b => b.prefix === 'T');
    
    // Take Top 1 from first two T batches
    tBatches.slice(0, 2).forEach(b => {
      if (b.teams.length > 0) {
        winners.T.push(b.teams[0]);
        selectedIds.add(b.teams[0].team_id);
      }
    });

    // Fill remaining T spots (to reach 3) from the general T pool
    if (winners.T.length < 3) {
      const remainingTTeams = judgedResults.filter(r => 
        r.slot_number?.startsWith('T') && !selectedIds.has(r.team_id)
      );
      remainingTTeams.sort(tieBreaker);
      
      const needed = 3 - winners.T.length;
      winners.T.push(...remainingTTeams.slice(0, needed));
    }

    return {
      success: true,
      results: judgedResults,
      winners,
      criteria
    };
  } catch (error: any) {
    console.error('Error in getResultsAction:', error);
    return { success: false, error: error.message };
  }
}

export async function exportWinnersAction() {
  try {
    await ensureAdmin();
    const res = await getResultsAction();
    if (!res.success) throw new Error(res.error);

    if (!res.results) throw new Error("No results found");

    const top6 = res.results.slice(0, 6);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "COMPETITION RESULTS",
                  bold: true,
                  size: 32, // 16pt
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated on: ${new Date().toLocaleDateString()}`,
                  italics: true,
                  size: 20, // 10pt
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 800 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Rank", bold: true })] })], shading: { fill: "f2f2f2" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Team Name", bold: true })] })], shading: { fill: "f2f2f2" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Project Title", bold: true })] })], shading: { fill: "f2f2f2" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Average Score", bold: true })] })], shading: { fill: "f2f2f2" } }),
                  ],
                }),
                ...top6.map((team, index) => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (index + 1).toString(), bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(team.team_name)] }),
                    new TableCell({ children: [new Paragraph(team.project_title)] }),
                    new TableCell({ children: [new Paragraph(team.average_score.toFixed(2))] }),
                  ],
                })),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Congratulations to all participants!",
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 1000 },
            }),
          ],
        },
      ],
    });

    const b64 = await Packer.toBase64String(doc);
    return { success: true, data: b64 };
  } catch (error: any) {
    console.error('Error in exportWinnersAction:', error);
    return { success: false, error: error.message };
  }
}
