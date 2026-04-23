// apps/web/src/app/(dashboard)/companies/[id]/settings/components.tsx
'use client';

import { motion } from 'framer-motion';
import { Check, Plus, X, Trash2 } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface ContentPillar {
  id: string;
  name: string;
  topics: string[];
  contentTypes: string[];
  frequencyWeight: number;
  isActive: boolean;
}

// ============================================
// SELECTION CARD (Consistent with Generate Page)
// ============================================

interface SelectionCardProps {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SelectionCard({
  selected,
  onClick,
  disabled,
  children,
  className = '',
  size = 'md',
}: SelectionCardProps) {
  const sizeClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-5 py-4',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        relative rounded-xl border-2 transition-all duration-200 text-left
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
        ${sizeClasses[size]}
        ${disabled
          ? 'opacity-50 cursor-not-allowed border-border/40 bg-muted/20'
          : selected
            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]'
            : 'border-border/60 hover:border-border hover:bg-secondary/30 hover:scale-[1.01]'
        }
        ${className}
      `}
    >
      {selected && !disabled && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-primary text-primary-foreground shadow-md"
        >
          <Check size={10} strokeWidth={3} />
        </motion.div>
      )}
      {children}
    </button>
  );
}

// ============================================
// TOGGLE SWITCH
// ============================================

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function ToggleSwitch({
  enabled,
  onChange,
  label,
  description,
  disabled,
}: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/40">
      <div className="flex-1">
        <p className="text-sm font-semibold">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
          ${enabled ? 'bg-primary' : 'bg-secondary'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform
            ${enabled ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
}

// ============================================
// MULTI-SELECT CHIPS (for days, personality traits, etc.)
// ============================================

interface MultiSelectChipsProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
  columns?: number;
}

export function MultiSelectChips({
  options,
  selected,
  onChange,
  label,
  columns = 4,
}: MultiSelectChipsProps) {
  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-3">{label}</label>
      )}
      <div className={`grid grid-cols-2 md:grid-cols-${columns} gap-2`}>
        {options.map((option) => (
          <SelectionCard
            key={option.value}
            selected={selected.includes(option.value)}
            onClick={() => toggleOption(option.value)}
            size="sm"
          >
            <span className="text-sm font-medium">{option.label}</span>
          </SelectionCard>
        ))}
      </div>
    </div>
  );
}

// ============================================
// TAG INPUT (for USPs, topics, etc.)
// ============================================

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({
  tags,
  onChange,
  label,
  placeholder = 'Type and press Enter...',
  maxTags = 10,
}: TagInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value && !tags.includes(value) && tags.length < maxTags) {
        onChange([...tags, value]);
        e.currentTarget.value = '';
      }
    }
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-2">{label}</label>
      )}
      <div className="flex flex-wrap gap-2 p-3 rounded-xl border-2 border-border/60 bg-background min-h-[48px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="p-0.5 rounded hover:bg-primary/20 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {tags.length < maxTags && (
          <input
            type="text"
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">
        {tags.length}/{maxTags} tags • Press Enter to add
      </p>
    </div>
  );
}

// ============================================
// CONTENT PILLAR CARD
// ============================================

interface PillarCardProps {
  pillar: ContentPillar;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

export function PillarCard({
  pillar,
  onEdit,
  onDelete,
  onToggleActive,
}: PillarCardProps) {
  return (
    <div
      className={`
        p-4 rounded-xl border-2 transition-all
        ${pillar.isActive
          ? 'border-primary/30 bg-primary/5'
          : 'border-border/40 bg-secondary/20 opacity-60'
        }
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold">{pillar.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pillar.topics.length} topics • {pillar.contentTypes.length} content types
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleActive}
            className={`
              p-1.5 rounded-lg transition-colors
              ${pillar.isActive
                ? 'text-primary hover:bg-primary/10'
                : 'text-muted-foreground hover:bg-secondary'
              }
            `}
            title={pillar.isActive ? 'Deactivate' : 'Activate'}
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Edit"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {pillar.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {pillar.topics.slice(0, 4).map((topic) => (
            <span
              key={topic}
              className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-medium"
            >
              {topic}
            </span>
          ))}
          {pillar.topics.length > 4 && (
            <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-medium text-muted-foreground">
              +{pillar.topics.length - 4} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// SECTION CARD
// ============================================

interface SectionCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  icon,
  children,
  className = '',
}: SectionCardProps) {
  return (
    <div className={`rounded-xl border-2 border-border/60 bg-card overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-border/40 bg-secondary/30">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 rounded-lg bg-primary/10">
              {icon}
            </div>
          )}
          <div>
            <h3 className="font-semibold">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ============================================
// SLIDER INPUT (for posts per week, etc.)
// ============================================

interface SliderInputProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  suffix?: string;
}

export function SliderInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  suffix = '',
}: SliderInputProps) {
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium">{label}</label>
          <span className="text-lg font-bold text-primary">
            {value}{suffix}
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  );
}