'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Trash2, Edit, Loader2 } from 'lucide-react';

interface ActionMenuProps {
  onDelete?: () => Promise<void>;
  onEdit?: () => void;
}

export default function ActionMenu({ onDelete, onEdit }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this?')) {
      setIsDeleting(true);
      await onDelete?.();
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-48 bg-card border border-border rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          {onEdit && (
            <button 
              onClick={() => { onEdit(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors text-left"
            >
              <Edit className="w-4 h-4" />
              Edit Details
            </button>
          )}
          {onDelete && (
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-destructive/10 text-destructive transition-colors text-left"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Item
            </button>
          )}
        </div>
      )}
    </div>
  );
}
