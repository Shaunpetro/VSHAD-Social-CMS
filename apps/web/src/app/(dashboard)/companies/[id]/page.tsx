// apps/web/src/app/(dashboard)/companies/[id]/page.tsx
import { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import LogoUpload from '@/components/ui/LogoUpload'

export const metadata: Metadata = {
  title: 'Company Dashboard | RoboSocial',
  description: 'Manage your company social media presence'
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      platforms: true,
      generatedPosts: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          platform: true
        }
      },
      intelligence: {
        include: {
          contentPillars: true,
          competitors: true
        }
      }
    }
  })

  if (!company) {
    notFound()
  }

  const needsOnboarding = !company.intelligence?.onboardingCompleted

  return (
    <div className="space-y-6">
      {/* Onboarding Banner - shows if not completed */}
      {needsOnboarding && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Set Up Content Intelligence</h2>
                <p className="text-blue-100 mt-1">
                  Complete onboarding in under 5 minutes to unlock AI-powered content generation
                </p>
              </div>
            </div>
            <Link
              href={`/companies/${id}/onboarding`}
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-md whitespace-nowrap"
            >
              Start Setup →
            </Link>
          </div>
        </div>
      )}

      {/* Company Header */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <LogoUpload
              companyId={company.id}
              companyName={company.name}
              currentLogoUrl={company.logoUrl}
              size="lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
              {company.industry && (
                <p className="text-gray-500 mt-1">{company.industry}</p>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm hover:underline mt-1 inline-block"
                >
                  {company.website}
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!needsOnboarding && (
              <Link
                href={`/companies/${id}/onboarding`}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
              >
                Edit Intelligence
              </Link>
            )}
            <Link
              href={`/generate?company=${id}`}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate Content
            </Link>
          </div>
        </div>

        {/* Description */}
        {company.description && (
          <p className="text-gray-600 mt-4 border-t pt-4">{company.description}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="text-sm text-gray-500">Connected Platforms</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{company.platforms.length}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {company.platforms.length === 0 ? (
              <span className="text-xs text-gray-400">None yet</span>
            ) : (
              company.platforms.map((p) => (
                <span
                  key={p.id}
                  className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full"
                >
                  {p.type}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="text-sm text-gray-500">Total Posts</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{company.generatedPosts.length}</div>
          <div className="text-xs text-gray-400 mt-2">Showing recent 5</div>
        </div>

        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="text-sm text-gray-500">Content Pillars</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">
            {company.intelligence?.contentPillars?.length ?? 0}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            {needsOnboarding ? 'Complete onboarding to add' : 'Active pillars'}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="text-sm text-gray-500">Intelligence Status</div>
          <div className="mt-1">
            {needsOnboarding ? (
              <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                Needs Setup
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Active
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-2">Content intelligence</div>
        </div>
      </div>

      {/* Intelligence Summary - only show if onboarding completed */}
      {!needsOnboarding && company.intelligence && (
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Intelligence</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Brand Personality */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Brand Personality</h3>
              <div className="flex flex-wrap gap-1">
                {company.intelligence.brandPersonality.length === 0 ? (
                  <span className="text-xs text-gray-400">Not set</span>
                ) : (
                  company.intelligence.brandPersonality.map((trait) => (
                    <span
                      key={trait}
                      className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full"
                    >
                      {trait}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Content Pillars */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Content Pillars</h3>
              <div className="flex flex-wrap gap-1">
                {company.intelligence.contentPillars.length === 0 ? (
                  <span className="text-xs text-gray-400">Not set</span>
                ) : (
                  company.intelligence.contentPillars.map((pillar) => (
                    <span
                      key={pillar.id}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full"
                    >
                      {pillar.name}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Posting Schedule */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Posting Schedule</h3>
              <p className="text-sm text-gray-700">
                {company.intelligence.postsPerWeek} posts/week
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {company.intelligence.preferredDays.length === 0 ? (
                  <span className="text-xs text-gray-400">No days set</span>
                ) : (
                  company.intelligence.preferredDays.map((day) => (
                    <span
                      key={day}
                      className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full"
                    >
                      {day}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-6 pt-4 border-t flex gap-3">
            <Link
              href={`/generate?company=${id}`}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🚀 Generate This Week
            </Link>
            <Link
              href={`/companies/${id}/onboarding`}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
            >
              ✏️ Edit Settings
            </Link>
          </div>
        </div>
      )}

      {/* Connected Platforms */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Connected Platforms</h2>
          <Link
            href="/platforms"
            className="text-sm text-blue-600 hover:underline"
          >
            Manage →
          </Link>
        </div>
        {company.platforms.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No platforms connected yet.</p>
            <Link href="/platforms" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
              Connect your first platform
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {company.platforms.map((platform) => (
              <div key={platform.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    platform.type === 'LINKEDIN' ? 'bg-blue-100 text-blue-700' :
                    platform.type === 'FACEBOOK' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {platform.type === 'LINKEDIN' ? '💼' : 
                     platform.type === 'FACEBOOK' ? '📘' : '📱'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{platform.platformName}</p>
                    <p className="text-xs text-gray-500">{platform.type}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
                  Connected
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Posts */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
          <Link
            href={`/generate?company=${id}`}
            className="text-sm text-blue-600 hover:underline"
          >
            Create New →
          </Link>
        </div>
        {company.generatedPosts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No posts yet.</p>
            <p className="text-sm mt-1">
              {needsOnboarding 
                ? 'Complete onboarding to start generating content!'
                : 'Use "Generate This Week" to create your first batch!'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {company.generatedPosts.map((post) => (
              <div key={post.id} className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
                    {post.platform.type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(post.createdAt).toLocaleDateString('en-ZA')}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}