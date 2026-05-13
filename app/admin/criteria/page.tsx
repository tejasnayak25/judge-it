'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Modal from '@/components/Modal';
import { createCriterionAction, deleteCriterionAction, getCriteriaAction } from './actions';

interface Criterion {
  id: string;
  name?: string;
  label?: string;
}

export default function CriteriaPage() {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    fetchCriteria();
  }, []);

  async function fetchCriteria() {
    try {
      const result = await getCriteriaAction();

      if (result.success) {
        setCriteria((result.data as any) || []);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('❌ [Server] Fetch error:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCriterion() {
    if (!newLabel) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await createCriterionAction(newLabel);

      if (result.success) {
        setNewLabel('');
        setIsModalOpen(false);
        fetchCriteria();
      } else {
        console.error('Feature creation failed:', result.error);
        setFormError(result.error || 'Failed to create feature');
      }
    } catch (error: any) {
      console.error('Feature creation exception:', error);
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure? This might affect existing results.')) return;

    try {
      const result = await deleteCriterionAction(id);
      if (result.success) {
        fetchCriteria();
      } else {
        alert(result.error || 'Failed to delete feature');
      }
    } catch (error: any) {
      alert(error.message);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-outfit tracking-tight">Judging Criteria</h1>
          <p className="text-muted-foreground">Manage the features judges will evaluate (Max 10 recommended).</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Add Feature
        </button>
      </div>

      <div className="glass-card rounded-3xl border border-border bg-card/30 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Syncing features...</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {criteria.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-2xl group hover:bg-muted/50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                  <span className="font-bold text-lg">{item.label}</span>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}

            {criteria.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No features added yet.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex gap-3">
        <AlertCircle className="w-5 h-5 text-primary shrink-0" />
        <p className="text-sm text-primary/80 leading-relaxed">
          <strong>Note:</strong> Changes to features will apply to all future reviews.
        </p>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Judging Feature"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Feature Label</label>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              required
              placeholder="e.g. Code Quality"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>

          {formError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive font-medium">
              {formError}
            </div>
          )}

          <div className="pt-4">
            <button
              onClick={handleAddCriterion}
              disabled={isSubmitting || !newLabel}
              className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Feature"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
