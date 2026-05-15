'use server';

import { adminDb } from '@/lib/firebase-admin';
import { ensureAdmin } from '@/lib/security';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, VerticalAlign } from 'docx';

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

export async function exportFinaleWinnersAction() {
  try {
    await ensureAdmin();
    const res = await getFinaleResultsAction();
    if (!res.success || !res.results) throw new Error(res.error || "No results found");

    // Take top 6 for the export
    const winners = res.results.slice(0, 6);

    const createWinnerTable = (title: string, teams: any[], color: string) => {
      const headerRow = new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Rank", bold: true, color: "ffffff" })] })], shading: { fill: color } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Project Title", bold: true, color: "ffffff" })] })], shading: { fill: color } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Team Name", bold: true, color: "ffffff" })] })], shading: { fill: color } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Avg Score", bold: true, color: "ffffff" })] })], shading: { fill: color } }),
        ],
      });

      const bodyRows = teams.map((team, index) => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (index + 1).toString(), bold: true })] }),], verticalAlign: VerticalAlign.CENTER }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: team.project_title, bold: true })] })] }),
          new TableCell({ children: [new Paragraph(team.team_name)] }),
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
                  text: "GRAND FINALE WINNERS SHEET",
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

            ...createWinnerTable("ULTIMATE CHAMPIONS (TOP 6)", winners, "eab308"), // yellow-500

            new Paragraph({
              children: [
                new TextRun({
                  text: "Congratulations to the top teams for their exceptional performance in the Grand Finale!",
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
    console.error('Error in exportFinaleWinnersAction:', error);
    return { success: false, error: error.message };
  }
}
