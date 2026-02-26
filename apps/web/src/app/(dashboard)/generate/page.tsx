import { Sparkles } from 'lucide-react';

export default function GeneratePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Generate Content</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create AI-powered posts for your social media and blog platforms
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border/60 rounded-xl">
        <div className="p-4 rounded-full bg-secondary mb-4">
          <Sparkles size={24} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">Ready to generate</h3>
        <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
          Add a company and connect platforms first, then start generating content
        </p>
      </div>
    </div>
  );
}