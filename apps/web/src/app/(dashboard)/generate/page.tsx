'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PlatformSelector } from '@/app/components/generate/platform-selector';
import { GenerateForm, GenerateParams } from '@/app/components/generate/generate-form';
import { ContentPreview } from '@/app/components/generate/content-preview';

interface Company {
  id: string;
  name: string;
  description?: string;
  industry?: string;
}

interface Platform {
  id: string;
  type?: string;
  platform?: string;
  name: string;
  username?: string;
  accountName?: string;
  companyId: string;
  status?: string;
  company: {
    id: string;
    name: string;
  };
}

interface GeneratedContent {
  content: string;
  hashtags: string[];
  characterCount: number;
  platform: string;
}

export default function GeneratePage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch companies and platforms on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        const [companiesRes, platformsRes] = await Promise.all([
          fetch('/api/companies'),
          fetch('/api/platforms'),
        ]);

        if (!companiesRes.ok || !platformsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const companiesData = await companiesRes.json();
        const platformsData = await platformsRes.json();

        setCompanies(companiesData);
        // Filter for connected platforms only
        setPlatforms(platformsData.filter((p: Platform) => p.status === 'connected'));

        // Auto-select first company if only one exists
        if (companiesData.length === 1) {
          setSelectedCompany(companiesData[0]);
        }
      } catch (err) {
        setError('Failed to load data. Please refresh the page.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter platforms by selected company
  const filteredPlatforms = selectedCompany
    ? platforms.filter((p) => p.companyId === selectedCompany.id)
    : [];

  // Get platform type (handles both field names)
  function getPlatformType(platform: Platform): string {
    return (platform.type || platform.platform || 'unknown').toLowerCase();
  }

  // Handle company selection
  function handleCompanySelect(companyId: string) {
    const company = companies.find((c) => c.id === companyId);
    setSelectedCompany(company || null);
    setSelectedPlatform(null);
    setGeneratedContent(null);
    setError(null);
  }

  // Handle platform selection
  function handlePlatformSelect(platform: Platform) {
    setSelectedPlatform(platform);
    setGeneratedContent(null);
    setError(null);
  }

  // Handle content generation
  async function handleGenerate(params: GenerateParams) {
    if (!selectedCompany || !selectedPlatform) {
      setError('Please select a company and platform first');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setSuccessMessage(null);

      const platformType = getPlatformType(selectedPlatform);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          platformId: selectedPlatform.id,
          platform: platformType,
          topic: params.topic,
          tone: params.tone,
          includeHashtags: params.includeHashtags,
          includeEmojis: params.includeEmojis,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Generation failed');
      }

      setGeneratedContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }

  // Handle content regeneration with feedback
  async function handleRegenerate(feedback: string) {
    if (!selectedCompany || !selectedPlatform || !generatedContent) return;

    try {
      setIsRegenerating(true);
      setError(null);

      const platformType = getPlatformType(selectedPlatform);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          platformId: selectedPlatform.id,
          platform: platformType,
          regenerate: true,
          originalContent: generatedContent.content,
          feedback,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Regeneration failed');
      }

      setGeneratedContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate content');
      console.error(err);
    } finally {
      setIsRegenerating(false);
    }
  }

  // Handle content edit
  function handleEdit(newContent: string) {
    if (generatedContent) {
      const hashtags = newContent.match(/#\w+/g) || [];
      setGeneratedContent({
        ...generatedContent,
        content: newContent,
        hashtags,
        characterCount: newContent.length,
      });
    }
  }

  // Handle save to database
  async function handleSave(content: string) {
    if (!selectedCompany || !selectedPlatform) return;

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch('/api/generate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          platformId: selectedPlatform.id,
          content,
          hashtags: generatedContent?.hashtags || [],
          status: 'DRAFT',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save');
      }

      setSuccessMessage('Content saved as draft!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Generate Content
        </h1>
        <p className="text-muted-foreground mt-1">
          Create AI-powered social media posts for your connected platforms
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
        >
          <AlertCircle size={16} />
          {error}
        </motion.div>
      )}

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm"
        >
          <CheckCircle2 size={16} />
          {successMessage}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          {/* Company Selection */}
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={18} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold">Select Company</h2>
            </div>

            {companies.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No companies found. Create a company first.
              </p>
            ) : (
              <select
                value={selectedCompany?.id || ''}
                onChange={(e) => handleCompanySelect(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-border transition-colors"
              >
                <option value="">Choose a company...</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Platform Selection */}
          {selectedCompany && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/60 bg-card p-5"
            >
              <PlatformSelector
                platforms={filteredPlatforms}
                selectedPlatform={selectedPlatform}
                onSelect={handlePlatformSelect}
              />
            </motion.div>
          )}

          {/* Generate Form */}
          {selectedPlatform && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/60 bg-card p-5"
            >
              <h2 className="text-sm font-semibold mb-4">Content Settings</h2>
              <GenerateForm
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                disabled={!selectedCompany || !selectedPlatform}
              />
            </motion.div>
          )}
        </div>

        {/* Right Column - Preview */}
        <div>
          {generatedContent ? (
            <ContentPreview
              content={generatedContent.content}
              hashtags={generatedContent.hashtags}
              characterCount={generatedContent.characterCount}
              platform={selectedPlatform ? getPlatformType(selectedPlatform) : 'linkedin'}
              companyName={selectedCompany?.name || ''}
              onRegenerate={handleRegenerate}
              onSave={handleSave}
              onEdit={handleEdit}
              isRegenerating={isRegenerating}
              isSaving={isSaving}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 bg-secondary/10 p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-sm font-medium text-muted-foreground">
                No content generated yet
              </h3>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
                Select a company and platform, then click Generate to create AI-powered content
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}