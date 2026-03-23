// ═══════════════════════════════════════════════════════════════
// SHARED COMPANY TYPES
// Single source of truth for Company interface across the app
// ═══════════════════════════════════════════════════════════════

export interface Platform {
    id: string;
    type: string;
    name: string;
    isConnected: boolean;
  }
  
  export interface Company {
    id: string;
    name: string;
    website?: string | null;
    industry?: string | null;
    description?: string | null;
    logo?: string | null;
    logoUrl?: string | null; // Alias for logo (backward compatibility)
    brandVoice?: string;
    keywords?: string[];
    platforms?: Platform[];
    createdAt: string;
    _count?: {
      // From Prisma relations
      platforms?: number;
      generatedPosts?: number;
      topics?: number;
      connections?: number;
      posts?: number;
    };
  }