// apps/web/src/app/(dashboard)/loading.tsx
import PageLoader from '@/components/ui/PageLoader'

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <PageLoader message="Loading dashboard..." />
    </div>
  )
}