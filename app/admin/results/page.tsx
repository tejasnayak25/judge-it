'use client';

import { useState, useEffect } from 'react';
import { 
  Trophy, 
  Download, 
  Search, 
  Star, 
  Users,
  TrendingUp,
  Loader2,
  ChevronDown,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getResultsAction } from './actions';
import ExportWinnersButton from '@/components/admin/ExportWinnersButton';

interface Result {
  team_id: string;
  team_name: string;
  project_title: string;
  judge_reviews: {
    judge_name: string;
    total_score: number;
    scores: Record<string, number>;
  }[];
  average_score: number;
}

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [criteria, setCriteria] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchResults();
  }, []);

  async function fetchResults() {
    try {
      const res = await getResultsAction();
      
      if (!res.success) throw new Error(res.error);

      setCriteria(res.criteria || []);
      setResults(res.results || []);

    } catch (error: any) {
      console.error('Error fetching results:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredResults = results.filter(r => 
    r.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.project_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportCSV = () => {
    const headers = ['Team Name', 'Project Title', 'Avg Score', 'Judge 1', 'Score 1', 'Judge 2', 'Score 2'];
    const rows = results.map(r => [
      r.team_name,
      r.project_title,
      r.average_score.toFixed(2),
      r.judge_reviews[0]?.judge_name || 'N/A',
      r.judge_reviews[0]?.total_score || 0,
      r.judge_reviews[1]?.judge_name || 'N/A',
      r.judge_reviews[1]?.total_score || 0,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "judging_results.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-outfit tracking-tight">Competition Results</h1>
          <p className="text-muted-foreground">Final leaderboard and judge feedback.</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportWinnersButton variant="compact" />
          <button 
            onClick={fetchResults}
            disabled={loading}
            className="p-3 bg-muted hover:bg-border text-foreground rounded-xl transition-all active:scale-95 border border-border flex items-center gap-2 font-bold text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-border bg-card/30 flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Top Score</p>
            <p className="text-2xl font-bold font-outfit">{results[0]?.average_score.toFixed(1) || '0.0'} / {criteria.length * 5}</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl border border-border bg-card/30 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Average Across Teams</p>
            <p className="text-2xl font-bold font-outfit">
              {(results.reduce((a, b) => a + b.average_score, 0) / (results.length || 1)).toFixed(1)}
            </p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl border border-border bg-card/30 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Reviews</p>
            <p className="text-2xl font-bold font-outfit">
              {results.reduce((a, b) => a + b.judge_reviews.length, 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search teams or projects..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card/50 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      <div className="glass-card rounded-3xl border border-border bg-card/30 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Calculating scores...</p>
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="overflow-x-auto overflow-hidden rounded-[2rem]">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 font-semibold text-sm uppercase tracking-wider w-16">Rank</th>
                  <th className="px-6 py-4 font-semibold text-sm uppercase tracking-wider">Project / Team</th>
                  <th className="px-6 py-4 font-semibold text-sm uppercase tracking-wider text-center">Panel Breakdown</th>
                  <th className="px-6 py-4 font-semibold text-sm uppercase tracking-wider text-right">Final Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredResults.map((result, index) => (
                  <tr key={result.team_id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                        index === 0 ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)] scale-110' : 
                        index === 1 ? 'bg-zinc-300 text-black' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        index < 6 ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-400' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-lg">{result.project_title}</span>
                        <span className="text-sm text-primary font-medium">{result.team_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        {result.judge_reviews.length > 0 ? (
                          result.judge_reviews.map((jr, i) => (
                            <div key={i} className="flex flex-col items-center p-2 bg-muted/50 rounded-xl border border-border/50 min-w-[80px]">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground truncate max-w-[70px]">
                                {jr.judge_name.split(' ')[0]}
                              </span>
                              <span className="text-sm font-bold">{jr.total_score}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No reviews yet</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-muted-foreground uppercase opacity-50 tracking-tighter">AVG</span>
                          <span className="text-3xl font-black font-outfit text-primary">
                            {result.average_score.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex gap-0.5 mt-1">
                          {Array.from({ length: criteria.length }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-2.5 h-2.5 ${i < Math.round(result.average_score / (criteria.length * 5) * criteria.length) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/20'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold">No results available</p>
          </div>
        )}
      </div>
    </div>
  );
}
