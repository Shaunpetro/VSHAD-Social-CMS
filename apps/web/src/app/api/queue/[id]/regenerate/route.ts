// apps/web/src/app/api/queue/[id]/regenerate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { QueueStatus } from '@prisma/client';
import { generateSocialContent } from '@/lib/ai/openai';
import { getContentTypePromptEnhancement, CONTENT_TYPE_CONFIG, ContentType } from '@/lib/ai/content-strategy';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Valid tone types for the AI generator
type ToneType = 'professional' | 'casual' | 'friendly' | 'authoritative';
const VALID_TONES: ToneType[] = ['professional', 'casual', 'friendly', 'authoritative'];

function validateTone(tone: string | null | undefined): ToneType {
  if (tone && VALID_TONES.includes(tone as ToneType)) {
    return tone as ToneType;
  }
  return 'professional';
}

/**
 * POST /api/queue/[id]/regenerate
 * Regenerate content for a queue item using AI
 * 
 * Body (optional):
 * - feedback: User feedback to guide regeneration
 * - contentType: Override content type
 * - tone: Override tone
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    let body: { feedback?: string; contentType?: string; tone?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine
    }

    const { feedback, contentType: overrideType, tone: overrideTone } = body;

    // Fetch the queue item with company intelligence
    const queueItem = await prisma.contentQueueItem.findUnique({
      where: { id },
      include: {
        platform: true,
        company: {
          include: {
            intelligence: {
              include: {
                contentPillars: true,
              },
            },
          },
        },
      },
    });

    if (!queueItem) {
      return NextResponse.json(
        { error: 'Queue item not found' },
        { status: 404 }
      );
    }

    if (queueItem.status !== 'PENDING' && queueItem.status !== 'REGENERATING') {
      return NextResponse.json(
        { error: `Cannot regenerate item with status: ${queueItem.status}` },
        { status: 400 }
      );
    }

    // Mark as regenerating
    await prisma.contentQueueItem.update({
      where: { id },
      data: { status: QueueStatus.REGENERATING },
    });

    const intel = queueItem.company.intelligence;
    const contentType = (overrideType || queueItem.contentType || 'educational') as ContentType;
    
    // Validate and get tone
    const toneInput = overrideTone || queueItem.tone || intel?.defaultTone;
    const tone = validateTone(toneInput);

    // Build regeneration context
    const pillar = intel?.contentPillars.find(p => p.name === queueItem.pillar);
    const topics = pillar?.topics || [];
    const topic = topics[Math.floor(Math.random() * Math.max(topics.length, 1))] || queueItem.pillar || 'industry insights';

    // Get day of week for the suggested date
    const suggestedDate = queueItem.suggestedDate ? new Date(queueItem.suggestedDate) : new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[suggestedDate.getDay()];

    // Get funnel stage from content type config
    const typeConfig = CONTENT_TYPE_CONFIG[contentType];
    const funnelStage = typeConfig?.funnelStage || 'awareness';

    // Get company goals
    const companyGoals = intel?.primaryGoals || [];

    // Get content type context for AI
    let contentTypeContext = getContentTypePromptEnhancement(
      contentType,
      dayOfWeek,
      funnelStage,
      companyGoals
    );

    // Add brand context to contentTypeContext
    if (intel?.brandVoice) {
      contentTypeContext += `\n\n**BRAND VOICE:**\n${intel.brandVoice}`;
    }
    if (intel?.targetAudience) {
      contentTypeContext += `\n\n**TARGET AUDIENCE:**\n${intel.targetAudience}`;
    }
    if (intel?.uniqueSellingPoints && intel.uniqueSellingPoints.length > 0) {
      contentTypeContext += `\n\n**UNIQUE SELLING POINTS:**\n${intel.uniqueSellingPoints.map(usp => `- ${usp}`).join('\n')}`;
    }

    // Build feedback instruction
    const feedbackInstruction = feedback 
      ? `\n\n**USER FEEDBACK ON PREVIOUS VERSION:**\n"${feedback}"\nPlease address this feedback in your new version.`
      : '\n\nPlease create a fresh, different approach to this topic.';

    // Generate new content
    const platformType = queueItem.platform.type.toLowerCase() as 'linkedin' | 'facebook' | 'twitter' | 'instagram';
    
    const result = await generateSocialContent({
      companyId: queueItem.companyId,
      companyName: queueItem.company.name,
      companyDescription: queueItem.company.description || undefined,
      companyIndustry: queueItem.company.industry || undefined,
      platform: platformType,
      platformId: queueItem.platformId,
      topic,
      tone,
      includeHashtags: true,
      useAnalytics: true,
      contentTypeContext: contentTypeContext + feedbackInstruction,
    });

    if (!result.content) {
      // Revert status
      await prisma.contentQueueItem.update({
        where: { id },
        data: { status: QueueStatus.PENDING },
      });
      
      return NextResponse.json(
        { error: 'Failed to generate new content' },
        { status: 500 }
      );
    }

    // Extract hook (first line)
    const lines = result.content.split('\n').filter(l => l.trim());
    const hook = lines[0]?.substring(0, 100) || null;

    // Update queue item with new content
    const updatedItem = await prisma.contentQueueItem.update({
      where: { id },
      data: {
        content: result.content,
        hashtags: result.hashtags || queueItem.hashtags,
        contentType,
        tone,
        hook,
        status: QueueStatus.PENDING,
        generationContext: {
          regeneratedAt: new Date().toISOString(),
          feedback: feedback || null,
          previousContentType: queueItem.contentType,
          newContentType: contentType,
        },
      },
      include: {
        platform: {
          select: {
            id: true,
            type: true,
            name: true,
            username: true,
          },
        },
      },
    });

    console.log(`[Queue] Regenerated queue item ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Content regenerated successfully',
      queueItem: updatedItem,
    });
  } catch (error) {
    console.error('[Queue API] Regenerate error:', error);
    
    // Try to revert status
    try {
      const { id } = await params;
      await prisma.contentQueueItem.update({
        where: { id },
        data: { status: QueueStatus.PENDING },
      });
    } catch {
      // Ignore revert error
    }
    
    return NextResponse.json(
      { error: 'Failed to regenerate content' },
      { status: 500 }
    );
  }
}