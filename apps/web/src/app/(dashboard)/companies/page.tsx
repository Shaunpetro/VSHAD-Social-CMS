import { Building2, Plus } from 'lucide-react';

export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your companies, brand voice, and content topics
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={16} />
          Add Company
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border/60 rounded-xl">
        <div className="p-4 rounded-full bg-secondary mb-4">
          <Building2 size={24} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No companies yet</h3>
        <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
          Add your first company to start generating AI-powered social media content
        </p>
        <button className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={16} />
          Add Your First Company
        </button>
      </div>
    </div>
  );
}