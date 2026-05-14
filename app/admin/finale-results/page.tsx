'use client';

import { useState, useEffect } from 'react';
import { 
  Crown, 
  RefreshCw, 
  Loader2, 
  Trophy, 
  Users, 
  Star,
  Medal,
  Award,
  Zap
} from 'lucide-react';
import { getFinaleResultsAction } from './actions';

export default function FinaleResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [criteria, setCriteria] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  async function fetchResults() {
    setLoading(true);
    try {
      const res = await getFinaleResultsAction();
      if (res.success) {
        setResults(res.results || []);
        setCriteria(res.criteria || []);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
        <p className="text-muted-foreground font-medium">Crunching Finale Data...</p>
      </div>
    );
  }

  const top6 = results.slice(0, 6);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-yellow-500">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
              <Crown className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black font-outfit uppercase tracking-tighter">Ultimate Champions</h1>
          </div>
          <p className="text-muted-foreground text-lg">Final leaderboard based on the Master Panel evaluations.</p>
        </div>
        <button 
          onClick={fetchResults}
          className="flex items-center gap-2 px-6 py-3 bg-muted hover:bg-border rounded-xl transition-all font-bold text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Standings
        </button>
      </div>

      {/* Top 3 Podium */}
      {top6.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
          {/* Second Place */}
          {top6[1] && (
            <div className="order-2 md:order-1 mt-12">
              <div className="glass-card p-8 rounded-[3rem] border border-zinc-500/20 bg-zinc-500/5 text-center space-y-4 relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-zinc-400 rounded-2xl flex items-center justify-center shadow-lg">
                  <Medal className="w-6 h-6 text-zinc-900" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold font-outfit truncate px-2">{top6[1].project_title}</h3>
                  <p className="text-xs text-muted-foreground font-black uppercase">{top6[1].team_name}</p>
                </div>
                <div className="text-3xl font-black font-outfit text-zinc-400">{top6[1].average_score.toFixed(1)}</div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">2nd PLACE</div>
              </div>
            </div>
          )}

          {/* First Place */}
          {top6[0] && (
            <div className="order-1 md:order-2 scale-110">
              <div className="glass-card p-10 rounded-[3rem] border border-yellow-500/30 bg-yellow-500/10 text-center space-y-6 relative shadow-[0_0_50px_rgba(234,179,8,0.1)]">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-yellow-500 rounded-3xl flex items-center justify-center shadow-2xl animate-bounce">
                  <Crown className="w-10 h-10 text-yellow-950" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black font-outfit truncate px-2">{top6[0].project_title}</h3>
                  <p className="text-xs text-yellow-600 font-black uppercase tracking-widest">{top6[0].team_name}</p>
                </div>
                <div className="text-5xl font-black font-outfit text-yellow-500 drop-shadow-lg">{top6[0].average_score.toFixed(1)}</div>
                <div className="inline-flex items-center gap-2 px-4 py-1 bg-yellow-500 text-yellow-950 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Grand Champion
                </div>
              </div>
            </div>
          )}

          {/* Third Place */}
          {top6[2] && (
            <div className="order-3 md:order-3 mt-12">
              <div className="glass-card p-8 rounded-[3rem] border border-amber-700/20 bg-amber-700/5 text-center space-y-4 relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-amber-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <Award className="w-6 h-6 text-amber-100" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold font-outfit truncate px-2">{top6[2].project_title}</h3>
                  <p className="text-xs text-muted-foreground font-black uppercase">{top6[2].team_name}</p>
                </div>
                <div className="text-3xl font-black font-outfit text-amber-700">{top6[2].average_score.toFixed(1)}</div>
                <div className="text-[10px] font-bold text-amber-700/70 uppercase tracking-widest">3rd PLACE</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="glass-card rounded-[3rem] border border-border bg-card/30 overflow-hidden mt-20">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-8 py-5 text-xs font-black uppercase tracking-widest">Rank</th>
              <th className="px-8 py-5 text-xs font-black uppercase tracking-widest">Finalist</th>
              <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-center">Panel Reviews</th>
              <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-right">Avg Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {results.map((r, i) => (
              <tr key={r.team_id} className={`hover:bg-muted/30 transition-colors ${i < 6 ? 'bg-primary/5' : ''}`}>
                <td className="px-8 py-6">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                    i === 0 ? 'bg-yellow-500 text-black' : 
                    i === 1 ? 'bg-zinc-300 text-black' :
                    i === 2 ? 'bg-amber-600 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {i + 1}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-1">
                    <p className="font-bold text-lg">{r.project_title}</p>
                    <p className="text-xs text-primary font-bold uppercase tracking-wider">{r.team_name} • {r.slot_number}</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex justify-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full border border-border">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-bold">{r.review_count} / 4</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="text-2xl font-black font-outfit text-primary">{r.average_score.toFixed(1)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
