'use client';

import { useState, useEffect } from 'react';
import {
  Trophy,
  Plus,
  Search,
  MoreVertical,
  BookOpen,
  Calendar,
  Layers,
  Loader2,
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import Modal from '@/components/Modal';
import ActionMenu from '@/components/admin/ActionMenu';
import { createTeamAction, bulkCreateTeamsAction, getTeamsAction, deleteTeamAction, updateTeamAction } from './actions';

interface Team {
  id: string;
  team_name: string;
  project_title: string;
  description: string;
  slot_number: number;
  created_at: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    try {
      const result = await getTeamsAction();
      if (result.success) {
        setTeams(result.data || []);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error fetching teams:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredTeams = teams.filter(team =>
    team.team_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.project_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenEdit = (team: Team) => {
    setEditingTeam(team);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingTeam(null);
    setIsModalOpen(true);
  };

  async function handleSaveTeam(formData: FormData) {
    setIsSubmitting(true);
    setFormError(null);

    const teamName = formData.get('teamName') as string;
    const projectTitle = formData.get('projectTitle') as string;
    const description = formData.get('description') as string;
    const slotNumber = formData.get('slotNumber') as string;

    let result;
    if (editingTeam) {
      result = await updateTeamAction(editingTeam.id, teamName, projectTitle, description, slotNumber);
    } else {
      result = await createTeamAction(formData);
    }

    if (result.success) {
      setIsModalOpen(false);
      setEditingTeam(null);
      fetchTeams();
    } else {
      setFormError(result.error || 'Failed to save team');
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
        // Skip header if it exists
        const startIdx = lines[0].toLowerCase().includes('slot') ? 1 : 0;

        const teamsToInsert = lines.slice(startIdx).map((line, index) => {
          // Robust regex to split CSV while respecting quotes
          const regex = /(?!\s*$)\s*(?:"([^"]*)"|([^,]*))\s*(?:,|$)/g;
          const parts: string[] = [];
          let match;
          while ((match = regex.exec(line)) !== null) {
            parts.push(match[1] || match[2] || "");
          }

          if (parts.length < 3) return null;

          const [slot_number, team_name, project_title] = parts;
          if (!slot_number || !team_name || !project_title) {
            throw new Error(`Line ${index + 1 + startIdx} is invalid. Format: Slot No, Student Names, Project Name`);
          }
          return {
            slot_number,
            team_name,
            project_title,
            description: ''
          };
        }).filter(t => t !== null);

        const result = await bulkCreateTeamsAction(teamsToInsert);

        if (result.success) {
          setIsImportModalOpen(false);
          fetchTeams();
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
    const csvContent = "data:text/csv;charset=utf-8,SLOT NO.,STUDENT NAMES (USN),PROJECT NAME\nF01,John Doe (1JS21CS001),AI Smart Home\nS12,Jane Smith (1JS21CS002),Eco Tracker";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "teams_template.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-outfit tracking-tight">Teams</h1>
          <p className="text-muted-foreground">Register and manage competition projects.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 bg-muted hover:bg-border text-foreground font-semibold rounded-xl transition-all active:scale-95 border border-border"
          >
            <Upload className="w-5 h-5" />
            Import CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Register Team
          </button>
        </div>
      </div>

      {/* Manual Registration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTeam(null); }}
        title={editingTeam ? "Edit Team Details" : "Register Team"}
      >
        <form action={handleSaveTeam} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Team Name</label>
            <input name="teamName" required defaultValue={editingTeam?.team_name || ''} placeholder="e.g. Team Alpha" className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Project Title</label>
            <input name="projectTitle" required defaultValue={editingTeam?.project_title || ''} placeholder="e.g. AI Smart Home" className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <textarea name="description" defaultValue={editingTeam?.description || ''} placeholder="Short project summary..." className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all min-h-[100px]" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Slot Number</label>
            <input
              name="slotNumber"
              type="text"
              required
              defaultValue={editingTeam?.slot_number || ''}
              pattern="^[FST]\d{2}$"
              placeholder="e.g. F01, S12, T05"
              title="Must start with F, S, or T followed by 2 digits (e.g. F01)"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all uppercase"
            />
            <p className="text-[10px] text-muted-foreground ml-1 italic">Format: F/S/T + 2 digits (e.g. F05)</p>
          </div>

          {formError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {formError}
            </div>
          )}

          <div className="pt-4">
            <button type="submit" disabled={isSubmitting} className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingTeam ? "Save Changes" : "Register Team")}
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Bulk Import Teams"
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
              Format: <code className="text-primary font-bold">SLOT NO., STUDENT NAMES (USN), PROJECT NAME</code>
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

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by team or project name..."
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
            <p className="text-muted-foreground animate-pulse">Loading teams...</p>
          </div>
        ) : filteredTeams.length > 0 ? (
          <div className="overflow-x-auto rounded-[2rem] pb-24">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 font-semibold text-sm uppercase tracking-wider">Project / Team</th>
                  <th className="px-6 py-4 font-semibold text-sm uppercase tracking-wider text-center">Slot</th>
                  <th className="px-6 py-4 font-semibold text-sm uppercase tracking-wider text-right">Created</th>
                  <th className="px-6 py-4 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-lg truncate">{team.project_title}</span>
                          <span className="text-sm font-medium text-primary uppercase tracking-tight">{team.team_name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <span className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-black font-mono text-primary uppercase tracking-widest">
                          {team.slot_number || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-muted-foreground">
                      <div className="flex items-center justify-end gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(team.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu 
                        onEdit={() => handleOpenEdit(team)}
                        onDelete={async () => { await deleteTeamAction(team.id); fetchTeams(); }} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">No teams found</p>
              <p className="text-muted-foreground">Start by registering your first competition team.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
