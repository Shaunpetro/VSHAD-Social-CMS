// apps/web/src/app/(dashboard)/layout.tsx
import { Navbar } from "@/app/components/layout/navbar";
import { MobileNav } from "@/app/components/layout/mobile-nav";
import { CompanyProvider } from "@/app/contexts/company-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CompanyProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 pb-20 md:pb-6">
          {children}
        </main>
        <MobileNav />
      </div>
    </CompanyProvider>
  );
}