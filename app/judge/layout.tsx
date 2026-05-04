import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import JudgeSidebar from '@/components/judge/JudgeSidebar';

export default async function JudgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile for UI data
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'judge') {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground antialiased">
      <JudgeSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-lg font-outfit ml-10 md:ml-0">Judge Panel</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2 text-right">
              <span className="text-sm font-semibold">{profile.full_name}</span>
              <span className="text-xs text-muted-foreground capitalize">Project {profile.role}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold">
              {profile.full_name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
