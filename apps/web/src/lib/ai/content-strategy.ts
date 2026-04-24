// apps/web/src/lib/ai/content-strategy.ts

/**
 * Content Strategy Engine
 * Implements social media psychology for optimal content mix and timing
 *
 * Based on proven marketing principles:
 * - 40-30-20-10 content mix rule
 * - Day-of-week psychology
 * - Funnel-stage awareness
 * - Industry-specific optimization
 */

import {
  normalizePreferredTimes,
  createScheduledDate,
  DAY_ORDER,
  DEFAULT_POSTING_TIMES,
} from '@/lib/scheduling-utils';

// ============================================
// CONTENT TYPE DEFINITIONS
// ============================================

export type ContentType =
  | 'educational'
  | 'engagement'
  | 'promotional'
  | 'behindTheScenes'
  | 'caseStudy'
  | 'testimonial'
  | 'motivational'
  | 'tips'
  | 'news'
  | 'community';

export type FunnelStage = 'awareness' | 'interest' | 'consideration' | 'conversion';

export interface ContentTypeConfig {
  weight: number;
  funnelStage: FunnelStage;
  purpose: string;
  bestDays: string[];
  promptContext: string;
  hookStyle: string;
}

// The proven 40-30-20-10 content mix with funnel mapping
export const CONTENT_TYPE_CONFIG: Record<ContentType, ContentTypeConfig> = {
  educational: {
    weight: 0.25,
    funnelStage: 'awareness',
    purpose: 'Build authority and trust - position as industry expert',
    bestDays: ['monday', 'tuesday', 'wednesday'],
    promptContext: 'Create educational content that teaches something valuable. Position the company as a knowledgeable industry leader. Focus on solving a common problem or explaining a concept.',
    hookStyle: 'Start with a surprising fact, common misconception, or "Did you know..." opener',
  },
  tips: {
    weight: 0.15,
    funnelStage: 'awareness',
    purpose: 'Provide actionable value - quick wins for the audience',
    bestDays: ['tuesday', 'wednesday', 'thursday'],
    promptContext: 'Share practical, actionable tips that readers can implement immediately. Keep it concise and valuable. Number lists work well.',
    hookStyle: 'Start with the benefit or outcome: "Want to [achieve X]? Here\'s how..."',
  },
  engagement: {
    weight: 0.15,
    funnelStage: 'interest',
    purpose: 'Build community and relationships - encourage interaction',
    bestDays: ['thursday', 'friday', 'saturday'],
    promptContext: 'Create content that encourages comments, shares, and discussion. Ask questions, create polls, or share relatable experiences. The goal is conversation, not broadcasting.',
    hookStyle: 'Start with a question or relatable statement that invites response',
  },
  community: {
    weight: 0.10,
    funnelStage: 'interest',
    purpose: 'Celebrate community and build belonging',
    bestDays: ['friday', 'saturday', 'sunday'],
    promptContext: 'Highlight community members, celebrate milestones, share user-generated content themes, or discuss industry community topics. Make followers feel part of something bigger.',
    hookStyle: 'Start with appreciation or celebration: "Shoutout to..." or "We love seeing..."',
  },
  behindTheScenes: {
    weight: 0.10,
    funnelStage: 'interest',
    purpose: 'Humanize the brand - show the people and process',
    bestDays: ['friday', 'saturday'],
    promptContext: 'Show the human side of the business. Share team moments, office culture, how things are made, or day-in-the-life content. Be authentic and relatable.',
    hookStyle: 'Start with "Ever wondered..." or "Here\'s what goes on behind the scenes..."',
  },
  caseStudy: {
    weight: 0.08,
    funnelStage: 'consideration',
    purpose: 'Provide social proof and demonstrate results',
    bestDays: ['tuesday', 'wednesday', 'thursday'],
    promptContext: 'Share a success story or case study that demonstrates real results. Focus on the transformation: before state, what was done, and the outcome. Use specific numbers when possible.',
    hookStyle: 'Start with the result: "How [client type] achieved [specific result]..."',
  },
  testimonial: {
    weight: 0.07,
    funnelStage: 'consideration',
    purpose: 'Build trust through social proof',
    bestDays: ['monday', 'wednesday', 'friday'],
    promptContext: 'Share customer feedback, reviews, or success stories. Let satisfied customers do the selling. Focus on the emotional transformation and specific benefits received.',
    hookStyle: 'Start with a powerful quote or "Here\'s what [customer type] had to say..."',
  },
  promotional: {
    weight: 0.05,
    funnelStage: 'conversion',
    purpose: 'Drive sales and conversions - direct call to action',
    bestDays: ['tuesday', 'thursday'],
    promptContext: 'Promote products, services, or offers. Be direct but not pushy. Focus on benefits over features. Include a clear call-to-action. This should feel like a natural part of the content mix, not constant selling.',
    hookStyle: 'Start with the problem you solve or the transformation you offer',
  },
  motivational: {
    weight: 0.03,
    funnelStage: 'awareness',
    purpose: 'Inspire and energize - positive brand association',
    bestDays: ['monday', 'sunday'],
    promptContext: 'Share inspiring content relevant to the industry. Monday motivation, success mindset, or overcoming challenges. Connect it back to the brand values.',
    hookStyle: 'Start with an inspiring statement or quote that resonates with the target audience',
  },
  news: {
    weight: 0.02,
    funnelStage: 'awareness',
    purpose: 'Stay relevant - comment on industry developments',
    bestDays: ['monday', 'tuesday', 'wednesday'],
    promptContext: 'Share thoughts on industry news, trends, or developments. Position the company as informed and relevant. Add unique perspective or analysis.',
    hookStyle: 'Start with "Breaking:" or "Big news in [industry]:" or "Here\'s our take on..."',
  },
};

// ============================================
// DAY PSYCHOLOGY MAPPING
// ============================================

export interface DayPsychology {
  mood: string;
  primaryTypes: ContentType[];
  secondaryTypes: ContentType[];
  toneAdjustment: string;
  bestFor: string;
}

export const DAY_PSYCHOLOGY: Record<string, DayPsychology> = {
  monday: {
    mood: 'fresh-start-energizing',
    primaryTypes: ['educational', 'motivational', 'tips'],
    secondaryTypes: ['news', 'testimonial'],
    toneAdjustment: 'Energizing and forward-looking. People need motivation to start the week.',
    bestFor: 'Setting the tone, sharing knowledge, inspiring action',
  },
  tuesday: {
    mood: 'productive-focused',
    primaryTypes: ['educational', 'tips', 'caseStudy'],
    secondaryTypes: ['promotional', 'news'],
    toneAdjustment: 'Professional and value-packed. Peak productivity day - people are receptive to learning.',
    bestFor: 'Deep-dive content, tutorials, professional insights',
  },
  wednesday: {
    mood: 'midweek-value',
    primaryTypes: ['educational', 'caseStudy', 'tips'],
    secondaryTypes: ['testimonial', 'news'],
    toneAdjustment: 'Substantial and helpful. Midweek slump - provide real value to keep engagement.',
    bestFor: 'Problem-solving content, how-tos, success stories',
  },
  thursday: {
    mood: 'social-anticipatory',
    primaryTypes: ['engagement', 'community', 'caseStudy'],
    secondaryTypes: ['promotional', 'tips'],
    toneAdjustment: 'Conversational and social. People are looking forward to the weekend - more social.',
    bestFor: 'Questions, discussions, community features, soft promotions',
  },
  friday: {
    mood: 'casual-celebratory',
    primaryTypes: ['behindTheScenes', 'engagement', 'community'],
    secondaryTypes: ['motivational', 'testimonial'],
    toneAdjustment: 'Light and fun. Weekend mood - keep it casual and human.',
    bestFor: 'Team features, fun content, celebrations, casual engagement',
  },
  saturday: {
    mood: 'relaxed-personal',
    primaryTypes: ['community', 'behindTheScenes', 'engagement'],
    secondaryTypes: ['motivational', 'tips'],
    toneAdjustment: 'Relaxed and personal. Personal browsing time - be relatable.',
    bestFor: 'Lifestyle content, personal stories, community highlights',
  },
  sunday: {
    mood: 'reflective-planning',
    primaryTypes: ['motivational', 'community', 'educational'],
    secondaryTypes: ['tips', 'engagement'],
    toneAdjustment: 'Reflective and inspiring. People are planning the week ahead.',
    bestFor: 'Week-ahead motivation, reflection posts, inspiring stories',
  },
};

// ============================================
// GOAL-BASED ADJUSTMENTS
// ============================================

export interface GoalAdjustment {
  contentTypeBoosts: Partial<Record<ContentType, number>>;
  funnelFocus: FunnelStage[];
  description: string;
}

export const GOAL_ADJUSTMENTS: Record<string, GoalAdjustment> = {
  'brand awareness': {
    contentTypeBoosts: { educational: 0.1, tips: 0.05, news: 0.03 },
    funnelFocus: ['awareness'],
    description: 'Increase educational and thought leadership content',
  },
  'lead generation': {
    contentTypeBoosts: { caseStudy: 0.05, promotional: 0.05, testimonial: 0.05 },
    funnelFocus: ['consideration', 'conversion'],
    description: 'Increase social proof and conversion-focused content',
  },
  'community building': {
    contentTypeBoosts: { engagement: 0.1, community: 0.1, behindTheScenes: 0.05 },
    funnelFocus: ['interest'],
    description: 'Increase interactive and community-focused content',
  },
  'thought leadership': {
    contentTypeBoosts: { educational: 0.15, news: 0.05, caseStudy: 0.05 },
    funnelFocus: ['awareness', 'interest'],
    description: 'Increase expert-positioning content',
  },
  'sales': {
    contentTypeBoosts: { promotional: 0.1, caseStudy: 0.1, testimonial: 0.1 },
    funnelFocus: ['consideration', 'conversion'],
    description: 'Increase conversion-focused content',
  },
  'engagement': {
    contentTypeBoosts: { engagement: 0.15, community: 0.1 },
    funnelFocus: ['interest'],
    description: 'Maximize interactive content',
  },
};

// ============================================
// SCHEDULE GENERATION
// ============================================

export interface ScheduledSlot {
  date: Date;
  time: string;
  dayOfWeek: string;
  contentType: ContentType;
  funnelStage: FunnelStage;
  toneGuidance: string;
  topicSuggestion: string;
}

export interface ContentMixResult {
  slots: ScheduledSlot[];
  mixBreakdown: Record<ContentType, number>;
  funnelBreakdown: Record<FunnelStage, number>;
}

/**
 * Calculate adjusted content type weights based on company goals
 */
export function calculateAdjustedWeights(
  primaryGoals: string[],
  learnedBestPillars?: Record<string, number> | null
): Record<ContentType, number> {
  // Start with base weights
  const weights: Record<ContentType, number> = {} as Record<ContentType, number>;

  for (const [type, config] of Object.entries(CONTENT_TYPE_CONFIG)) {
    weights[type as ContentType] = config.weight;
  }

  // Apply goal-based adjustments
  for (const goal of primaryGoals) {
    const normalizedGoal = goal.toLowerCase();
    const adjustment = GOAL_ADJUSTMENTS[normalizedGoal];

    if (adjustment) {
      for (const [type, boost] of Object.entries(adjustment.contentTypeBoosts)) {
        weights[type as ContentType] = (weights[type as ContentType] || 0) + boost;
      }
    }
  }

  // Normalize weights to sum to 1
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  for (const type of Object.keys(weights)) {
    weights[type as ContentType] = weights[type as ContentType] / totalWeight;
  }

  return weights;
}

/**
 * Select content type for a specific day based on psychology and weights
 */
export function selectContentTypeForDay(
  dayOfWeek: string,
  usedTypes: ContentType[],
  adjustedWeights: Record<ContentType, number>,
  contentTypeCounts: Record<ContentType, number>,
  totalPosts: number
): ContentType {
  const dayPsych = DAY_PSYCHOLOGY[dayOfWeek.toLowerCase()];

  if (!dayPsych) {
    // Fallback to educational
    return 'educational';
  }

  // Get preferred types for this day
  const preferredTypes = [...dayPsych.primaryTypes, ...dayPsych.secondaryTypes];

  // Calculate how many of each type we should have had by now
  const targetCounts: Record<ContentType, number> = {} as Record<ContentType, number>;
  for (const [type, weight] of Object.entries(adjustedWeights)) {
    targetCounts[type as ContentType] = Math.round(weight * totalPosts);
  }

  // Find types that are under their target and preferred for this day
  const underrepresented = preferredTypes.filter(type => {
    const current = contentTypeCounts[type] || 0;
    const target = targetCounts[type] || 0;
    return current < target;
  });

  if (underrepresented.length > 0) {
    // Weighted random from underrepresented
    const typeWeights = underrepresented.map(type => ({
      type,
      weight: adjustedWeights[type] || 0.1,
    }));

    const totalWeight = typeWeights.reduce((sum, tw) => sum + tw.weight, 0);
    let random = Math.random() * totalWeight;

    for (const tw of typeWeights) {
      random -= tw.weight;
      if (random <= 0) {
        return tw.type;
      }
    }

    return underrepresented[0];
  }

  // Fallback: pick from primary types for this day
  return dayPsych.primaryTypes[Math.floor(Math.random() * dayPsych.primaryTypes.length)];
}

/**
 * Generate a topic suggestion based on content type and industry themes
 */
export function generateTopicSuggestion(
  contentType: ContentType,
  pillarTopics: string[],
  industryThemes: Record<string, string[]> | null,
  companyIndustry: string | null
): string {
  // If we have pillar topics, use those
  if (pillarTopics.length > 0) {
    const randomTopic = pillarTopics[Math.floor(Math.random() * pillarTopics.length)];
    return `${randomTopic} (${contentType})`;
  }

  // If we have industry themes, use those
  if (industryThemes) {
    const themeKeys = Object.keys(industryThemes);
    if (themeKeys.length > 0) {
      const randomThemeKey = themeKeys[Math.floor(Math.random() * themeKeys.length)];
      const themes = industryThemes[randomThemeKey];
      if (themes && themes.length > 0) {
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];
        return `${randomTheme} (${contentType})`;
      }
    }
  }

  // Fallback generic topics by content type
  const genericTopics: Record<ContentType, string[]> = {
    educational: ['Industry best practices', 'Common mistakes to avoid', 'Expert insights'],
    tips: ['Quick wins', 'Pro tips', 'How to improve'],
    engagement: ['Your thoughts on...', 'What would you do?', 'Share your experience'],
    community: ['Community spotlight', 'Success stories', 'Member achievements'],
    behindTheScenes: ['Team culture', 'How we work', 'A day in the life'],
    caseStudy: ['Client success story', 'Project showcase', 'Results achieved'],
    testimonial: ['Customer feedback', 'Client testimonial', 'Success story'],
    promotional: ['Service highlight', 'Special offer', 'Why choose us'],
    motivational: ['Monday motivation', 'Success mindset', 'Overcoming challenges'],
    news: ['Industry update', 'Trend analysis', 'Market insights'],
  };

  const topics = genericTopics[contentType] || ['General industry content'];
  return `${topics[Math.floor(Math.random() * topics.length)]} for ${companyIndustry || 'business'}`;
}

/**
 * Main function: Generate a week's content schedule with psychology-based content types
 * 
 * FIXED: Now properly handles:
 * - preferredTimes as ["morning", "afternoon"] array format
 * - Timezone conversion (stores UTC but respects company timezone)
 * - Proper time slot to actual time mapping
 */
export function generateWeeklyContentMix(
  postsPerWeek: number,
  preferredDays: string[],
  preferredTimes: string[] | Record<string, string[]> | null,
  primaryGoals: string[],
  pillarTopics: string[],
  industryThemes: Record<string, string[]> | null,
  companyIndustry: string | null,
  learnedBestPillars?: Record<string, number> | null,
  timezone: string = 'Africa/Johannesburg'
): ContentMixResult {
  const slots: ScheduledSlot[] = [];
  const mixBreakdown: Record<ContentType, number> = {} as Record<ContentType, number>;
  const funnelBreakdown: Record<FunnelStage, number> = {
    awareness: 0,
    interest: 0,
    consideration: 0,
    conversion: 0,
  };
  const contentTypeCounts: Record<ContentType, number> = {} as Record<ContentType, number>;

  // Calculate adjusted weights based on goals
  const adjustedWeights = calculateAdjustedWeights(primaryGoals, learnedBestPillars);

  // FIXED: Use scheduling-utils to properly normalize preferredTimes
  // This handles both ["morning", "afternoon"] and { "monday": ["09:00"] } formats
  const normalizedTimes = normalizePreferredTimes(preferredTimes, preferredDays);
  
  console.log('[ContentStrategy] Normalized times:', JSON.stringify(normalizedTimes));
  console.log('[ContentStrategy] Timezone:', timezone);

  // Get upcoming 7 days
  const today = new Date();
  const upcomingDays: Date[] = [];

  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    date.setHours(0, 0, 0, 0);
    upcomingDays.push(date);
  }

  // Filter to preferred days
  const dayNames = DAY_ORDER;
  const normalizedPreferredDays = preferredDays.map(d => d.toLowerCase());

  let validDays = upcomingDays.filter(date => {
    const dayName = dayNames[date.getDay()];
    return normalizedPreferredDays.length === 0 || normalizedPreferredDays.includes(dayName);
  });

  // Fallback to weekdays if no valid days
  if (validDays.length === 0) {
    validDays = upcomingDays.filter(date => {
      const day = date.getDay();
      return day >= 1 && day <= 5;
    });
  }

  // Distribute posts across days
  const usedTypes: ContentType[] = [];
  let dayIndex = 0;
  const timeIndexByDay: Record<string, number> = {};

  for (let postNum = 0; postNum < postsPerWeek; postNum++) {
    const date = validDays[dayIndex % validDays.length];
    const dayName = dayNames[date.getDay()];

    // FIXED: Get times for this day from normalized times
    const timesForDay = normalizedTimes[dayName] || DEFAULT_POSTING_TIMES;
    const timeIndex = timeIndexByDay[dayName] || 0;
    const time = timesForDay[timeIndex % timesForDay.length];
    timeIndexByDay[dayName] = timeIndex + 1;

    // Select content type based on day psychology and balance
    const contentType = selectContentTypeForDay(
      dayName,
      usedTypes,
      adjustedWeights,
      contentTypeCounts,
      postsPerWeek
    );

    usedTypes.push(contentType);
    contentTypeCounts[contentType] = (contentTypeCounts[contentType] || 0) + 1;

    // Get config for this content type
    const typeConfig = CONTENT_TYPE_CONFIG[contentType];
    const dayPsych = DAY_PSYCHOLOGY[dayName];

    // Generate topic suggestion
    const topicSuggestion = generateTopicSuggestion(
      contentType,
      pillarTopics,
      industryThemes,
      companyIndustry
    );

    // FIXED: Use createScheduledDate for proper timezone handling
    // This converts the local time to UTC for storage
    const scheduledDate = createScheduledDate(date, time, timezone);

    console.log(`[ContentStrategy] Slot ${postNum + 1}: ${dayName} ${time} ${timezone} → UTC: ${scheduledDate.toISOString()}`);

    slots.push({
      date: scheduledDate,
      time,
      dayOfWeek: dayName,
      contentType,
      funnelStage: typeConfig.funnelStage,
      toneGuidance: dayPsych?.toneAdjustment || 'Professional and engaging',
      topicSuggestion,
    });

    // Update breakdowns
    mixBreakdown[contentType] = (mixBreakdown[contentType] || 0) + 1;
    funnelBreakdown[typeConfig.funnelStage]++;

    dayIndex++;
  }

  return {
    slots,
    mixBreakdown,
    funnelBreakdown,
  };
}

/**
 * Get prompt enhancement for a specific content type
 */
export function getContentTypePromptEnhancement(
  contentType: ContentType,
  dayOfWeek: string,
  funnelStage: FunnelStage,
  companyGoals: string[]
): string {
  const typeConfig = CONTENT_TYPE_CONFIG[contentType];
  const dayPsych = DAY_PSYCHOLOGY[dayOfWeek.toLowerCase()];

  let enhancement = `
**CONTENT TYPE: ${contentType.toUpperCase()}**
Purpose: ${typeConfig.purpose}
Funnel Stage: ${funnelStage.toUpperCase()} - `;

  switch (funnelStage) {
    case 'awareness':
      enhancement += 'Goal is to attract and educate. No hard selling. Build trust and authority.';
      break;
    case 'interest':
      enhancement += 'Goal is to engage and build relationship. Create connection and community.';
      break;
    case 'consideration':
      enhancement += 'Goal is to provide proof and build confidence. Show results and testimonials.';
      break;
    case 'conversion':
      enhancement += 'Goal is to drive action. Clear call-to-action but still valuable content.';
      break;
  }

  enhancement += `

**CONTENT GUIDANCE:**
${typeConfig.promptContext}

**HOOK STYLE:**
${typeConfig.hookStyle}

**DAY CONTEXT (${dayOfWeek}):**
Mood: ${dayPsych?.mood || 'professional'}
${dayPsych?.toneAdjustment || 'Keep it professional and engaging.'}
`;

  if (companyGoals.length > 0) {
    enhancement += `
**COMPANY GOALS TO SUPPORT:**
${companyGoals.map(g => `- ${g}`).join('\n')}
`;
  }

  return enhancement;
}