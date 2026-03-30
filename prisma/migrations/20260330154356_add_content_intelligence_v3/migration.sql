-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REGENERATING', 'SCHEDULED');

-- AlterTable
ALTER TABLE "GeneratedPost" ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "hook" TEXT,
ADD COLUMN     "includesHumor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pillar" TEXT;

-- CreateTable
CREATE TABLE "CompanyIntelligence" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "brandPersonality" TEXT[],
    "brandVoice" TEXT,
    "uniqueSellingPoints" TEXT[],
    "targetAudience" TEXT,
    "primaryGoals" TEXT[],
    "communityFocus" TEXT,
    "primaryKeywords" TEXT[],
    "industryHashtags" TEXT[],
    "brandedHashtags" TEXT[],
    "defaultTone" TEXT NOT NULL DEFAULT 'professional',
    "humorEnabled" BOOLEAN NOT NULL DEFAULT true,
    "humorStyle" TEXT,
    "humorDays" TEXT[],
    "humorTimes" TEXT[],
    "dayToneSchedule" JSONB,
    "postsPerWeek" INTEGER NOT NULL DEFAULT 4,
    "preferredDays" TEXT[],
    "preferredTimes" JSONB,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "learnedBestDays" TEXT[],
    "learnedBestTimes" JSONB,
    "learnedBestPillars" JSONB,
    "avoidTopics" TEXT[],
    "competitorGaps" TEXT[],
    "industryBenchmarks" JSONB,
    "industryTrends" JSONB,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lastResearchSync" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyIntelligence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPillar" (
    "id" TEXT NOT NULL,
    "intelligenceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "topics" TEXT[],
    "keywords" TEXT[],
    "contentTypes" TEXT[],
    "frequencyWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "preferredDays" TEXT[],
    "totalPosts" INTEGER NOT NULL DEFAULT 0,
    "avgEngagement" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPillar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "intelligenceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "linkedinUrl" TEXT,
    "facebookUrl" TEXT,
    "websiteUrl" TEXT,
    "postingFrequency" TEXT,
    "avgEngagement" DOUBLE PRECISION,
    "followerCount" INTEGER,
    "topContentTypes" TEXT[],
    "topHashtags" TEXT[],
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "lastAnalyzed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustryBenchmark" (
    "id" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "recommendedPostsPerWeek" INTEGER NOT NULL DEFAULT 4,
    "optimalPostsMin" INTEGER NOT NULL DEFAULT 3,
    "optimalPostsMax" INTEGER NOT NULL DEFAULT 5,
    "bestDays" TEXT[],
    "bestTimes" JSONB NOT NULL,
    "platformPriority" JSONB NOT NULL,
    "suggestedThemes" JSONB NOT NULL,
    "topHashtags" TEXT[],
    "seoKeywords" TEXT[],
    "recommendedTone" TEXT NOT NULL DEFAULT 'professional',
    "humorAppropriate" BOOLEAN NOT NULL DEFAULT true,
    "avgEngagementRate" DOUBLE PRECISION,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndustryBenchmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentQueueItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "hashtags" TEXT[],
    "keywords" TEXT[],
    "platformId" TEXT NOT NULL,
    "suggestedDate" TIMESTAMP(3) NOT NULL,
    "suggestedTime" TEXT NOT NULL,
    "pillar" TEXT,
    "contentType" TEXT,
    "tone" TEXT,
    "includesHumor" BOOLEAN NOT NULL DEFAULT false,
    "hook" TEXT,
    "engagementPrediction" TEXT,
    "suggestedMedia" TEXT,
    "generationContext" JSONB,
    "status" "QueueStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "generatedPostId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyIntelligence_companyId_key" ON "CompanyIntelligence"("companyId");

-- CreateIndex
CREATE INDEX "ContentPillar_intelligenceId_idx" ON "ContentPillar"("intelligenceId");

-- CreateIndex
CREATE INDEX "Competitor_intelligenceId_idx" ON "Competitor"("intelligenceId");

-- CreateIndex
CREATE UNIQUE INDEX "IndustryBenchmark_industry_key" ON "IndustryBenchmark"("industry");

-- CreateIndex
CREATE INDEX "IndustryBenchmark_industry_idx" ON "IndustryBenchmark"("industry");

-- CreateIndex
CREATE INDEX "ContentQueueItem_companyId_status_idx" ON "ContentQueueItem"("companyId", "status");

-- CreateIndex
CREATE INDEX "ContentQueueItem_platformId_idx" ON "ContentQueueItem"("platformId");

-- CreateIndex
CREATE INDEX "ContentQueueItem_suggestedDate_idx" ON "ContentQueueItem"("suggestedDate");

-- CreateIndex
CREATE INDEX "GeneratedPost_pillar_idx" ON "GeneratedPost"("pillar");

-- AddForeignKey
ALTER TABLE "CompanyIntelligence" ADD CONSTRAINT "CompanyIntelligence_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPillar" ADD CONSTRAINT "ContentPillar_intelligenceId_fkey" FOREIGN KEY ("intelligenceId") REFERENCES "CompanyIntelligence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_intelligenceId_fkey" FOREIGN KEY ("intelligenceId") REFERENCES "CompanyIntelligence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentQueueItem" ADD CONSTRAINT "ContentQueueItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentQueueItem" ADD CONSTRAINT "ContentQueueItem_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
