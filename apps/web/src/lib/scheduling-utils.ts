// apps/web/src/lib/scheduling-utils.ts

/**
 * Scheduling Utilities
 * Handles time slot mapping, timezone conversion, and date+time combination
 */

// ============================================
// TIME SLOT MAPPING
// ============================================

// Maps UI time slot names to actual times (in 24h format)
export const TIME_SLOT_TO_HOURS: Record<string, string[]> = {
    early_morning: ['06:30', '07:30', '08:30'],
    morning: ['09:00', '10:00', '11:00'],
    lunch: ['12:00', '12:30', '13:00'],
    afternoon: ['14:00', '15:00', '16:00'],
    evening: ['17:00', '18:00', '19:00'],
    night: ['20:00', '21:00', '22:00'],
  };
  
  // Default posting times if nothing is set
  export const DEFAULT_POSTING_TIMES = ['09:00', '14:00', '17:00'];
  
  // Days of week in order
  export const DAY_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // ============================================
  // TIME PARSING & CONVERSION
  // ============================================
  
  /**
   * Converts various preferredTimes formats to a normalized day → times mapping
   * 
   * Handles:
   * - New format: ["morning", "afternoon"] → slot names
   * - Old format: { "monday": ["09:00", "14:00"] } → day-specific times
   * - Null/undefined → defaults
   */
  export function normalizePreferredTimes(
    preferredTimes: unknown,
    preferredDays: string[]
  ): Record<string, string[]> {
    // Default result - each preferred day gets default times
    const normalizedDays = preferredDays.map(d => d.toLowerCase());
    const result: Record<string, string[]> = {};
    
    // Initialize with empty arrays for preferred days
    for (const day of normalizedDays.length > 0 ? normalizedDays : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']) {
      result[day] = [];
    }
  
    // Handle null/undefined
    if (!preferredTimes) {
      for (const day of Object.keys(result)) {
        result[day] = [...DEFAULT_POSTING_TIMES];
      }
      return result;
    }
  
    // Handle array of slot names: ["morning", "afternoon"]
    if (Array.isArray(preferredTimes)) {
      const times: string[] = [];
      
      for (const slot of preferredTimes) {
        if (typeof slot === 'string') {
          const slotTimes = TIME_SLOT_TO_HOURS[slot.toLowerCase()];
          if (slotTimes) {
            // Pick one time from each slot (first one)
            times.push(slotTimes[0]);
          } else if (slot.match(/^\d{1,2}:\d{2}$/)) {
            // Already a time string like "09:00"
            times.push(slot);
          }
        }
      }
  
      // Apply same times to all preferred days
      const finalTimes = times.length > 0 ? times : DEFAULT_POSTING_TIMES;
      for (const day of Object.keys(result)) {
        result[day] = [...finalTimes];
      }
      return result;
    }
  
    // Handle object format: { "monday": ["09:00", "14:00"] }
    if (typeof preferredTimes === 'object' && preferredTimes !== null) {
      const timesObj = preferredTimes as Record<string, unknown>;
      
      for (const [day, times] of Object.entries(timesObj)) {
        const dayLower = day.toLowerCase();
        if (Array.isArray(times) && times.length > 0) {
          result[dayLower] = times.map(t => String(t));
        }
      }
  
      // Fill in any missing days with defaults
      for (const day of Object.keys(result)) {
        if (!result[day] || result[day].length === 0) {
          result[day] = [...DEFAULT_POSTING_TIMES];
        }
      }
      return result;
    }
  
    // Fallback to defaults
    for (const day of Object.keys(result)) {
      result[day] = [...DEFAULT_POSTING_TIMES];
    }
    return result;
  }
  
  /**
   * Get posting times for a specific day
   */
  export function getTimesForDay(
    dayOfWeek: string,
    normalizedTimes: Record<string, string[]>
  ): string[] {
    const day = dayOfWeek.toLowerCase();
    return normalizedTimes[day] || DEFAULT_POSTING_TIMES;
  }
  
  /**
   * Convert time slot names to actual time strings
   */
  export function convertSlotsToTimes(slots: string[]): string[] {
    const times: string[] = [];
    
    for (const slot of slots) {
      const slotLower = slot.toLowerCase();
      const slotTimes = TIME_SLOT_TO_HOURS[slotLower];
      if (slotTimes) {
        times.push(slotTimes[0]); // Use first time from slot
      } else if (slot.match(/^\d{1,2}:\d{2}$/)) {
        times.push(slot);
      }
    }
    
    return times.length > 0 ? times : DEFAULT_POSTING_TIMES;
  }
  
  // ============================================
  // DATE + TIME COMBINATION
  // ============================================
  
  /**
   * Combines a date with a time string, respecting timezone
   * 
   * @param date - The date (will use year, month, day)
   * @param time - Time string in "HH:MM" format
   * @param timezone - IANA timezone string (e.g., "Africa/Johannesburg")
   * @returns Date object with correct time
   */
  export function combineDateAndTime(
    date: Date,
    time: string,
    timezone: string = 'UTC'
  ): Date {
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create a new date to avoid mutating the original
    const result = new Date(date);
    
    // Set the time in local context first
    result.setHours(hours, minutes, 0, 0);
    
    // For proper timezone handling, we'd need a library like date-fns-tz
    // For now, we'll handle common SA timezone offset manually
    if (timezone === 'Africa/Johannesburg') {
      // SAST is UTC+2, so subtract 2 hours to store as UTC
      result.setTime(result.getTime() - (2 * 60 * 60 * 1000));
    }
    
    return result;
  }
  
  /**
   * Creates a properly scheduled date with time applied
   * 
   * @param baseDate - The date to schedule on
   * @param time - Time string "HH:MM"
   * @param timezone - Company timezone
   */
  export function createScheduledDate(
    baseDate: Date,
    time: string,
    timezone: string = 'Africa/Johannesburg'
  ): Date {
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create new date at midnight
    const scheduledDate = new Date(baseDate);
    scheduledDate.setHours(0, 0, 0, 0);
    
    // Calculate timezone offset
    // Note: For production, use a proper timezone library
    const tzOffsets: Record<string, number> = {
      'Africa/Johannesburg': 2,  // UTC+2
      'UTC': 0,
      'America/New_York': -5,    // UTC-5 (or -4 DST)
      'America/Los_Angeles': -8, // UTC-8 (or -7 DST)
      'Europe/London': 0,        // UTC+0 (or +1 DST)
      'Europe/Paris': 1,         // UTC+1 (or +2 DST)
      'Asia/Singapore': 8,       // UTC+8
      'Australia/Sydney': 10,    // UTC+10 (or +11 DST)
    };
    
    const offset = tzOffsets[timezone] ?? 0;
    
    // Set time and adjust for timezone
    // We want the post to go out at the specified local time
    // So if user says "09:00 SAST", we need to store "07:00 UTC"
    const utcHours = hours - offset;
    
    scheduledDate.setUTCHours(utcHours, minutes, 0, 0);
    
    return scheduledDate;
  }
  
  /**
   * Get the next occurrence of a specific day of week from a start date
   */
  export function getNextDayOfWeek(startDate: Date, targetDay: string): Date {
    const targetIndex = DAY_ORDER.indexOf(targetDay.toLowerCase());
    if (targetIndex === -1) return new Date(startDate);
    
    const result = new Date(startDate);
    const currentDay = result.getDay();
    const daysUntilTarget = (targetIndex - currentDay + 7) % 7;
    
    // If today is the target day, move to next week
    const daysToAdd = daysUntilTarget === 0 ? 7 : daysUntilTarget;
    result.setDate(result.getDate() + daysToAdd);
    
    return result;
  }
  
  /**
   * Distribute posts across days and times
   */
  export function distributePostsAcrossSchedule(
    postCount: number,
    preferredDays: string[],
    normalizedTimes: Record<string, string[]>,
    startDate: Date,
    timezone: string
  ): Array<{ date: Date; time: string; dayOfWeek: string }> {
    const slots: Array<{ date: Date; time: string; dayOfWeek: string }> = [];
    
    const days = preferredDays.length > 0 
      ? preferredDays.map(d => d.toLowerCase())
      : ['monday', 'wednesday', 'friday'];
    
    let currentDate = new Date(startDate);
    let postIndex = 0;
    let dayTimeIndex: Record<string, number> = {};
    
    // Initialize time indices
    for (const day of days) {
      dayTimeIndex[day] = 0;
    }
    
    // Generate slots until we have enough posts
    while (slots.length < postCount) {
      const dayOfWeek = DAY_ORDER[currentDate.getDay()];
      
      if (days.includes(dayOfWeek)) {
        const timesForDay = normalizedTimes[dayOfWeek] || DEFAULT_POSTING_TIMES;
        const timeIndex = dayTimeIndex[dayOfWeek] % timesForDay.length;
        const time = timesForDay[timeIndex];
        
        const scheduledDate = createScheduledDate(currentDate, time, timezone);
        
        slots.push({
          date: scheduledDate,
          time,
          dayOfWeek,
        });
        
        dayTimeIndex[dayOfWeek]++;
        postIndex++;
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Safety check to avoid infinite loop
      if (currentDate.getTime() - startDate.getTime() > 60 * 24 * 60 * 60 * 1000) {
        break; // Max 60 days out
      }
    }
    
    return slots;
  }