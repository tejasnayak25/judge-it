import { createClient } from '@/lib/supabase-server';
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  ShieldAlert,
  Trophy
} from 'lucide-react';
import Link from 'next/link';

export default async function JudgeDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch assignment where judge is included
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('*')
    .contains('judge_ids', [user?.id])
    .single();

  if (assignmentError || !assignment) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center space-y-6">
        <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-outfit">No Assignment Found</h2>
          <p className="text-muted-foreground text-lg">
            You haven't been assigned to any judging slot yet. Please wait for the administrator to assign you.
          </p>
        </div>
      </div>
    );
  }

  if (!assignment.revealed) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center space-y-6">
        <div className="w-20 h-20 bg-yellow-500/10 rounded-3xl flex items-center justify-center mx-auto border border-yellow-500/20">
          <Clock className="w-10 h-10 text-yellow-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-outfit">Judging Not Started</h2>
          <p className="text-muted-foreground text-lg">
            Your assignment is currently hidden. The administrator will reveal it once the competition begins.
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-yellow-500/10 text-yellow-500 rounded-full text-sm font-semibold mt-4">
            Status: Waiting for Reveal
          </div>
        </div>
      </div>
    );
  }

  // Fetch teams in this assignment
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .in('id', assignment.team_ids);

  const totalTeams = assignment.team_ids.length;
  const currentIndex = assignment.current_team_index;
  const isCompleted = currentIndex >= totalTeams;

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold font-outfit tracking-tight">Active Assignment</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Review your assigned projects sequentially.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Main Status Card */}
          <div className="glass-card p-6 sm:p-8 rounded-[1.5rem] sm:rounded-3xl border border-border bg-card/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform hidden sm:block">
              <Trophy className="w-24 h-24 text-primary" />
            </div>
            
            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] sm:text-xs font-bold font-outfit tracking-wider uppercase">
                {isCompleted ? 'COMPLETED' : assignment.started ? 'IN PROGRESS' : 'READY TO START'}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl sm:text-4xl font-bold font-outfit leading-tight">Judging Slot Assignment</h3>
                <p className="text-sm sm:text-lg text-muted-foreground">
                  {totalTeams} Projects to be evaluated.
                </p>
              </div>

              <div className="pt-4 flex items-center gap-4">
                {isCompleted ? (
                  <div className="flex items-center gap-2 text-green-500 font-bold">
                    <CheckCircle2 className="w-6 h-6" />
                    Judging Finished
                  </div>
                ) : (
                  <Link 
                    href={`/judge/review/${assignment.id}`}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-primary/20"
                  >
                    {assignment.started ? 'Continue' : 'Start Now'}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="glass-card p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-border bg-card/30">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">Overall Progress</span>
              <span className="text-sm sm:text-base font-bold font-outfit">{Math.min(currentIndex, totalTeams)} / {totalTeams} Teams</span>
            </div>
            <div className="w-full bg-muted h-2 sm:h-3 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500 ease-out" 
                style={{ width: `${(Math.min(currentIndex, totalTeams) / totalTeams) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-border bg-card/30 space-y-4">
            <h4 className="font-bold font-outfit flex items-center gap-2 text-sm sm:text-base">
              <AlertCircle className="w-4 h-4 text-primary" />
              Judging Rules
            </h4>
            <ul className="text-xs sm:text-sm space-y-3 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                Sequential review only
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                No backtracking allowed
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                Submissions are locked
              </li>
            </ul>
          </div>

          <div className="glass-card p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-border bg-card/30 space-y-4">
            <h4 className="font-bold font-outfit text-sm sm:text-base">Your Panel</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
                P
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-semibold">Joint Panel</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">Reviewing concurrently</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
