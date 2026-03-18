// apps/web/src/app/components/layout/mobile-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Plug, Sparkles, CalendarDays, BarChart3 } from "lucide-react";

const navItems = [
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Platforms", href: "/platforms", icon: Plug },
  { label: "Generate", href: "/generate", icon: Sparkles },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border/40 bg-background/90 backdrop-blur-xl">
      <div className="flex items-center justify-around h-14">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={
                "flex flex-col items-center gap-0.5 px-2 py-1.5 transition-colors duration-200 " +
                (isActive ? "text-foreground" : "text-muted-foreground")
              }
            >
              <Icon size={18} />
              <span className="text-[9px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}