import { Plug, Plus } from 'lucide-react';

export default function PlatformsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Platform Connections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your social media accounts and blog platforms
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={16} />
          Connect Platform
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border/60 rounded-xl">
        <div className="p-4 rounded-full bg-secondary mb-4">
          <Plug size={24} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No platforms connected</h3>
        <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
          Connect LinkedIn, Twitter, Facebook, Instagram, or WordPress to start publishing
        </p>
        <button className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={16} />
          Connect Your First Platform
        </button>
      </div>
    </div>
  );
}