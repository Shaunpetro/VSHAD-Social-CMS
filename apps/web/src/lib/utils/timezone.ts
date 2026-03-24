// apps/web/src/lib/utils/timezone.ts

/**
 * Timezone utilities for converting between local times and UTC
 * 
 * The app stores all times in UTC in the database.
 * User-facing times should be displayed/input in the company's configured timezone.
 */

// Timezone offsets in minutes (positive = ahead of UTC)
const TIMEZONE_OFFSETS: Record<string, number> = {
    'Africa/Johannesburg': 120,  // UTC+2 (SAST) - No DST
    'Africa/Cairo': 120,         // UTC+2
    'Africa/Lagos': 60,          // UTC+1
    'Africa/Nairobi': 180,       // UTC+3
    'Europe/London': 0,          // UTC+0 (Note: doesn't handle DST)
    'Europe/Paris': 60,          // UTC+1
    'Europe/Berlin': 60,         // UTC+1
    'America/New_York': -300,    // UTC-5 (EST)
    'America/Chicago': -360,     // UTC-6 (CST)
    'America/Denver': -420,      // UTC-7 (MST)
    'America/Los_Angeles': -480, // UTC-8 (PST)
    'America/Sao_Paulo': -180,   // UTC-3
    'Asia/Dubai': 240,           // UTC+4
    'Asia/Singapore': 480,       // UTC+8
    'Asia/Tokyo': 540,           // UTC+9
    'Asia/Shanghai': 480,        // UTC+8
    'Asia/Kolkata': 330,         // UTC+5:30
    'Australia/Sydney': 600,     // UTC+10
    'Australia/Perth': 480,      // UTC+8
    'Pacific/Auckland': 720,     // UTC+12
    'UTC': 0,
  };
  
  /**
   * Get the offset in minutes for a timezone
   * Returns 0 (UTC) if timezone is not recognized
   */
  export function getTimezoneOffset(timezone: string): number {
    // First try exact match
    if (TIMEZONE_OFFSETS[timezone] !== undefined) {
      return TIMEZONE_OFFSETS[timezone];
    }
    
    // Try case-insensitive match
    const lowerTimezone = timezone.toLowerCase();
    for (const [tz, offset] of Object.entries(TIMEZONE_OFFSETS)) {
      if (tz.toLowerCase() === lowerTimezone) {
        return offset;
      }
    }
    
    // Default to UTC if not found
    console.warn(`[Timezone] Unknown timezone: ${timezone}, defaulting to UTC`);
    return 0;
  }
  
  /**
   * Convert a local time to UTC
   * 
   * @param dateStr - Date in YYYY-MM-DD format
   * @param timeStr - Time in HH:MM format (24-hour)
   * @param timezone - IANA timezone name (e.g., "Africa/Johannesburg")
   * @returns Date object in UTC
   * 
   * @example
   * // 09:10 SAST → 07:10 UTC
   * localToUTC("2026-03-24", "09:10", "Africa/Johannesburg")
   * // Returns: Date representing 2026-03-24T07:10:00.000Z
   */
  export function localToUTC(dateStr: string, timeStr: string, timezone: string): Date {
    const offsetMinutes = getTimezoneOffset(timezone);
    
    // Parse the date and time
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Create date in UTC first (using Date.UTC to avoid local timezone issues)
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
    
    // Subtract the timezone offset to convert from local to UTC
    // If timezone is UTC+2, local 09:10 = UTC 07:10, so we subtract 2 hours (120 min)
    const utcTime = utcDate.getTime() - (offsetMinutes * 60 * 1000);
    
    return new Date(utcTime);
  }
  
  /**
   * Convert a UTC date to local time in a specific timezone
   * 
   * @param utcDate - Date object in UTC
   * @param timezone - IANA timezone name
   * @returns Date object adjusted to local time (still technically UTC but representing local time)
   */
  export function utcToLocal(utcDate: Date, timezone: string): Date {
    const offsetMinutes = getTimezoneOffset(timezone);
    const localTime = utcDate.getTime() + (offsetMinutes * 60 * 1000);
    return new Date(localTime);
  }
  
  /**
   * Format a UTC date for display in local timezone
   * 
   * @param utcDate - Date object in UTC
   * @param timezone - IANA timezone name
   * @returns Formatted string "YYYY-MM-DD HH:MM"
   */
  export function formatLocalDateTime(utcDate: Date, timezone: string): string {
    const localDate = utcToLocal(utcDate, timezone);
    
    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(localDate.getUTCDate()).padStart(2, '0');
    const hours = String(localDate.getUTCHours()).padStart(2, '0');
    const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
  
  /**
   * Format just the time portion in local timezone
   */
  export function formatLocalTime(utcDate: Date, timezone: string): string {
    const localDate = utcToLocal(utcDate, timezone);
    const hours = String(localDate.getUTCHours()).padStart(2, '0');
    const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  /**
   * Format just the date portion in local timezone
   */
  export function formatLocalDate(utcDate: Date, timezone: string): string {
    const localDate = utcToLocal(utcDate, timezone);
    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(localDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  /**
   * Get current time in a specific timezone
   */
  export function getCurrentTimeInTimezone(timezone: string): Date {
    return utcToLocal(new Date(), timezone);
  }
  
  /**
   * Check if a UTC date is in the past
   */
  export function isInPast(utcDate: Date): boolean {
    return utcDate.getTime() < Date.now();
  }
  
  /**
   * Get supported timezones list
   */
  export function getSupportedTimezones(): string[] {
    return Object.keys(TIMEZONE_OFFSETS).sort();
  }