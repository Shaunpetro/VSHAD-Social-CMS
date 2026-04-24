// apps/web/src/lib/ai/schedule-optimizer.ts

/**
 * SCHEDULE OPTIMIZER
 * Generates optimal posting schedules based on preferences, performance, and psychology
 * 
 * FIXED: Now properly handles:
 * - preferredTimes as ["morning", "afternoon"] array format
 * - Timezone conversion for proper UTC storage
 */

import {
    normalizePreferredTimes,
    createScheduledDate,
    DAY_ORDER,
    DEFAULT_POSTING_TIMES,
  } from '@/lib/scheduling-utils';
  import {
    CompanyWithIntelligence,
    GenerationPeriod,
    PlatformStats,
    DAY_CONTENT_PSYCHOLOGY,
  } from './types';
  import { ContentMixRecommendation } from './content-mix';
  
  // ============================================
  // TYPES
  // ============================================
  
  export interface ScheduleSlot {
    dayOfWeek: string;
    date: Date;
    time: string;
    platform: string;
    contentType: string;
    topic: string | null;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
  }
  
  export interface ScheduleRecommendation {
    slots: ScheduleSlot[];
    platformSchedules: Record<string, ScheduleSlot[]>;
    optimizationNotes: string[];
  }
  
  // ============================================
  // MAIN FUNCTION
  // ============================================
  
  export function calculateOptimalSchedule(
    company: CompanyWithIntelligence,
    contentMix: ContentMixRecommendation,
    period: GenerationPeriod,
    startDate: Date = new Date()
  ): ScheduleRecommendation {
    const intel = company.intelligence;
    const optimizationNotes: string[] = [];
    const slots: ScheduleSlot[] = [];
  
    if (!intel) {
      return { slots: [], platformSchedules: {}, optimizationNotes: ['No intelligence data available'] };
    }
  
    // Get preferred days or use learned best days
    let preferredDays = intel.preferredDays || [];
    if (intel.learnedBestDays && intel.learnedBestDays.length > 0) {
      preferredDays = intel.learnedBestDays;
      optimizationNotes.push('Using learned best days from performance data');
    }
    if (preferredDays.length === 0) {
      preferredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      optimizationNotes.push('Using default weekday schedule');
    }
  
    // FIXED: Normalize preferred times using scheduling-utils
    // This handles both ["morning", "afternoon"] and { "monday": ["09:00"] } formats
    let normalizedTimes = normalizePreferredTimes(intel.preferredTimes, preferredDays);
    
    // Override with learned best times if available
    if (intel.learnedBestTimes && Object.keys(intel.learnedBestTimes).length > 0) {
      normalizedTimes = intel.learnedBestTimes;
      optimizationNotes.push('Using learned optimal posting times');
    }
  
    const timezone = intel.timezone || 'Africa/Johannesburg';
  
    console.log('[ScheduleOptimizer] Preferred days:', preferredDays);
    console.log('[ScheduleOptimizer] Normalized times:', JSON.stringify(normalizedTimes));
    console.log('[ScheduleOptimizer] Timezone:', timezone);
  
    // Get connected platforms
    const connectedPlatforms = company.platforms.filter(p => p.isConnected);
    const platformPerf = intel.platformPerformance as Record<string, PlatformStats> | null;
  
    // Initialize platform schedules
    const platformSchedules: Record<string, ScheduleSlot[]> = {};
    for (const platform of connectedPlatforms) {
      platformSchedules[platform.type] = [];
    }
  
    if (connectedPlatforms.length === 0) {
      optimizationNotes.push('No connected platforms');
      return { slots: [], platformSchedules, optimizationNotes };
    }
  
    // Determine period length in days
    const periodDays = period === 'weekly' ? 7 : period === 'biweekly' ? 14 : 30;
  
    // Create content type queue from mix
    const contentQueue: { type: string; count: number; suggestedTopics: string[] }[] = [];
    for (const [type, item] of Object.entries(contentMix.mix)) {
      contentQueue.push({ type, count: item.count, suggestedTopics: item.suggestedTopics || [] });
    }
  
    // Sort days to maintain order
    const sortedDays = [...preferredDays].map(d => d.toLowerCase());
  
    // Generate schedule
    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    
    let contentIndex = 0;
    const totalPosts = contentMix.totalPosts;
    const usedTopics: string[] = [];
  
    for (let day = 0; day < periodDays && slots.length < totalPosts; day++) {
      // Get day name (Sunday = 0)
      const dayIndex = currentDate.getDay();
      const dayOfWeek = DAY_ORDER[dayIndex];
  
      // Check if this is a preferred day
      if (sortedDays.includes(dayOfWeek)) {
        // FIXED: Get times for this day from normalized times
        const timesForDay = normalizedTimes[dayOfWeek] || DEFAULT_POSTING_TIMES;
  
        for (const time of timesForDay) {
          if (slots.length >= totalPosts) break;
  
          // Get next content type with remaining count
          while (contentIndex < contentQueue.length && contentQueue[contentIndex].count <= 0) {
            contentIndex++;
          }
          
          // Reset if we've used all content types
          if (contentIndex >= contentQueue.length) {
            contentIndex = 0;
            // Reset counts proportionally
            for (const item of contentQueue) {
              if (item.count <= 0) item.count = 1;
            }
          }
          
          if (contentQueue[contentIndex].count <= 0) break;
  
          const contentType = contentQueue[contentIndex].type;
          const suggestedTopics = contentQueue[contentIndex].suggestedTopics;
          contentQueue[contentIndex].count--;
  
          // Select platform (round-robin)
          const platformIndex = slots.length % connectedPlatforms.length;
          const platform = connectedPlatforms[platformIndex];
  
          // Get topic (avoid recently used)
          const unusedTopics = suggestedTopics.filter(t => !usedTopics.includes(t.toLowerCase()));
          const topic = unusedTopics[0] || suggestedTopics[0] || null;
          if (topic) usedTopics.push(topic.toLowerCase());
  
          // Determine confidence based on data availability
          let confidence: 'high' | 'medium' | 'low' = 'medium';
          let reason = 'Scheduled based on preferences';
  
          if (intel.learnedBestDays?.includes(dayOfWeek)) {
            confidence = 'high';
            reason = `${dayOfWeek} is your best performing day`;
          }
          
          if (platformPerf?.[platform.type.toLowerCase()]?.bestTime === time) {
            confidence = 'high';
            reason = `${time} is optimal for ${platform.type}`;
          }
          
          if (!intel.learnedBestDays?.length && !platformPerf) {
            confidence = 'low';
            reason = 'Limited performance data - will optimize as you publish';
          }
  
          // Check day psychology match
          const psychologyMatch = DAY_CONTENT_PSYCHOLOGY[dayOfWeek]?.includes(contentType);
          if (psychologyMatch) {
            reason += ` • ${contentType} works well on ${dayOfWeek}s`;
          }
  
          // FIXED: Use createScheduledDate for proper timezone handling
          // This converts local time to UTC for database storage
          const scheduledDate = createScheduledDate(currentDate, time, timezone);
  
          console.log(`[ScheduleOptimizer] Slot: ${dayOfWeek} ${time} ${timezone} → UTC: ${scheduledDate.toISOString()}`);
  
          const slot: ScheduleSlot = {
            dayOfWeek,
            date: scheduledDate,
            time,
            platform: platform.type,
            contentType,
            topic,
            confidence,
            reason,
          };
  
          slots.push(slot);
          platformSchedules[platform.type].push(slot);
        }
      }
  
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
  
    optimizationNotes.push(`Generated ${slots.length} slots across ${connectedPlatforms.length} platform(s)`);
  
    return {
      slots,
      platformSchedules,
      optimizationNotes,
    };
  }