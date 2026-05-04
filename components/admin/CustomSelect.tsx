'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search, User } from 'lucide-react';

interface Option {
  id: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: React.ReactNode;
}

export default function CustomSelect({ options, value, onChange, placeholder, icon }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id === value);
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between pl-12 pr-4 py-4 bg-muted/30 border rounded-[1.25rem] transition-all text-left ${
          isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
        }`}
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon || <User className="w-5 h-5" />}
        </div>
        
        <span className={`font-medium truncate ${!selectedOption ? 'text-muted-foreground' : 'text-foreground'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[100] mt-2 w-full bg-card border border-border rounded-[1.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="p-3 border-b border-border bg-muted/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          
          <div className="max-h-[250px] overflow-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all text-left ${
                    opt.disabled 
                      ? 'opacity-30 cursor-not-allowed bg-muted/10' 
                      : 'hover:bg-primary/10 text-foreground'
                  } ${value === opt.id ? 'bg-primary/5 text-primary font-bold' : ''}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.id && <Check className="w-4 h-4" />}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
