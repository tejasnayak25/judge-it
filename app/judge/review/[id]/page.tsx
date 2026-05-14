'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Layers,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Info,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StarRating from '@/components/rating/StarRating';
import { getReviewStateAction, submitReviewAction } from '../actions';

interface Team {
  id: string;
  team_name: string;
  project_title: string;
  description: string;
  members?: string;
  slot_number?: string;
}

interface Assignment {
  id: string;
  team_ids: string[];
  current_team_index: number;
  started: boolean;
}

interface Criterion {
  id: string;
  name: string;
  label: string;
}

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: assignmentId } = use(params);
  const router = useRouter();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [allTeams, setAllTeams] = useState<any[]>([]);

  useEffect(() => {
    fetchReviewState();
  }, [assignmentId]);

  async function fetchReviewState(index?: number) {
    setLoading(true);
    try {
      const res = await getReviewStateAction(assignmentId, index);

      if (!res.success) throw new Error(res.error);

      if (res.finished) {
        router.push('/judge');
        return;
      }

      setAssignment(res.assignment as any);
      setCriteria((res.criteria as any) || []);
      setCurrentTeam((res.team as any) || null);
      setAllTeams(res.allTeams || []);

      // Initialize scores from existing ones if available
      const initialScores: Record<string, number> = {};
      res.criteria?.forEach((c: any) => {
        initialScores[c.name] = res.existingScores?.[c.name] || 0;
      });
      setScores(initialScores);

    } catch (error) {
      console.error('Error fetching review state:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePrevious() {
    if (!assignment || assignment.current_team_index === 0) return;
    await fetchReviewState(assignment.current_team_index - 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const allFilled = Object.values(scores).every(score => score > 0);
    if (!allFilled) {
      alert('Please provide scores for all criteria.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitReviewAction(
        assignmentId,
        currentTeam?.id!,
        scores
      );

      if (!res.success) throw new Error(res.error);

      if (res.finished && (assignment?.current_team_index! + 1) === assignment?.team_ids.length) {
        router.push('/judge');
      } else {
        await fetchReviewState(assignment?.current_team_index! + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

    } catch (error: any) {
      console.error('Error submitting review:', error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Preparing review room...</p>
      </div>
    );
  }

  if (!currentTeam || !assignment) return null;

  const isLastTeam = (assignment.current_team_index + 1) === assignment.team_ids.length;

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4 sm:px-6 lg:px-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        
        {/* Mobile Top Row: Slot + Progress */}
        <div className="flex items-center justify-between md:hidden w-full">
          <div className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl shrink-0">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Slot</span>
            <p className="text-sm font-black font-outfit text-primary">{currentTeam.slot_number || 'N/A'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Progress</p>
            <p className="text-sm font-bold font-outfit">
              {assignment.current_team_index + 1} <span className="text-muted-foreground/50">of</span> {assignment.team_ids.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-2xl hidden md:block shrink-0">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Judging Slot</span>
            <p className="text-xl font-black font-outfit text-primary">{currentTeam.slot_number || 'N/A'}</p>
          </div>
          
          <div className="space-y-0.5 flex-1 min-w-[200px] max-w-sm">
            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">Jump to Team</p>
            <select 
              value={assignment.current_team_index}
              onChange={(e) => fetchReviewState(Number(e.target.value))}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-sm truncate cursor-pointer shadow-sm hover:border-primary/50"
            >
              {allTeams.map((t, idx) => (
                <option key={t.id} value={idx}>
                  Team {idx + 1}: {t.project_title} ({t.slot_number})
                </option>
              ))}
            </select>
          </div>

          <div className="h-10 w-[1px] bg-border hidden md:block shrink-0" />
          <div className="space-y-0.5 hidden sm:block shrink-0">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Progress</p>
            <p className="text-lg font-bold font-outfit">
              {assignment.current_team_index + 1} <span className="text-muted-foreground/50">of</span> {assignment.team_ids.length}
            </p>
          </div>
        </div>
        
        {/* Navigation Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevious}
            disabled={assignment.current_team_index === 0 || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-accent transition-colors disabled:opacity-30 text-sm font-bold uppercase tracking-wider"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Previous
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Team Details */}
        <div className="lg:col-span-5 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-8 sm:p-10 rounded-[2.5rem] border border-border bg-card/30 lg:sticky lg:top-24 shadow-2xl"
          >
            <div className="w-16 h-16 bg-primary rounded-[1.25rem] flex items-center justify-center mb-8 shadow-2xl shadow-primary/20">
              <Trophy className="w-8 h-8 text-primary-foreground" />
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-3xl sm:text-4xl font-bold font-outfit tracking-tight leading-[1.1]">
                  {currentTeam.project_title}
                </h2>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">Team Members</p>
                  <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed">
                    {currentTeam.team_name?.replace(/\r/g, '') || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-border/50">
                <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Description
                </h4>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed italic">
                  "{currentTeam.description || 'No description provided for this project.'}"
                </p>
              </div>

              <div className="pt-4">
                <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                  <p className="text-xs text-yellow-500/80 leading-relaxed font-semibold">
                    Note: Once you click "{isLastTeam ? 'Finalize' : 'Next Team'}", scores for this team will be locked.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Scoring Form */}
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 sm:p-12 rounded-[2.5rem] border border-border bg-card/50 shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex items-center mb-10">
              <h3 className="text-2xl font-bold font-outfit flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-primary" />
                Score Card
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-10">
                {criteria.map((criterion) => (
                  <div key={criterion.id} className="space-y-4">
                    <StarRating
                      label={criterion.label}
                      value={scores[criterion.name] || 0}
                      onChange={(v) => setScores(s => ({ ...s, [criterion.name]: v }))}
                      disabled={isSubmitting}
                    />
                  </div>
                ))}
              </div>

              <div className="pt-10 border-t border-border/50">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex items-center justify-center gap-3 py-5 px-8 font-black rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 shadow-2xl text-lg uppercase tracking-[0.15em] ${
                    isLastTeam 
                      ? 'bg-green-600 text-white shadow-green-600/20 hover:bg-green-700' 
                      : 'bg-primary text-primary-foreground shadow-primary/30 hover:opacity-90'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {isLastTeam ? 'Finalize & Submit All' : 'Save & Next Team'}
                      <ChevronRight className="w-6 h-6" />
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-6 mt-6">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Weightage</span>
                    <span className="text-sm font-bold">25 Points</span>
                  </div>
                  <div className="w-[1px] h-6 bg-border" />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Current Total</span>
                    <span className="text-sm font-bold text-primary">
                      {Object.values(scores).reduce((a, b) => a + b, 0)} / 25
                    </span>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
