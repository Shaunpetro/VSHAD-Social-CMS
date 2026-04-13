// apps/web/src/app/(dashboard)/companies/[id]/media/layout.tsx

import { ReactNode } from "react";

interface MediaLayoutProps {
  children: ReactNode;
}

export default function MediaLayout({ children }: MediaLayoutProps) {
  return <>{children}</>;
}