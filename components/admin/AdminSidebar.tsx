'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  ClipboardList, 
  LogOut,
  ShieldCheck,
  Menu,
  TrendingUp,
  Settings,
  X
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { logoutAction } from '@/app/login/actions';

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    await logoutAction();
    router.push('/login');
  };

  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: '/admin/judges', label: 'Judges', icon: <Users className="w-5 h-5" /> },
    { href: '/admin/teams', label: 'Teams', icon: <Trophy className="w-5 h-5" /> },
    { href: '/admin/criteria', label: 'Features', icon: <Settings className="w-5 h-5" /> },
    { href: '/admin/assignments', label: 'Assignments', icon: <ClipboardList className="w-5 h-5" /> },
    { href: '/admin/results', label: 'Results', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 hover:bg-muted rounded-lg fixed top-3 left-4 z-40"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col transition-transform duration-300 md:translate-x-0 md:static
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl font-outfit">JudgeIt</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-2 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                pathname === link.href 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <div className={`${pathname === link.href ? 'text-primary-foreground' : 'group-hover:text-primary'} transition-colors`}>
                {link.icon}
              </div>
              <span className="font-medium">{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
