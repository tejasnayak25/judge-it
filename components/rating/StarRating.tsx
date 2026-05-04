'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface StarRatingProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export default function StarRating({ label, value, onChange, disabled }: StarRatingProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
        <span className="text-base sm:text-lg font-bold font-outfit text-primary">{value || 0} / 5</span>
      </div>
      <div className="flex gap-1 sm:gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            whileHover={!disabled ? { scale: 1.15 } : {}}
            whileTap={!disabled ? { scale: 0.9 } : {}}
            onClick={() => !disabled && onChange(star)}
            onMouseEnter={() => !disabled && setHoveredValue(star)}
            onMouseLeave={() => !disabled && setHoveredValue(null)}
            className={`p-1.5 sm:p-1 transition-colors ${
              star <= (hoveredValue ?? value) 
                ? 'text-yellow-500 fill-yellow-500' 
                : 'text-muted border-transparent'
            } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <Star className={`w-7 h-7 sm:w-8 sm:h-8 ${star <= (hoveredValue ?? value) ? 'fill-current' : ''}`} />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
