// apps/web/src/components/ui/PageLoader.tsx
'use client'

import AnimatedLogo from './AnimatedLogo'

interface PageLoaderProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function PageLoader({ 
  message = 'Loading...', 
  size = 'md' 
}: PageLoaderProps) {
  const sizes = { sm: 80, md: 120, lg: 160 }

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full">
      <AnimatedLogo size={sizes[size]} duration={1.5} />
      <p className="mt-4 text-sm text-[var(--text-tertiary)] animate-pulse">
        {message}
      </p>
    </div>
  )
}