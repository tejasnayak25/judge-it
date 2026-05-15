'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, HeadingLevel, BorderStyle, WidthType, VerticalAlign } from 'docx';
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
    
    // Filter out grand finale assignments from this view
    const assignments = assignmentsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() as any }))
      .filter(a => a.type !== 'grand_finale');

    const users = usersSnap.docs.reduce((acc: any, doc) => {
      acc[doc.id] = doc.data();
      return acc;
    }, {});

    // 2. Process results with detailed criteria scoring for tie-breaking
    const processedResults = teams.map((team: any) => {
      // Find all assignments for this team (excluding grand finale which was filtered above)
      const teamAssignments = assignments.filter((a: any) => a.team_ids.includes(team.id));
      
      // Sort by created_at (ascending) to pick the oldest one
      teamAssignments.sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      });

      const oldestAssignment = teamAssignments[0];

      // If one team is in multiple assignments, pick older one.
      // Newer assignment is of grand finale (filtered above) or a subsequent round.
      const teamReviews = oldestAssignment 
        ? reviews.filter((r: any) => r.team_id === team.id && r.assignment_id === oldestAssignment.id)
        : [];

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

    // 4. Calculate Award Qualifiers based on Strict Quotas (2-5-3)
    const winners: any = { F: [], S: [], T: [] };

    // --- First Year (F): Top 2 ---
    const fTeams = judgedResults.filter(r => r.slot_number?.toUpperCase().startsWith('F'));
    fTeams.sort(tieBreaker);
    winners.F = fTeams.slice(0, 2);

    // --- Second Year (S): Top 5 ---
    const sTeams = judgedResults.filter(r => r.slot_number?.toUpperCase().startsWith('S'));
    sTeams.sort(tieBreaker);
    winners.S = sTeams.slice(0, 5);

    // --- Third Year (T): Top 3 ---
    const tTeams = judgedResults.filter(r => r.slot_number?.toUpperCase().startsWith('T'));
    tTeams.sort(tieBreaker);
    winners.T = tTeams.slice(0, 3);

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
    if (!res.success || !res.winners) throw new Error(res.error || "No results found");

    const winners = res.winners;

    const createWinnerTable = (title: string, teams: any[], color: string) => {
      const headerRow = new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Rank", bold: true, color: "ffffff" })] })], shading: { fill: color } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Project Title", bold: true, color: "ffffff" })] })], shading: { fill: color } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Team Name", bold: true, color: "ffffff" })] })], shading: { fill: color } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Batch", bold: true, color: "ffffff" })] })], shading: { fill: color } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Avg Score", bold: true, color: "ffffff" })] })], shading: { fill: color } }),
        ],
      });

      const bodyRows = teams.map((team, index) => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (index + 1).toString(), bold: true })] }),], verticalAlign: VerticalAlign.CENTER }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: team.project_title, bold: true })] })] }),
          new TableCell({ children: [new Paragraph(team.team_name)] }),
          new TableCell({ children: [new Paragraph(team.slot_number)] }),
          new TableCell({ children: [new Paragraph(team.average_score.toFixed(2))] }),
        ],
      }));

      return [
        new Paragraph({
          children: [new TextRun({ text: title, bold: true, size: 28, color: color })],
          spacing: { before: 400, after: 200 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, ...bodyRows],
        }),
      ];
    };

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "COMPETITION WINNER SHEET",
                  bold: true,
                  size: 40,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated on: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`,
                  italics: true,
                  size: 20,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 800 },
            }),

            ...createWinnerTable("FIRST YEAR QUALIFIERS (TOP 2)", winners.F, "2563eb"), // blue-600
            ...createWinnerTable("SECOND YEAR QUALIFIERS (TOP 5)", winners.S, "7c3aed"), // violet-600
            ...createWinnerTable("THIRD YEAR QUALIFIERS (TOP 3)", winners.T, "059669"), // emerald-600

            new Paragraph({
              children: [
                new TextRun({
                  text: "Congratulations to all participants for their hard work and innovation!",
                  italics: true,
                  size: 18,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 1200 },
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
