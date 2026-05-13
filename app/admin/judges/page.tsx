'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  Mail, 
  Shield, 
  Calendar,
  Loader2,
  AlertCircle,
  Upload,
  FileText,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import Modal from '@/components/Modal';
import ActionMenu from '@/components/admin/ActionMenu';
import { createJudgeAction, getJudgesAction, deleteJudgeAction, bulkCreateJudgesAction, syncJudgesAction } from './actions';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function JudgesPage() {
  const [judges, setJudges] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchJudges();
  }, []);

  async function fetchJudges() {
    try {
      const result = await getJudgesAction();
      if (result.success) {
        setJudges(result.data || []);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error fetching judges:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredJudges = judges.filter(judge => 
    judge.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleAddJudge(formData: FormData) {
    setIsSubmitting(true);
    setFormError(null);
    
    const result = await createJudgeAction(formData);
    
    if (result.success) {
      setIsModalOpen(false);
      fetchJudges();
    } else {
      setFormError(result.error || 'Failed to create judge account');
    }
    setIsSubmitting(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    setFormError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) return;

        const lines = content.trim().split('\n');
        const startIdx = lines[0].toLowerCase().includes('name') ? 1 : 0;

        const judgesToInsert = lines.slice(startIdx).map((line, index) => {
          const regex = /(?!\s*$)\s*(?:"([^"]*)"|([^,]*))\s*(?:,|$)/g;
          const parts: string[] = [];
          let match;
          while ((match = regex.exec(line)) !== null) {
            parts.push(match[1] || match[2] || "");
          }

          if (parts.length < 3) return null;

          const [full_name, email, password] = parts;
          if (!full_name || !email || !password) {
            throw new Error(`Line ${index + 1 + startIdx} is invalid. Format: Judge Name, Email, Password`);
          }
          return { full_name, email, password };
        }).filter(j => j !== null);

        const result = await bulkCreateJudgesAction(judgesToInsert);

        if (result.success) {
          setIsImportModalOpen(false);
          fetchJudges();
        } else {
          setFormError(result.error || 'Bulk import failed');
        }
      } catch (error: any) {
        setFormError(error.message);
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsText(file);
  }

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,JUDGE NAME,EMAIL,PASSWORD\nDr. Smith,smith@example.com,JudgePassword123\nProf. Brown,brown@example.com,SecurePass456";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "judges_template.csv");
    document.body.appendChild(link);
    link.click();
  };

  async function handleSync() {
    setIsSubmitting(true);
    const res = await syncJudgesAction();
    if (res.success) {
      alert(res.message);
      fetchJudges();
    } else {
      setFormError(res.error || 'Sync failed');
    }
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-outfit tracking-tight">Judges</h1>
          <p className="text-muted-foreground">Manage and register competition judges.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-3 bg-muted hover:bg-border text-foreground font-semibold rounded-xl transition-all active:scale-95 border border-border"
          >
            <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
            Sync Accounts
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-muted hover:bg-border text-foreground font-semibold rounded-xl transition-all active:scale-95 border border-border"
          >
            <Upload className="w-5 h-5" />
            Import CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Register Judge
          </button>
        </div>
      </div>

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Bulk Import Judges"
      >
        <div className="space-y-6">
          <div className="p-10 border-2 border-dashed border-border rounded-[2rem] bg-muted/30 flex flex-col items-center justify-center gap-4 text-center group hover:border-primary/50 transition-all relative overflow-hidden">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
              {isSubmitting ? <Loader2 className="w-10 h-10 animate-spin" /> : <Upload className="w-10 h-10" />}
            </div>
            <div className="space-y-1">
              <p className="font-bold text-lg">Upload CSV File</p>
              <p className="text-sm text-muted-foreground">Drag and drop or click to browse</p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isSubmitting}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>

          <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                CSV Format Required
              </h4>
              <button 
                onClick={downloadTemplate}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2 py-1 rounded"
              >
                <ExternalLink className="w-3 h-3" />
                Download Template
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Format: <code className="text-primary font-bold">JUDGE NAME, EMAIL, PASSWORD</code>
            </p>
          </div>

          {formError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {formError}
            </div>
          )}
        </div>
      </Modal>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Register New Judge"
      >
        <form action={handleAddJudge} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Full Name</label>
            <input name="fullName" required placeholder="e.g. John Doe" className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Email Address</label>
            <input name="email" type="email" required placeholder="judge@example.com" className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Password</label>
            <input name="password" type="password" required placeholder="••••••••" minLength={6} className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" />
          </div>

          {formError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {formError}
            </div>
          )}

          <div className="pt-4">
            <button type="submit" disabled={isSubmitting} className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
            </button>
          </div>
        </form>
      </Modal>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search by name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card/50 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      <div className="glass-card rounded-3xl border border-border bg-card/30">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Fetching judges...</p>
          </div>
        ) : filteredJudges.length > 0 ? (
          <div className="overflow-x-auto overflow-hidden rounded-[2rem]">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 font-semibold text-sm uppercase tracking-wider">Judge Name</th>
                  <th className="px-6 py-4 font-semibold text-sm uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 font-semibold text-sm uppercase tracking-wider">Registered</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredJudges.map((judge) => (
                  <tr key={judge.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {judge.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold">{judge.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold border border-blue-500/20 uppercase">
                        {judge.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(judge.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu onDelete={async () => { await deleteJudgeAction(judge.id); fetchJudges(); }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold">No judges found</p>
          </div>
        )}
      </div>
    </div>
  );
}
