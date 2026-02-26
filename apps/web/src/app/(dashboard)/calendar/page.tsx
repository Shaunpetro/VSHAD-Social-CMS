import { CalendarDays } from 'lucide-react';

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Content Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Schedule and manage your content across all platforms
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border/60 rounded-xl">
        <div className="p-4 rounded-full bg-secondary mb-4">
          <CalendarDays size={24} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No scheduled content</h3>
        <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
          Generate content and schedule it across your connected platforms
        </p>
      </div>
    </div>
  );
}