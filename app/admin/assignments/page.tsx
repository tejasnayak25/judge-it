'use client';

import { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  MoreVertical, 
  Eye, 
  EyeOff,
  User,
  Users,
  Trophy,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import Modal from '@/components/Modal';
import ActionMenu from '@/components/admin/ActionMenu';
import CustomSelect from '@/components/admin/CustomSelect';
import { getAssignmentsAction, createAssignmentAction, toggleAssignmentRevealAction, deleteAssignmentAction } from './actions';
import { getJudgesAction } from '../judges/actions';
import { getTeamsAction } from '../teams/actions';

interface Assignment {
  id: string;
  judge_ids: string[];
  team_ids: string[];
  revealed: boolean;
  started: boolean;
  current_team_index: number;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

interface Team {
  id: string;
  team_name: string;
  project_title: string;
  slot_number: string;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [judges, setJudges] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  
  // Selection state
  const [selectedJudge1, setSelectedJudge1] = useState('');
  const [selectedJudge2, setSelectedJudge2] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [filterPrefix, setFilterPrefix] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [assignmentsRes, judgesRes, teamsRes] = await Promise.all([
        getAssignmentsAction(),
        getJudgesAction(),
        getTeamsAction()
      ]);

      if (assignmentsRes.success) setAssignments(assignmentsRes.data as Assignment[] || []);
      if (judgesRes.success) setJudges(judgesRes.data || []);
      if (teamsRes.success) setTeams(teamsRes.data || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingAssignment(null);
    resetForm();
    setIsModalOpen(true);
  }

  function handleOpenEdit(assignment: Assignment) {
    setEditingAssignment(assignment);
    setSelectedJudge1(assignment.judge_ids[0] || '');
    setSelectedJudge2(assignment.judge_ids[1] || '');
    setSelectedTeams(assignment.team_ids || []);
    setFormError(null);
    setIsModalOpen(true);
  }

  async function handleSaveAssignment() {
    if (!selectedJudge1 || !selectedJudge2) {
      setFormError('Please select both judges.');
      return;
    }
    if (selectedJudge1 === selectedJudge2) {
      setFormError('Judge 1 and Judge 2 must be different people.');
      return;
    }
    if (selectedTeams.length === 0) {
      setFormError('Please select at least one team.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      let result;
      if (editingAssignment) {
        // Edit existing (logic in actions can handle updates)
        result = await createAssignmentAction([selectedJudge1, selectedJudge2], selectedTeams, editingAssignment.id);
      } else {
        result = await createAssignmentAction([selectedJudge1, selectedJudge2], selectedTeams);
      }

      if (result.success) {
        setIsModalOpen(false);
        resetForm();
        fetchData();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setSelectedJudge1('');
    setSelectedJudge2('');
    setSelectedTeams([]);
    setFormError(null);
    setEditingAssignment(null);
  }

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId) 
        : [...prev, teamId]
    );
  };

  async function toggleReveal(assignmentId: string, currentStatus: boolean) {
    try {
      const result = await toggleAssignmentRevealAction(assignmentId, currentStatus);
      if (result.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Error toggling reveal:', error);
    }
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-outfit tracking-tight">Judging Slots</h1>
          <p className="text-muted-foreground">Orchestrate the competition by pairing judges with team batches.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center justify-center w-full md:w-auto gap-2 px-6 py-3.5 bg-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Create New Slot
        </button>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingAssignment ? "Edit Judging Slot" : "Configure Judging Slot"}
      >
        <div className="space-y-8 max-h-[80vh] overflow-auto pr-2 custom-scrollbar p-1">
          {/* Judge Selection Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <Users className="w-4 h-4" />
              1. Assign Judges
            </h4>
            
            {judges.length < 2 ? (
              <div className="p-6 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl flex flex-col items-center text-center gap-2">
                <AlertCircle className="w-8 h-8 text-yellow-500 opacity-50" />
                <p className="text-sm font-medium text-yellow-600">At least 2 judges are required to create an assignment.</p>
                <p className="text-xs text-muted-foreground">Please register more judges first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Judge One</label>
                  <CustomSelect 
                    options={judges.map(j => ({ 
                      id: j.id, 
                      label: j.full_name, 
                      disabled: j.id === selectedJudge2 
                    }))}
                    value={selectedJudge1}
                    onChange={setSelectedJudge1}
                    placeholder="Select First Judge"
                    icon={<User className="w-5 h-5" />}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Judge Two</label>
                  <CustomSelect 
                    options={judges.map(j => ({ 
                      id: j.id, 
                      label: j.full_name, 
                      disabled: j.id === selectedJudge1 
                    }))}
                    value={selectedJudge2}
                    onChange={setSelectedJudge2}
                    placeholder="Select Second Judge"
                    icon={<UserCheck className="w-5 h-5" />}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Team Selection Section */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h4 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  2. Select 10 Teams
                </h4>
                <span className={`px-3 py-1 rounded-full text-xs font-black shrink-0 ${selectedTeams.length === 10 ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'}`}>
                  {selectedTeams.length} / 10
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/30 rounded-2xl border border-border">
                <div className="flex gap-1 border-r border-border pr-2 mr-1">
                  {['F', 'S', 'T'].map(pref => (
                    <button
                      key={pref}
                      onClick={() => setFilterPrefix(pref)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${filterPrefix === pref ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-muted text-muted-foreground'}`}
                    >
                      {pref}
                    </button>
                  ))}
                  <button
                    onClick={() => setFilterPrefix('')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${filterPrefix === '' ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-muted text-muted-foreground'}`}
                  >
                    ALL
                  </button>
                </div>
                
                <div className="flex-1 min-w-[200px]">
                  <CustomSelect 
                    options={Array.from(new Set(teams.map(t => t.slot_number).filter(s => !filterPrefix || s.startsWith(filterPrefix))))
                      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
                      .map(slot => ({ id: slot, label: `Slot ${slot}` }))
                    }
                    value=""
                    onChange={(slot) => {
                      const teamsInSlot = teams.filter(t => t.slot_number === slot).map(t => t.id);
                      setSelectedTeams(teamsInSlot);
                      setFormError(null);
                    }}
                    placeholder={`Select ${filterPrefix || ''} Slot...`}
                    icon={<ClipboardList className="w-4 h-4" />}
                  />
                </div>
              </div>
            </div>

            {teams.length === 0 ? (
              <div className="p-12 border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center gap-3 text-center">
                <Trophy className="w-10 h-10 text-muted-foreground opacity-20" />
                <p className="text-sm font-medium text-muted-foreground">No teams available to assign.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 p-4 bg-muted/20 rounded-3xl border border-border overflow-y-auto max-h-[400px] custom-scrollbar">
                {teams
                  .filter(t => !filterPrefix || t.slot_number.startsWith(filterPrefix))
                  .map(team => (
                  <div 
                    key={team.id}
                    onClick={() => toggleTeamSelection(team.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${
                      selectedTeams.includes(team.id)
                        ? 'bg-primary/10 border-primary shadow-inner'
                        : 'bg-card/50 border-transparent hover:border-border hover:bg-card'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                      selectedTeams.includes(team.id) ? 'bg-primary border-primary' : 'border-muted-foreground/30 group-hover:border-primary/50'
                    }`}>
                      {selectedTeams.includes(team.id) && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-4 min-w-0">
                      <div className="flex flex-col min-w-0">
                        <span className={`font-bold transition-colors truncate ${selectedTeams.includes(team.id) ? 'text-primary' : ''}`}>
                          {team.project_title}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider truncate">{team.team_name}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black font-mono border ${
                        selectedTeams.includes(team.id) ? 'bg-primary/20 border-primary text-primary' : 'bg-muted border-border text-muted-foreground'
                      }`}>
                        {team.slot_number}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formError && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-sm text-destructive font-bold animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {formError}
            </div>
          )}

          <div className="pt-2">
            <button 
              onClick={handleSaveAssignment}
              disabled={isSubmitting || selectedTeams.length === 0 || !selectedJudge1 || !selectedJudge2}
              className="w-full py-5 px-6 bg-primary text-primary-foreground font-black rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 text-lg uppercase tracking-wider"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : selectedTeams.length === 0 ? (
                <>Select Teams</>
              ) : !selectedJudge1 || !selectedJudge2 ? (
                <>Assign Both Judges</>
              ) : editingAssignment ? (
                <>
                  Update Batch ({selectedTeams.length})
                  <CheckCircle2 className="w-6 h-6" />
                </>
              ) : (
                <>
                  Finalize Batch ({selectedTeams.length})
                  <ShieldCheck className="w-6 h-6" />
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase font-bold tracking-tighter opacity-50">
              Note: Assignments are hidden by default. Reveal them using the visibility toggle in the list.
            </p>
          </div>
        </div>
      </Modal>

      {/* Main List */}
      <div className="glass-card rounded-[2.5rem] border border-border bg-card/30 shadow-2xl">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium animate-pulse">Syncing judging slots...</p>
          </div>
        ) : assignments.length > 0 ? (
          <div className="overflow-x-auto rounded-[2rem] pb-24">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-8 py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Panel Members</th>
                  <th className="px-8 py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Allocation</th>
                  <th className="px-8 py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Exposure</th>
                  <th className="px-8 py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Judging Status</th>
                  <th className="px-8 py-5 w-20"></th>
                </tr>
              </thead>
            <tbody className="divide-y divide-border">
              {assignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      {assignment.judge_ids.map((jid, i) => {
                        const judge = judges.find(j => j.id === jid);
                        return (
                          <div key={jid} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-inner ${i === 0 ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'}`}>
                              {judge?.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-sm">{judge?.full_name || 'Loading...'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-xl w-fit border border-border">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="font-black text-sm">{assignment.team_ids.length} Batched Teams</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <button 
                        onClick={() => toggleReveal(assignment.id, assignment.revealed)}
                        className="flex items-center gap-3 group/toggle"
                      >
                        <div className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex items-center ${
                          assignment.revealed ? 'bg-green-500' : 'bg-muted-foreground/20'
                        }`}>
                          <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 transform ${
                            assignment.revealed ? 'translate-x-6' : 'translate-x-0'
                          }`} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          assignment.revealed ? 'text-green-500' : 'text-muted-foreground'
                        }`}>
                          {assignment.revealed ? 'Public' : 'Hidden'}
                        </span>
                      </button>
                      <p className="text-[9px] text-muted-foreground font-bold opacity-50 uppercase tracking-tighter">
                        {assignment.revealed ? 'Visible to Judges' : 'Admin Only View'}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        assignment.current_team_index >= 10 ? 'bg-green-500' : 
                        assignment.started ? 'bg-blue-500 animate-pulse' : 
                        'bg-muted-foreground/30'
                      }`} />
                      <span className={`text-[10px] font-black tracking-widest uppercase ${
                        assignment.current_team_index >= 10 ? 'text-green-500' : 
                        assignment.started ? 'text-blue-500' : 
                        'text-muted-foreground opacity-50'
                      }`}>
                        {assignment.current_team_index >= 10 ? (
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            COMPLETED
                          </span>
                        ) : assignment.started ? (
                          `PROGRESS: ${assignment.current_team_index + 1} / 10`
                        ) : (
                          'PENDING START'
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <ActionMenu 
                      onEdit={() => handleOpenEdit(assignment)}
                      onDelete={async () => { await deleteAssignmentAction(assignment.id); fetchData(); }} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="p-20 text-center space-y-6">
            <div className="w-24 h-24 bg-muted/50 rounded-[2rem] flex items-center justify-center mx-auto border-2 border-dashed border-border group-hover:border-primary/30 transition-all">
              <ClipboardList className="w-12 h-12 text-muted-foreground opacity-30" />
            </div>
            <div className="space-y-2 max-w-sm mx-auto">
              <h3 className="text-xl font-bold font-outfit">No Active Judging Slots</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Start the competition by creating your first assignment batch. You'll need at least 2 judges and 10 teams.
              </p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all active:scale-95"
            >
              Configure First Slot
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
