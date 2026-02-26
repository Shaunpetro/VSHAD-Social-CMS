import { Terminal, Activity, Plug, Settings, Webhook } from 'lucide-react';

const tabs = [
  { label: 'API Logs', icon: Terminal },
  { label: 'System Status', icon: Activity },
  { label: 'Connections', icon: Plug },
  { label: 'Config', icon: Settings },
  { label: 'Webhooks', icon: Webhook },
];

export default function DeveloperPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Developer Tools</h1>
            <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-500 text-xs font-medium border border-yellow-500/20">
              DEV MODE
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Debug, monitor, and configure system internals
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-border/60 pb-px">
        {tabs.map(({ label, icon: Icon }, i) => (
          <button
            key={label}
            className={
              'flex items-center gap-2 px-4 py-2.5 text-sm rounded-t-md transition-colors duration-200 border-b-2 ' +
              (i === 0
                ? 'border-primary text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground')
            }
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border/60 rounded-xl">
        <div className="p-4 rounded-full bg-secondary mb-4">
          <Terminal size={24} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">API Logs</h3>
        <p className="text-sm text-muted-foreground mt-1">
          No API requests logged yet
        </p>
      </div>
    </div>
  );
}