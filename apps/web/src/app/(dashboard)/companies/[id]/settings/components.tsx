// apps/web/src/app/(dashboard)/companies/[id]/settings/components.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Plus, X, Trash2, Search, ChevronDown } from 'lucide-react';

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

export interface IndustryItem {
  code: string;
  name: string;
  category?: string;
  confidence?: number;
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
        focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2
        ${sizeClasses[size]}
        ${disabled
          ? 'opacity-50 cursor-not-allowed border-[var(--border-default)]/40 bg-[var(--bg-secondary)]/20'
          : selected
            ? 'border-violet-500 bg-violet-500/5 shadow-lg shadow-violet-500/10 scale-[1.02]'
            : 'border-[var(--border-default)]/60 hover:border-[var(--border-default)] hover:bg-[var(--bg-secondary)]/30 hover:scale-[1.01]'
        }
        ${className}
      `}
    >
      {selected && !disabled && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-violet-500 text-white shadow-md"
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
    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)]/30 border border-[var(--border-default)]/40">
      <div className="flex-1">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
        {description && (
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2
          ${enabled ? 'bg-violet-500' : 'bg-[var(--bg-tertiary)]'}
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

  const gridClass = columns === 7 
    ? 'grid-cols-4 sm:grid-cols-7' 
    : columns === 4 
      ? 'grid-cols-2 sm:grid-cols-4' 
      : `grid-cols-2 sm:grid-cols-${columns}`;

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">{label}</label>
      )}
      <div className={`grid ${gridClass} gap-2`}>
        {options.map((option) => (
          <SelectionCard
            key={option.value}
            selected={selected.includes(option.value)}
            onClick={() => toggleOption(option.value)}
            size="sm"
          >
            <span className="text-sm font-medium text-[var(--text-primary)]">{option.label}</span>
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
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">{label}</label>
      )}
      <div className="flex flex-wrap gap-2 p-3 rounded-xl border-2 border-[var(--border-default)]/60 bg-[var(--bg-primary)] min-h-[48px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 text-sm font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="p-0.5 rounded hover:bg-violet-500/20 transition-colors"
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
            className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
          />
        )}
      </div>
      <p className="text-xs text-[var(--text-tertiary)] mt-1.5">
        {tags.length}/{maxTags} tags • Press Enter to add
      </p>
    </div>
  );
}

// ============================================
// INDUSTRY SELECTOR (Multi-select with Search)
// ============================================

// Comprehensive industry list for South African businesses
const INDUSTRY_DATABASE: IndustryItem[] = [
  // Construction & Engineering
  { code: 'CONST_CE', name: 'Civil Engineering', category: 'Construction & Engineering' },
  { code: 'CONST_GB', name: 'General Building', category: 'Construction & Engineering' },
  { code: 'CONST_ME', name: 'Mechanical Engineering', category: 'Construction & Engineering' },
  { code: 'CONST_EE', name: 'Electrical Engineering', category: 'Construction & Engineering' },
  { code: 'CONST_SE', name: 'Structural Engineering', category: 'Construction & Engineering' },
  { code: 'CONST_EP', name: 'Electrical Infrastructure', category: 'Construction & Engineering' },
  { code: 'CONST_SW', name: 'Specialist Works', category: 'Construction & Engineering' },
  { code: 'CONST_PM', name: 'Project Management', category: 'Construction & Engineering' },
  { code: 'CONST_QS', name: 'Quantity Surveying', category: 'Construction & Engineering' },
  { code: 'CONST_ARCH', name: 'Architecture', category: 'Construction & Engineering' },
  { code: 'CONST_STEEL', name: 'Structural Steel Fabrication', category: 'Construction & Engineering' },
  { code: 'CONST_CONC', name: 'Concrete Works', category: 'Construction & Engineering' },
  { code: 'CONST_PIPE', name: 'Pipeline Construction', category: 'Construction & Engineering' },
  { code: 'CONST_ROAD', name: 'Road Construction', category: 'Construction & Engineering' },
  { code: 'CONST_WATER', name: 'Water Infrastructure', category: 'Construction & Engineering' },
  
  // Mining
  { code: 'MINE_GOLD', name: 'Gold Mining', category: 'Mining' },
  { code: 'MINE_COAL', name: 'Coal Mining', category: 'Mining' },
  { code: 'MINE_PLAT', name: 'Platinum Mining', category: 'Mining' },
  { code: 'MINE_DIAM', name: 'Diamond Mining', category: 'Mining' },
  { code: 'MINE_IRON', name: 'Iron Ore Mining', category: 'Mining' },
  { code: 'MINE_MANG', name: 'Manganese Mining', category: 'Mining' },
  { code: 'MINE_CHROME', name: 'Chrome Mining', category: 'Mining' },
  { code: 'MINE_EQUIP', name: 'Mining Equipment & Services', category: 'Mining' },
  { code: 'MINE_SAFE', name: 'Mining Safety & Training', category: 'Mining' },
  { code: 'MINE_CONS', name: 'Mining Consulting', category: 'Mining' },
  { code: 'MINE_CONT', name: 'Mining Contracting', category: 'Mining' },
  { code: 'MINE_PROC', name: 'Mineral Processing', category: 'Mining' },
  { code: 'MINE_EXPL', name: 'Exploration Services', category: 'Mining' },
  
  // Technology
  { code: 'TECH_SOFT', name: 'Software Development', category: 'Technology' },
  { code: 'TECH_IT', name: 'IT Consulting', category: 'Technology' },
  { code: 'TECH_CYBER', name: 'Cybersecurity', category: 'Technology' },
  { code: 'TECH_CLOUD', name: 'Cloud Services', category: 'Technology' },
  { code: 'TECH_AI', name: 'AI & Machine Learning', category: 'Technology' },
  { code: 'TECH_FIN', name: 'Fintech', category: 'Technology' },
  { code: 'TECH_DATA', name: 'Data Analytics', category: 'Technology' },
  { code: 'TECH_IOT', name: 'IoT Solutions', category: 'Technology' },
  { code: 'TECH_WEB', name: 'Web Development', category: 'Technology' },
  { code: 'TECH_MOBILE', name: 'Mobile App Development', category: 'Technology' },
  { code: 'TECH_ECOM', name: 'E-Commerce Solutions', category: 'Technology' },
  { code: 'TECH_ERP', name: 'ERP Implementation', category: 'Technology' },
  
  // Financial Services
  { code: 'FIN_BANK', name: 'Banking', category: 'Financial Services' },
  { code: 'FIN_INS', name: 'Insurance', category: 'Financial Services' },
  { code: 'FIN_INV', name: 'Investment Management', category: 'Financial Services' },
  { code: 'FIN_ACC', name: 'Accounting & Auditing', category: 'Financial Services' },
  { code: 'FIN_TAX', name: 'Tax Advisory', category: 'Financial Services' },
  { code: 'FIN_WEALTH', name: 'Wealth Management', category: 'Financial Services' },
  { code: 'FIN_FOREX', name: 'Foreign Exchange', category: 'Financial Services' },
  { code: 'FIN_MICRO', name: 'Microfinance', category: 'Financial Services' },
  
  // Manufacturing
  { code: 'MFG_AUTO', name: 'Automotive Manufacturing', category: 'Manufacturing' },
  { code: 'MFG_FOOD', name: 'Food & Beverage Processing', category: 'Manufacturing' },
  { code: 'MFG_CHEM', name: 'Chemical Manufacturing', category: 'Manufacturing' },
  { code: 'MFG_PHARMA', name: 'Pharmaceutical Manufacturing', category: 'Manufacturing' },
  { code: 'MFG_TEXT', name: 'Textile Manufacturing', category: 'Manufacturing' },
  { code: 'MFG_METAL', name: 'Metal Fabrication', category: 'Manufacturing' },
  { code: 'MFG_PLASTIC', name: 'Plastics Manufacturing', category: 'Manufacturing' },
  { code: 'MFG_ELECT', name: 'Electronics Manufacturing', category: 'Manufacturing' },
  { code: 'MFG_PACK', name: 'Packaging', category: 'Manufacturing' },
  
  // Energy & Utilities
  { code: 'ENERGY_RENEW', name: 'Renewable Energy', category: 'Energy & Utilities' },
  { code: 'ENERGY_SOLAR', name: 'Solar Energy', category: 'Energy & Utilities' },
  { code: 'ENERGY_WIND', name: 'Wind Energy', category: 'Energy & Utilities' },
  { code: 'ENERGY_OIL', name: 'Oil & Gas', category: 'Energy & Utilities' },
  { code: 'ENERGY_POWER', name: 'Power Generation', category: 'Energy & Utilities' },
  { code: 'ENERGY_WATER', name: 'Water Treatment', category: 'Energy & Utilities' },
  { code: 'ENERGY_WASTE', name: 'Waste Management', category: 'Energy & Utilities' },
  
  // Agriculture
  { code: 'AGRI_FARM', name: 'Farming & Crop Production', category: 'Agriculture' },
  { code: 'AGRI_LIVE', name: 'Livestock', category: 'Agriculture' },
  { code: 'AGRI_PROC', name: 'Agro-Processing', category: 'Agriculture' },
  { code: 'AGRI_EQUIP', name: 'Agricultural Equipment', category: 'Agriculture' },
  { code: 'AGRI_WINE', name: 'Wine Production', category: 'Agriculture' },
  { code: 'AGRI_EXPORT', name: 'Agricultural Exports', category: 'Agriculture' },
  
  // Healthcare
  { code: 'HEALTH_HOSP', name: 'Hospitals & Clinics', category: 'Healthcare' },
  { code: 'HEALTH_PHARM', name: 'Pharmaceuticals', category: 'Healthcare' },
  { code: 'HEALTH_EQUIP', name: 'Medical Equipment', category: 'Healthcare' },
  { code: 'HEALTH_BIO', name: 'Biotechnology', category: 'Healthcare' },
  { code: 'HEALTH_DIAG', name: 'Diagnostics', category: 'Healthcare' },
  { code: 'HEALTH_HOME', name: 'Home Healthcare', category: 'Healthcare' },
  
  // Retail & Consumer
  { code: 'RETAIL_GEN', name: 'General Retail', category: 'Retail & Consumer' },
  { code: 'RETAIL_GROC', name: 'Grocery Retail', category: 'Retail & Consumer' },
  { code: 'RETAIL_FASH', name: 'Fashion Retail', category: 'Retail & Consumer' },
  { code: 'RETAIL_ECOM', name: 'E-Commerce Retail', category: 'Retail & Consumer' },
  { code: 'RETAIL_FMCG', name: 'FMCG', category: 'Retail & Consumer' },
  
  // Transport & Logistics
  { code: 'TRANS_FREIGHT', name: 'Freight & Logistics', category: 'Transport & Logistics' },
  { code: 'TRANS_SHIP', name: 'Shipping', category: 'Transport & Logistics' },
  { code: 'TRANS_AIR', name: 'Air Transport', category: 'Transport & Logistics' },
  { code: 'TRANS_RAIL', name: 'Rail Transport', category: 'Transport & Logistics' },
  { code: 'TRANS_ROAD', name: 'Road Transport', category: 'Transport & Logistics' },
  { code: 'TRANS_WARE', name: 'Warehousing', category: 'Transport & Logistics' },
  { code: 'TRANS_COURIER', name: 'Courier Services', category: 'Transport & Logistics' },
  
  // Professional Services
  { code: 'PROF_LEGAL', name: 'Legal Services', category: 'Professional Services' },
  { code: 'PROF_CONSULT', name: 'Management Consulting', category: 'Professional Services' },
  { code: 'PROF_HR', name: 'HR & Recruitment', category: 'Professional Services' },
  { code: 'PROF_MARKET', name: 'Marketing & Advertising', category: 'Professional Services' },
  { code: 'PROF_PR', name: 'Public Relations', category: 'Professional Services' },
  { code: 'PROF_DESIGN', name: 'Design Services', category: 'Professional Services' },
  { code: 'PROF_TRAIN', name: 'Training & Development', category: 'Professional Services' },
  { code: 'PROF_EVENT', name: 'Event Management', category: 'Professional Services' },
  
  // Real Estate & Property
  { code: 'PROP_DEV', name: 'Property Development', category: 'Real Estate' },
  { code: 'PROP_MGMT', name: 'Property Management', category: 'Real Estate' },
  { code: 'PROP_AGENT', name: 'Real Estate Agency', category: 'Real Estate' },
  { code: 'PROP_COMM', name: 'Commercial Property', category: 'Real Estate' },
  { code: 'PROP_RES', name: 'Residential Property', category: 'Real Estate' },
  
  // Telecommunications
  { code: 'TELE_MOBILE', name: 'Mobile Networks', category: 'Telecommunications' },
  { code: 'TELE_ISP', name: 'Internet Service Providers', category: 'Telecommunications' },
  { code: 'TELE_INFRA', name: 'Telecom Infrastructure', category: 'Telecommunications' },
  { code: 'TELE_SAT', name: 'Satellite Communications', category: 'Telecommunications' },
  
  // Tourism & Hospitality
  { code: 'TOUR_HOTEL', name: 'Hotels & Accommodation', category: 'Tourism & Hospitality' },
  { code: 'TOUR_REST', name: 'Restaurants & Catering', category: 'Tourism & Hospitality' },
  { code: 'TOUR_TRAVEL', name: 'Travel Agencies', category: 'Tourism & Hospitality' },
  { code: 'TOUR_SAFARI', name: 'Safari & Wildlife Tourism', category: 'Tourism & Hospitality' },
  { code: 'TOUR_GAMING', name: 'Gaming & Casinos', category: 'Tourism & Hospitality' },
  
  // Education
  { code: 'EDU_HIGHER', name: 'Higher Education', category: 'Education' },
  { code: 'EDU_SCHOOL', name: 'Schools (K-12)', category: 'Education' },
  { code: 'EDU_VOC', name: 'Vocational Training', category: 'Education' },
  { code: 'EDU_ONLINE', name: 'Online Education', category: 'Education' },
  { code: 'EDU_CORP', name: 'Corporate Training', category: 'Education' },
  
  // Media & Entertainment
  { code: 'MEDIA_BROAD', name: 'Broadcasting', category: 'Media & Entertainment' },
  { code: 'MEDIA_PRINT', name: 'Print Media', category: 'Media & Entertainment' },
  { code: 'MEDIA_DIGITAL', name: 'Digital Media', category: 'Media & Entertainment' },
  { code: 'MEDIA_FILM', name: 'Film Production', category: 'Media & Entertainment' },
  { code: 'MEDIA_GAME', name: 'Gaming & eSports', category: 'Media & Entertainment' },
  
  // Government & Public Sector
  { code: 'GOV_LOCAL', name: 'Local Government', category: 'Government' },
  { code: 'GOV_PROV', name: 'Provincial Government', category: 'Government' },
  { code: 'GOV_NAT', name: 'National Government', category: 'Government' },
  { code: 'GOV_SOE', name: 'State-Owned Enterprises', category: 'Government' },
  { code: 'GOV_NGO', name: 'NGOs & Non-Profits', category: 'Government' },
  
  // Security
  { code: 'SEC_PHYS', name: 'Physical Security', category: 'Security' },
  { code: 'SEC_CYBER', name: 'Cybersecurity Services', category: 'Security' },
  { code: 'SEC_CASH', name: 'Cash-in-Transit', category: 'Security' },
  { code: 'SEC_ELEC', name: 'Electronic Security', category: 'Security' },
  
  // Environmental Services
  { code: 'ENV_CONSULT', name: 'Environmental Consulting', category: 'Environmental' },
  { code: 'ENV_ASSESS', name: 'Environmental Impact Assessment', category: 'Environmental' },
  { code: 'ENV_REMED', name: 'Remediation Services', category: 'Environmental' },
  { code: 'ENV_SUSTAIN', name: 'Sustainability Consulting', category: 'Environmental' },
];

interface IndustrySelectorProps {
  selectedIndustries: IndustryItem[];
  onChange: (industries: IndustryItem[]) => void;
  label?: string;
  maxIndustries?: number;
}

export function IndustrySelector({
  selectedIndustries,
  onChange,
  label,
  maxIndustries = 5,
}: IndustrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customInput, setCustomInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter industries based on search
  const filteredIndustries = INDUSTRY_DATABASE.filter(industry => {
    const searchLower = searchQuery.toLowerCase();
    return (
      industry.name.toLowerCase().includes(searchLower) ||
      industry.category?.toLowerCase().includes(searchLower) ||
      industry.code.toLowerCase().includes(searchLower)
    );
  });

  // Group by category
  const groupedIndustries = filteredIndustries.reduce((acc, industry) => {
    const category = industry.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(industry);
    return acc;
  }, {} as Record<string, IndustryItem[]>);

  const handleSelect = (industry: IndustryItem) => {
    if (selectedIndustries.some(i => i.code === industry.code)) {
      onChange(selectedIndustries.filter(i => i.code !== industry.code));
    } else if (selectedIndustries.length < maxIndustries) {
      onChange([...selectedIndustries, { ...industry, confidence: 1.0 }]);
    }
  };

  const handleRemove = (code: string) => {
    onChange(selectedIndustries.filter(i => i.code !== code));
  };

  const handleAddCustom = () => {
    if (customInput.trim() && selectedIndustries.length < maxIndustries) {
      const customIndustry: IndustryItem = {
        code: `CUSTOM_${Date.now()}`,
        name: customInput.trim(),
        category: 'Custom',
        confidence: 1.0,
      };
      onChange([...selectedIndustries, customIndustry]);
      setCustomInput('');
      setSearchQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customInput.trim()) {
      e.preventDefault();
      handleAddCustom();
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">{label}</label>
      )}
      
      {/* Selected Industries */}
      {selectedIndustries.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedIndustries.map((industry) => (
            <span
              key={industry.code}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 text-sm font-medium border border-violet-500/20"
            >
              <span>{industry.name}</span>
              {industry.category && industry.category !== 'Custom' && (
                <span className="text-violet-400/60 text-xs">({industry.category})</span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(industry.code)}
                className="p-0.5 rounded hover:bg-violet-500/20 transition-colors"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown Trigger */}
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={selectedIndustries.length >= maxIndustries}
          className={`
            w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 
            transition-all text-left
            ${isOpen 
              ? 'border-violet-500 ring-2 ring-violet-500/20' 
              : 'border-[var(--border-default)]/60 hover:border-[var(--border-default)]'
            }
            ${selectedIndustries.length >= maxIndustries 
              ? 'opacity-50 cursor-not-allowed bg-[var(--bg-secondary)]' 
              : 'bg-[var(--bg-primary)]'
            }
          `}
        >
          <span className={selectedIndustries.length === 0 ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}>
            {selectedIndustries.length === 0 
              ? 'Search or select industries...' 
              : `${selectedIndustries.length} of ${maxIndustries} selected`
            }
          </span>
          <ChevronDown size={18} className={`text-[var(--text-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {isOpen && selectedIndustries.length < maxIndustries && (
          <div className="absolute z-50 mt-2 w-full bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] shadow-xl max-h-[400px] overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-[var(--border-subtle)]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCustomInput(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search industries or type custom..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-violet-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Industry List */}
            <div className="overflow-y-auto max-h-[280px] p-2">
              {Object.keys(groupedIndustries).length > 0 ? (
                Object.entries(groupedIndustries).map(([category, industries]) => (
                  <div key={category} className="mb-3">
                    <div className="px-2 py-1 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                      {category}
                    </div>
                    <div className="space-y-0.5">
                      {industries.map((industry) => {
                        const isSelected = selectedIndustries.some(i => i.code === industry.code);
                        return (
                          <button
                            key={industry.code}
                            type="button"
                            onClick={() => handleSelect(industry)}
                            className={`
                              w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-colors
                              ${isSelected 
                                ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' 
                                : 'hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                              }
                            `}
                          >
                            <span>{industry.name}</span>
                            {isSelected && <Check size={16} className="text-violet-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : searchQuery.trim() ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-[var(--text-tertiary)] mb-3">
                    No industries found for "{searchQuery}"
                  </p>
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 text-sm font-medium hover:bg-violet-500/20 transition-colors"
                  >
                    <Plus size={16} />
                    Add "{searchQuery}" as custom industry
                  </button>
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-[var(--text-tertiary)]">
                  Start typing to search...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-[var(--text-tertiary)] mt-2">
        {selectedIndustries.length}/{maxIndustries} industries • Select multiple for better AI content targeting
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
          ? 'border-violet-500/30 bg-violet-500/5'
          : 'border-[var(--border-default)]/40 bg-[var(--bg-secondary)]/20 opacity-60'
        }
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-[var(--text-primary)]">{pillar.name}</h4>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
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
                ? 'text-violet-500 hover:bg-violet-500/10'
                : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)]'
              }
            `}
            title={pillar.isActive ? 'Deactivate' : 'Activate'}
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            title="Edit"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
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
              className="px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[10px] font-medium text-[var(--text-secondary)]"
            >
              {topic}
            </span>
          ))}
          {pillar.topics.length > 4 && (
            <span className="px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[10px] font-medium text-[var(--text-tertiary)]">
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
    <div className={`rounded-xl border-2 border-[var(--border-default)]/60 bg-[var(--bg-elevated)] overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 rounded-lg bg-violet-500/10">
              {icon}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
            {description && (
              <p className="text-sm text-[var(--text-tertiary)]">{description}</p>
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
          <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
          <span className="text-lg font-bold text-violet-500">
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
        className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full appearance-none cursor-pointer accent-violet-500"
      />
      <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-1">
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  );
}