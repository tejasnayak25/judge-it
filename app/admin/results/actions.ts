'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, HeadingLevel, BorderStyle, WidthType } from 'docx';
import { ensureAdmin } from '@/lib/security';

export async function getResultsAction() {
  try {
    await ensureAdmin();
    // 1. Fetch teams, criteria, and reviews with judge names
    // Note: We use supabaseAdmin to bypass RLS and get ALL data
    const [teamsRes, reviewsRes, criteriaRes] = await Promise.all([
      supabaseAdmin.from('teams').select('*'),
      supabaseAdmin.from('reviews').select('*, user_profiles(full_name)'),
      supabaseAdmin.from('criteria').select('*').order('created_at', { ascending: true })
    ]);

    if (teamsRes.error) throw teamsRes.error;
    if (reviewsRes.error) throw reviewsRes.error;
    if (criteriaRes.error) throw criteriaRes.error;

    const teams = teamsRes.data || [];
    const reviews = reviewsRes.data || [];
    const criteria = criteriaRes.data || [];

    // 2. Process results into the format expected by the UI
    const processedResults = teams.map(team => {
      const teamReviews = reviews.filter(r => r.team_id === team.id);

      const judge_reviews = teamReviews.map(r => {
        const total_score = Object.values(r.scores as Record<string, number>).reduce((a, b) => a + b, 0);
        return {
          judge_name: (r as any).user_profiles?.full_name || 'Judge',
          total_score: total_score,
          scores: r.scores as Record<string, number>
        };
      });

      const totalPoints = judge_reviews.reduce((sum, r) => sum + r.total_score, 0);
      const averageScore = judge_reviews.length > 0 ? totalPoints / judge_reviews.length : 0;

      return {
        team_id: team.id,
        team_name: team.team_name,
        project_title: team.project_title,
        judge_reviews,
        average_score: averageScore
      };
    });

    // Sort by average score descending
    processedResults.sort((a, b) => b.average_score - a.average_score);

    return {
      success: true,
      results: processedResults,
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
