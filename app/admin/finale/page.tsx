'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Trophy, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Play,
  ArrowRight
} from 'lucide-react';
import { getResultsAction } from '../results/actions';
import { getJudgesAction } from '../judges/actions';
import { createFinaleAssignmentAction, getFinaleStatusAction } from './actions';
import CustomSelect from '@/components/admin/CustomSelect';

interface Team {
  team_id: string;
  team_name: string;
  project_title: string;
  slot_number: string;
}

export default function GrandFinalePage() {
  const [topTeams, setTopTeams] = useState<Team[]>([]);
  const [judges, setJudges] = useState<any[]>([]);
  const [selectedJudges, setSelectedJudges] = useState<string[]>(['', '', '', '']);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFinale, setActiveFinale] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [resultsRes, judgesRes, statusRes] = await Promise.all([
        getResultsAction(),
        getJudgesAction(),
        getFinaleStatusAction()
      ]);

      if (resultsRes.success && resultsRes.winners) {
        const allWinners = [
          ...resultsRes.winners.F,
          ...resultsRes.winners.S,
          ...resultsRes.winners.T
        ];
        setTopTeams(allWinners);
      }

      if (judgesRes.success) setJudges(judgesRes.data || []);
      if (statusRes.success) {
        setActiveFinale(statusRes.data);
        if (statusRes.data) {
          setSelectedJudges((statusRes.data as any).judge_ids);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleJudgeChange = (index: number, value: string) => {
    const newJudges = [...selectedJudges];
    newJudges[index] = value;
    setSelectedJudges(newJudges);
  };

  async function handleStartFinale() {
    const uniqueJudges = new Set(selectedJudges.filter(id => id !== ''));
    if (uniqueJudges.size < 4) {
      alert('Please select 4 unique judges for the Master Panel.');
      return;
    }

    setIsSubmitting(true);
    try {
      const teamIds = topTeams.map(t => t.team_id);
      const res = await createFinaleAssignmentAction(Array.from(uniqueJudges), teamIds);
      if (res.success) {
        alert('Grand Finale successfully activated!');
        fetchData();
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Preparing Finale Stage...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black font-outfit uppercase tracking-tight">Grand Finale</h1>
          </div>
          <p className="text-muted-foreground text-lg">The final showdown. Top 10 teams vs The Master Panel.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Top 10 Teams */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Qualified Finalists
            </h2>
            <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">{topTeams.length} Teams</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {topTeams.map((team, index) => (
              <div key={team.team_id} className="p-4 bg-card/50 border border-border rounded-2xl flex items-center gap-4 group hover:bg-card hover:border-primary/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center font-black text-primary">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{team.project_title}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase">{team.team_name} • {team.slot_number}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Master Panel Assignment */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-8 rounded-[2.5rem] border border-primary/20 bg-primary/5 sticky top-8">
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black font-outfit uppercase tracking-tight">Master Panel</h3>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Assign 4 Judges to evaluate the Finale</p>
              </div>

              <div className="space-y-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Judge {i + 1}</label>
                    <CustomSelect 
                      options={judges.map(j => ({ id: j.id, label: j.full_name }))}
                      value={selectedJudges[i]}
                      onChange={(val) => handleJudgeChange(i, val)}
                      placeholder={`Select Master Judge ${i + 1}`}
                      icon={<Users className="w-5 h-5" />}
                    />
                  </div>
                ))}
              </div>

              {activeFinale ? (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="text-sm font-bold text-green-600">Grand Finale Active</p>
                    <p className="text-[10px] text-green-600/70 uppercase font-black">Scoring is open for the Master Panel</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-primary" />
                  <p className="text-xs font-bold text-primary">Activating Round 2 will notify the selected judges.</p>
                </div>
              )}

              <button 
                onClick={handleStartFinale}
                disabled={isSubmitting || selectedJudges.some(j => j === '')}
                className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-30"
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : activeFinale ? 'Update Master Panel' : 'Start Grand Finale'}
                <Play className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
