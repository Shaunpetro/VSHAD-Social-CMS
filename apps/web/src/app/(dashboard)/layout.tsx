// apps/web/src/app/(dashboard)/layout.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { HelpCircle, Building2, CalendarDays, ImageIcon } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { HelpModal } from "@/components/ui/HelpModal";
import { CompanyProvider } from "@/app/contexts/company-context";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Media", href: "/media", icon: ImageIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);

  // Keyboard shortcut for help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open help with "?" key (shift + /)
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        // Don't trigger if typing in an input
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          setHelpOpen(true);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <CompanyProvider>
      <div className="min-h-screen bg-[var(--bg-primary)]">
        {/* Background gradient */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        {/* Top Navigation */}
        <header className="h-16 glass sticky top-0 z-40">
          <div className="h-full max-w-[1800px] mx-auto px-4 flex items-center justify-between">
            {/* Left: Logo + Global Nav */}
            <div className="flex items-center gap-6">
              <Link href="/companies" className="flex items-center gap-3 group">
                {/* Logo Image */}
                <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-lg group-hover:shadow-xl transition-shadow">
                  <Image
                    src="/vshad-logo.png"
                    alt="VSHAD RoboSocial"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
                <span className="font-bold text-[var(--text-primary)] hidden sm:inline text-lg">
                  RoboSocial
                </span>
              </Link>

              <div className="divider-vertical hidden md:block" />

              {/* Global Nav */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map(({ label, href, icon: Icon }) => {
                  const isActive =
                    pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                      )}
                    >
                      <Icon size={18} />
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <div className="divider-vertical" />

              {/* Help */}
              <button
                onClick={() => setHelpOpen(true)}
                className="p-2 rounded-xl transition-all duration-200 hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] relative group"
                title="Help & About (Press ?)"
              >
                <HelpCircle size={20} />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Press <kbd className="font-mono">?</kbd> for help
                </span>
              </button>

              {/* Theme toggle */}
              <ThemeToggle />

              {/* User avatar */}
              <button className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-medium shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-shadow">
                U
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-[var(--border-default)] bg-[var(--bg-primary)]/90 backdrop-blur-xl">
          <div className="flex items-center justify-around h-14">
            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors duration-200",
                    isActive
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-tertiary)]"
                  )}
                >
                  <Icon size={20} />
                  <span className="text-[10px] font-medium">{label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => setHelpOpen(true)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-[var(--text-tertiary)]"
            >
              <HelpCircle size={20} />
              <span className="text-[10px] font-medium">Help</span>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="pb-16 md:pb-0">{children}</main>

        {/* Help Modal */}
        <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
      </div>
    </CompanyProvider>
  );
}