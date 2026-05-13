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

  useEffect(() => {
    fetchReviewState();
  }, [assignmentId]);

  async function fetchReviewState() {
    setLoading(true);
    try {
      const res = await getReviewStateAction(assignmentId);

      if (!res.success) throw new Error(res.error);

      if (res.finished) {
        router.push('/judge');
        return;
      }

      setAssignment(res.assignment);
      setCriteria((res.criteria as any) || []);
      setCurrentTeam(res.team || null);

      // Initialize scores
      const initialScores: Record<string, number> = {};
      res.criteria?.forEach((c: any) => {
        initialScores[c.name] = 0;
      });
      setScores(initialScores);

    } catch (error) {
      console.error('Error fetching review state:', error);
    } finally {
      setLoading(false);
    }
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

      if (res.finished) {
        router.push('/judge');
      } else {
        await fetchReviewState();
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

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-6 sm:mb-8">
        <span className="hidden sm:inline">Judging Slot</span>
        <ChevronRight className="w-4 h-4 hidden sm:inline" />
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold sm:bg-transparent sm:text-muted-foreground sm:p-0">
          Team {assignment.current_team_index + 1} of {assignment.team_ids.length}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Left Column: Team Details */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-border bg-card/30 lg:sticky lg:top-24"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-2xl shadow-primary/20">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-[0.2em]">{currentTeam.team_name}</span>
                <h2 className="text-2xl sm:text-3xl font-bold font-outfit tracking-tight leading-tight">
                  {currentTeam.project_title}
                </h2>
              </div>

              <div className="pt-4 border-t border-border/50">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Project Description
                </h4>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {currentTeam.description || 'No description provided for this project.'}
                </p>
              </div>

              <div className="pt-4">
                <div className="p-3 sm:p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl sm:rounded-2xl flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                  <p className="text-[11px] sm:text-xs text-yellow-500/80 leading-relaxed font-medium">
                    Scores for this team are final and cannot be edited after submission.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Scoring Form */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] border border-border bg-card/50 shadow-2xl backdrop-blur-2xl"
          >
            <h3 className="text-xl sm:text-2xl font-bold font-outfit mb-6 sm:mb-8 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              Evaluation Criteria
            </h3>

            <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10">
              <div className="space-y-6 sm:space-y-8">
                {criteria.map((criterion) => (
                  <StarRating
                    key={criterion.id}
                    label={criterion.label}
                    value={scores[criterion.name] || 0}
                    onChange={(v) => setScores(s => ({ ...s, [criterion.name]: v }))}
                    disabled={isSubmitting}
                  />
                ))}
              </div>

              <div className="pt-6 sm:pt-8 border-t border-border">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 py-4 sm:py-5 px-6 bg-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-2xl shadow-primary/30 text-base sm:text-lg uppercase tracking-wider"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit & Next
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    </>
                  )}
                </button>
                <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4">
                  Team Progress: {assignment.current_team_index + 1} of {assignment.team_ids.length}
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
