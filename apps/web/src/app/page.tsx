// apps/web/src/app/page.tsx
import { ThemeToggle } from "./components/theme-toggle";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 bg-background text-foreground">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-5xl font-bold tracking-tight">
          VSHAD <span className="text-primary/80">RoboSocial</span>
        </h1>
        <p className="text-muted-foreground text-center max-w-lg text-base">
          Automated AI-powered Social Media & Blog Posts content creation and
          calendar scheduler
        </p>
      </div>
      <ThemeToggle />
    </main>
  );
}
