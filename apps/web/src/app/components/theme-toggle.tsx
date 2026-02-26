import { useTheme } from '@/app/providers';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'system' as const, icon: Monitor, label: 'System' },
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={
            'p-2 rounded-md transition-all duration-200 ' +
            (theme === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground')
          }
          aria-label={`Set ${label} theme`}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}