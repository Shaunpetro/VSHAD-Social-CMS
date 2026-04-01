// apps/web/src/app/loading.tsx
import PageLoader from '@/components/ui/PageLoader'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]/90 backdrop-blur-sm">
      <PageLoader message="Loading..." size="lg" />
    </div>
  )
}