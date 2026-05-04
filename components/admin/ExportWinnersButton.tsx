'use client';

import { useState } from 'react';
import { FileText, Loader2, Download } from 'lucide-react';
import { exportWinnersAction } from '@/app/admin/results/actions';

export default function ExportWinnersButton({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await exportWinnersAction();
      if (res.success && res.data) {
        // Convert base64 to blob
        const byteCharacters = atob(res.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        
        // Trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Competition_Winners_${new Date().toISOString().split('T')[0]}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert(res.error || 'Failed to export winners');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('An unexpected error occurred during export');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'compact') {
    return (
      <button 
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-yellow-500/20 text-sm"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        Export Winners (.docx)
      </button>
    );
  }

  return (
    <button 
      onClick={handleExport}
      disabled={loading}
      className="w-full py-4 px-5 bg-gradient-to-br from-yellow-500 to-amber-600 text-black font-black rounded-2xl shadow-xl shadow-yellow-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-between group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-6 h-6" />}
        </div>
        <div className="text-left">
          <p className="text-sm font-black uppercase tracking-tight">Export Winner Sheet</p>
          <p className="text-[10px] font-bold opacity-70">TOP 6 TEAMS (.DOCX)</p>
        </div>
      </div>
      <Download className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
    </button>
  );
}
