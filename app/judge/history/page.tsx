'use client';

import { useState, useEffect } from 'react';
import { 
  History, 
  ChevronRight, 
  Trophy, 
  Calendar,
  CheckCircle2,
  Loader2,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getJudgeHistoryAction } from '../review/actions';

export default function JudgeHistoryPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await getJudgeHistoryAction();
      if (res.success) {
        setReviews(res.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading your history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold font-outfit tracking-tight flex items-center gap-3">
            <History className="w-8 h-8 text-primary" />
            Judging History
          </h1>
          <p className="text-muted-foreground">You have reviewed {reviews.length} teams so far.</p>
        </div>
        <button 
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-muted hover:bg-border text-foreground font-bold rounded-xl transition-all active:scale-95 border border-border"
        >
          <Clock className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {reviews.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-4 rounded-3xl border border-border bg-card/30">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold font-outfit">No Reviews Yet</h3>
            <p className="text-muted-foreground">Start judging teams to see your history here.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reviews.map((review, index) => {
            const totalScore = Object.values(review.scores as Record<string, number>).reduce((a, b) => a + b, 0);
            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-6 rounded-2xl border border-border bg-card/30 hover:bg-card/50 transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Trophy className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold font-outfit text-lg">{review.teams?.project_title}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                          {review.teams?.team_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(review.submitted_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(review.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-8 pt-4 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-xl border border-green-500/20">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Reviewed</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors hidden sm:block" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
