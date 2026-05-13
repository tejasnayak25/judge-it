'use client';

import { useState } from 'react';
import { adminDb } from '@/lib/firebase-admin';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { syncJudgesAction } from '../actions';

export default function RestorePage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const passwordMap: Record<string, string> = {
    "soumya@judge.com": "sjb123",
    "bharti@judge.com": "bp123",
    "raghavendra@judge.com": "rgs123",
    "soundharya@judge.com": "rs123",
    "vighnesh@judge.com": "vs123",
    "balachandra@judge.com": "brj123",
    "rajesh@judge.com": "rn123",
    "mamatha@judge.com": "mi123",
    "ganesh@judge.com": "gss123",
    "puneeth@judge.com": "pb123",
    "jayalakshmi@judge.com": "jkp123",
    "akshatha@judge.com": "arl123",
    "bharath@judge.com": "bb123",
    "udaya@judge.com": "up123",
    "ravindra@judge.com": "rhj123",
    "ravi@judge.com": "rpk123"
  };

  async function handleRestore() {
    setStatus('loading');
    try {
      // We'll use a server action for the actual DB work
      const res = await fetch('/api/admin/restore-passwords', {
        method: 'POST',
        body: JSON.stringify({ passwordMap }),
      });
      
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        // After restoring DB, run the sync automatically
        await syncJudgesAction();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full glass-card p-10 rounded-[2.5rem] border border-border bg-card/50 shadow-2xl text-center space-y-8">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
          <RefreshCw className={`w-10 h-10 text-primary ${status === 'loading' ? 'animate-spin' : ''}`} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-outfit">System Recovery</h1>
          <p className="text-muted-foreground">This will restore the missing passwords for all 16 judges and repair their login accounts.</p>
        </div>

        {status === 'idle' && (
          <button
            onClick={handleRestore}
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
          >
            Start Restoration
          </button>
        )}

        {status === 'success' && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <p className="text-sm font-semibold">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive flex items-center gap-3">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <p className="text-sm font-semibold">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <p className="text-xs text-muted-foreground">
            You can now close this page. The judges can log in!
          </p>
        )}
      </div>
    </div>
  );
}
