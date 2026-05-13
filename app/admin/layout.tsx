import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch user profile for UI data
  const profile = await db.getProfile(session.uid) as any;

  if (!profile || profile.role !== 'admin') {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 sm:px-6 bg-card/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-base sm:text-lg font-outfit ml-12 md:ml-0 tracking-tight uppercase">Admin Panel</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-2 text-right">
              <span className="text-sm font-semibold">{profile.full_name}</span>
              <span className="text-[10px] text-muted-foreground capitalize font-bold">{profile.role}</span>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-full bg-gradient-to-tr from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
              {profile.full_name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
