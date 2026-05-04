import Link from 'next/link';
import { 
  Users, 
  Trophy, 
  ClipboardList, 
  CheckCircle2, 
  TrendingUp, 
  Activity,
  ArrowRight,
  FileText,
  Download,
  Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase-server';
import ExportWinnersButton from '@/components/admin/ExportWinnersButton';

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch stats
  const { count: judgesCount } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'judge');

  const { count: teamsCount } = await supabase
    .from('teams')
    .select('*', { count: 'exact', head: true });

  const { count: assignmentsCount } = await supabase
    .from('assignments')
    .select('*', { count: 'exact', head: true });

  const { count: reviewsCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold font-outfit tracking-tight">Dashboard Overview</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Monitor competition progress and manage participants.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          title="Total Judges" 
          value={judgesCount || 0} 
          icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />}
          trend="+2 this week"
        />
        <StatCard 
          title="Total Teams" 
          value={teamsCount || 0} 
          icon={<Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />}
          trend="+5 today"
        />
        <StatCard 
          title="Assignments" 
          value={assignmentsCount || 0} 
          icon={<ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />}
          trend="8 slots filled"
        />
        <StatCard 
          title="Reviews" 
          value={reviewsCount || 0} 
          icon={<CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />}
          trend="24% complete"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Recent Activity or Progress Chart Placeholder */}
        <div className="lg:col-span-2 glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-border bg-card/30">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-outfit">Event Progress</h3>
              <p className="text-xs text-muted-foreground">Real-time judging completion rate</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
              <Activity className="w-4 h-4" />
              LIVE
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="relative pt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Overall Completion</span>
                <span className="text-2xl font-black font-outfit text-primary">
                  {Math.round((reviewsCount || 0) / ((teamsCount || 1) * 2) * 100)}%
                </span>
              </div>
              <div className="w-full bg-muted/50 h-6 rounded-2xl p-1 overflow-hidden border border-border">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(100, (reviewsCount || 0) / ((teamsCount || 1) * 2) * 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-border/50">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Submitted</span>
                <p className="text-xl font-bold font-outfit">{reviewsCount || 0}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Expected</span>
                <p className="text-xl font-bold font-outfit">{(teamsCount || 0) * 2}</p>
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Pending</span>
                <p className="text-xl font-bold font-outfit text-primary">
                  {Math.max(0, (teamsCount || 0) * 2 - (reviewsCount || 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-border bg-card/30 space-y-6">
          <h3 className="text-lg sm:text-xl font-bold font-outfit">Quick Actions</h3>
          <div className="space-y-3 sm:space-y-4">
            <ExportWinnersButton />
            <QuickActionLink href="/admin/judges" label="Register New Judge" />
            <QuickActionLink href="/admin/teams" label="Import Teams CSV" />
            <QuickActionLink href="/admin/assignments" label="Generate Assignments" />
            <QuickActionLink href="/admin/results" label="View Full Results" variant="primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string; value: number | string; icon: React.ReactNode; trend: string }) {
  return (
    <div className="glass-card p-6 rounded-3xl border border-border bg-card/30 hover:bg-card/50 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </div>
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</h4>
        <p className="text-3xl font-bold font-outfit">{value}</p>
      </div>
    </div>
  );
}

function QuickActionLink({ label, href, variant = 'secondary' }: { label: string; href: string; variant?: 'primary' | 'secondary' }) {
  return (
    <Link 
      href={href}
      className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all active:scale-95 flex items-center justify-between group ${
        variant === 'primary' 
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90' 
          : 'bg-muted hover:bg-border text-foreground'
      }`}
    >
      {label}
      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
    </Link>
  );
}
