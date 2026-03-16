'use client';

import { useState } from 'react';
import { Sparkles, RefreshCw, Lightbulb } from 'lucide-react';

interface GenerateFormProps {
  onGenerate: (params: GenerateParams) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export interface GenerateParams {
  topic: string;
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative';
  includeHashtags: boolean;
  includeEmojis: boolean;
}

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-appropriate' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'authoritative', label: 'Authoritative', description: 'Expert and confident' },
] as const;

const TOPIC_SUGGESTIONS = [
  'Industry insights and trends',
  'Company culture and values',
  'Product or service update',
  'Tips and best practices',
  'Behind the scenes',
  'Customer success story',
  'Thought leadership',
  'Team spotlight',
];

export function GenerateForm({ onGenerate, isGenerating, disabled }: GenerateFormProps) {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<GenerateParams['tone']>('professional');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onGenerate({
      topic,
      tone,
      includeHashtags,
      includeEmojis,
    });
  }

  function handleSuggestionClick(suggestion: string) {
    setTopic(suggestion);
    setShowSuggestions(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Topic Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="topic" className="text-sm font-medium">
            Topic or Theme
          </label>
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Lightbulb size={12} />
            {showSuggestions ? 'Hide suggestions' : 'Show suggestions'}
          </button>
        </div>
        
        <textarea
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What would you like to post about? (optional - AI will suggest if left empty)"
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-border transition-colors resize-none"
        />

        {showSuggestions && (
          <div className="flex flex-wrap gap-2 pt-1">
            {TOPIC_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-2.5 py-1 rounded-full text-xs bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tone Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Tone</label>
        <div className="grid grid-cols-2 gap-2">
          {TONE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTone(option.value)}
              className={`
                p-3 rounded-lg border text-left transition-all duration-200
                ${tone === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border/60 hover:border-border hover:bg-secondary/30'
                }
              `}
            >
              <p className={`text-sm font-medium ${tone === option.value ? 'text-primary' : ''}`}>
                {option.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {option.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeHashtags}
            onChange={(e) => setIncludeHashtags(e.target.checked)}
            className="h-4 w-4 rounded border-border/60 text-primary focus:ring-primary/20"
          />
          <span className="text-sm">Include hashtags</span>
        </label>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeEmojis}
            onChange={(e) => setIncludeEmojis(e.target.checked)}
            className="h-4 w-4 rounded border-border/60 text-primary focus:ring-primary/20"
          />
          <span className="text-sm">Include emojis</span>
        </label>
      </div>

      {/* Generate Button */}
      <button
        type="submit"
        disabled={disabled || isGenerating}
        className="flex w-full items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <RefreshCw size={18} className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles size={18} />
            Generate Content
          </>
        )}
      </button>
    </form>
  );
}