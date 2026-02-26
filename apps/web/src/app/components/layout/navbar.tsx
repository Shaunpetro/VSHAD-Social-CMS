"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/app/components/theme-toggle";
import {
  Building2,
  Plug,
  Sparkles,
  CalendarDays,
  HelpCircle,
  ChevronDown,
  Terminal,
  BookOpen,
  Keyboard,
  Info,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const navItems = [
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Platforms", href: "/platforms", icon: Plug },
  { label: "Generate", href: "/generate", icon: Sparkles },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
];

const helpItems = [
  { label: "Documentation", href: "#", icon: BookOpen },
  { label: "Keyboard Shortcuts", href: "#", icon: Keyboard },
  { label: "Developer Tools", href: "/developer", icon: Terminal },
  { label: "About", href: "#", icon: Info },
];

export function Navbar() {
  const pathname = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setHelpOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/assets/logos/vshad-logo.png"
              alt="VSHAD"
              width={32}
              height={32}
              className="rounded-lg transition-transform group-hover:scale-105"
            />
            <span className="text-sm font-semibold tracking-tight hidden sm:block">
              VSHAD{" "}
              <span className="text-muted-foreground font-normal">
                RoboSocial
              </span>
            </span>
          </Link>

          <div className="hidden md:block h-5 w-px bg-border/60" />

          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-200 " +
                    (isActive
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50")
                  }
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={helpRef}>
            <button
              onClick={() => setHelpOpen(!helpOpen)}
              className={
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all duration-200 " +
                (helpOpen
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50")
              }
            >
              <HelpCircle size={16} />
              <span className="hidden sm:inline">Help</span>
              <ChevronDown
                size={12}
                className={
                  "transition-transform duration-200 " +
                  (helpOpen ? "rotate-180" : "")
                }
              />
            </button>

            {helpOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border/60 bg-popover p-1.5 shadow-lg">
                {helpItems.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setHelpOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors duration-150"
                  >
                    <Icon size={15} />
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-border/60" />

          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
