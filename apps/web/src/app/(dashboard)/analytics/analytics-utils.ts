// apps/web/src/app/(dashboard)/analytics/analytics-utils.ts

// ==================== TYPES ====================

export interface PlatformConnection {
    id: string;
    platform: string;
    accountName: string;
    status: string;
    companyId: string;
  }
  
  export interface AnalyticsSummary {
    totalPosts: number;
    totals: {
      likes: number;
      comments: number;
      shares: number;
      impressions: number;
    };
    totalEngagement: number;
    engagementRate: number;
    averages: {
      likesPerPost: number;
      commentsPerPost: number;
      sharesPerPost: number;
      impressionsPerPost: number;
      engagementPerPost: number;
    };
  }
  
  export interface PlatformData {
    [key: string]: {
      posts: number;
      likes: number;
      comments: number;
      shares: number;
      impressions: number;
      engagement: number;
      engagementRate: number;
    };
  }
  
  export interface TopPost {
    id: string;
    title: string | null;
    content: string;
    metrics: {
      likes: number;
      comments: number;
      shares: number;
      impressions: number;
      totalEngagement: number;
      engagementRate: number;
    };
    publishedAt: string | null;
    topic: string | null;
    platform: {
      type: string;
      name: string;
    };
  }
  
  export interface TrendData {
    period: string;
    label: string;
    posts: number;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    engagement: number;
    engagementRate: number;
  }
  
  export interface TimingData {
    byDayOfWeek: {
      day: string;
      posts: number;
      totalEngagement: number;
      avgEngagement: number;
    }[];
    byHourOfDay?: {
      hour: number;
      posts: number;
      totalEngagement: number;
      avgEngagement: number;
    }[];
    heatmap?: {
      day: string;
      hour: number;
      posts: number;
      avgEngagement: number;
    }[];
    bestDay: { day: string; avgEngagement: number } | null;
    bestHours: { hour: number; label: string; avgEngagement: number; posts: number }[];
  }
  
  export interface SyncStatus {
    totalPublished: number;
    syncable: number;
    recentlySynced: number;
    pendingSync: number;
    neverSynced: number;
    lastSyncedAt: string | null;
  }
  
  export interface AIInsights {
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    platformInsights: Record<string, string>;
    contentTips: string[];
    timingAdvice: string;
    generatedAt: string;
  }
  
  // ==================== CONSTANTS ====================
  
  export const PLATFORM_CONFIG: Record<string, { color: string; label: string }> = {
    LINKEDIN: { color: "#0A66C2", label: "LinkedIn" },
    FACEBOOK: { color: "#1877F2", label: "Facebook" },
    TWITTER: { color: "#1DA1F2", label: "Twitter" },
    INSTAGRAM: { color: "#E4405F", label: "Instagram" },
    WORDPRESS: { color: "#21759B", label: "WordPress" },
  };
  
  export const DAYS_ORDER = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  export const HOURS = Array.from({ length: 24 }, (_, i) => i);
  
  // ==================== HELPER FUNCTIONS ====================
  
  export const normalizePlatformType = (type: string | undefined): string => {
    if (!type) return "UNKNOWN";
    return type.toUpperCase();
  };
  
  export const getPlatformConfig = (type: string) => {
    const normalized = normalizePlatformType(type);
    return PLATFORM_CONFIG[normalized] || { color: "#6B7280", label: type || "Unknown" };
  };
  
  export const formatRelativeTime = (dateString: string | null): string => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };
  
  export const formatHour = (hour: number): string => {
    if (hour === 0) return "12am";
    if (hour === 12) return "12pm";
    return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
  };
  
  export const getHeatmapColor = (value: number, max: number): string => {
    if (max === 0 || value === 0) return "rgba(59, 130, 246, 0.05)";
    const intensity = Math.min(value / max, 1);
    return `rgba(59, 130, 246, ${0.1 + intensity * 0.8})`;
  };
  
  // ==================== EXPORT FUNCTIONS ====================
  
  export interface ExportData {
    summary: AnalyticsSummary;
    byPlatform: PlatformData;
    topPosts: TopPost[];
    trends: TrendData[];
    timing: TimingData | null;
    aiInsights: AIInsights | null;
    companyName: string;
    dateRange: string;
  }
  
  export const exportToCSV = (data: ExportData): void => {
    const { summary, byPlatform, topPosts, trends, timing, companyName, dateRange } = data;
  
    const lines: string[] = [];
    const timestamp = new Date().toISOString().split("T")[0];
    const cleanCompanyName = companyName.replace(/,/g, "");
  
    // Header
    lines.push("ROBOSOCIAL ANALYTICS REPORT");
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Company: ${cleanCompanyName}`);
    lines.push(`Period: ${dateRange === "all" ? "All Time" : `Last ${dateRange}`}`);
    lines.push("");
  
    // Summary section
    lines.push("=== SUMMARY ===");
    lines.push("Metric,Value");
    lines.push(`Total Posts,${summary.totalPosts}`);
    lines.push(`Total Impressions,${summary.totals.impressions}`);
    lines.push(`Total Engagement,${summary.totalEngagement}`);
    lines.push(`Engagement Rate,${summary.engagementRate.toFixed(2)}%`);
    lines.push(`Total Likes,${summary.totals.likes}`);
    lines.push(`Total Comments,${summary.totals.comments}`);
    lines.push(`Total Shares,${summary.totals.shares}`);
    lines.push(`Avg Engagement/Post,${summary.averages.engagementPerPost.toFixed(1)}`);
    lines.push(`Avg Impressions/Post,${summary.averages.impressionsPerPost.toFixed(1)}`);
    lines.push("");
  
    // Platform breakdown
    if (Object.keys(byPlatform).length > 0) {
      lines.push("=== PLATFORM BREAKDOWN ===");
      lines.push("Platform,Posts,Impressions,Likes,Comments,Shares,Engagement,Engagement Rate");
      Object.entries(byPlatform).forEach(([platform, platformData]) => {
        lines.push(
          `${getPlatformConfig(platform).label},${platformData.posts},${platformData.impressions},${platformData.likes},${platformData.comments},${platformData.shares},${platformData.engagement},${platformData.engagementRate.toFixed(2)}%`
        );
      });
      lines.push("");
    }
  
    // Top posts
    if (topPosts.length > 0) {
      lines.push("=== TOP POSTS ===");
      lines.push("Rank,Platform,Content,Likes,Comments,Shares,Engagement");
      topPosts.forEach((post, idx) => {
        const contentClean = post.content.substring(0, 100).replace(/,/g, ";").replace(/\n/g, " ");
        lines.push(
          `${idx + 1},${post.platform?.type || "Unknown"},"${contentClean}",${post.metrics?.likes || 0},${post.metrics?.comments || 0},${post.metrics?.shares || 0},${post.metrics?.totalEngagement || 0}`
        );
      });
      lines.push("");
    }
  
    // Timing data
    if (timing?.bestDay) {
      lines.push("=== BEST POSTING TIMES ===");
      lines.push(`Best Day,${timing.bestDay.day},${timing.bestDay.avgEngagement.toFixed(1)} avg engagement`);
      if (timing.bestHours && timing.bestHours.length > 0) {
        lines.push("Best Hours:");
        timing.bestHours.forEach((hour, idx) => {
          lines.push(`${idx + 1},${hour.label},${hour.avgEngagement.toFixed(1)} avg engagement`);
        });
      }
      lines.push("");
    }
  
    // Trends
    if (trends.length > 0) {
      lines.push("=== TRENDS ===");
      lines.push("Period,Posts,Impressions,Engagement,Engagement Rate");
      trends.forEach((t) => {
        lines.push(`${t.label},${t.posts},${t.impressions},${t.engagement},${t.engagementRate.toFixed(2)}%`);
      });
    }
  
    // Create and download file
    const csvContent = lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `robosocial-analytics-${cleanCompanyName.toLowerCase().replace(/\s+/g, "-")}-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  export const exportToPDF = (data: ExportData): void => {
    const { summary, byPlatform, topPosts, timing, aiInsights, companyName, dateRange } = data;
    const dateRangeLabel = dateRange === "all" ? "All Time" : `Last ${dateRange}`;
  
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analytics Report - ${companyName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1f2937; }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
          .header h1 { font-size: 24px; color: #111827; margin-bottom: 8px; }
          .header p { color: #6b7280; font-size: 14px; }
          .section { margin-bottom: 30px; }
          .section h2 { font-size: 16px; color: #374151; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
          .kpi-card { background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; }
          .kpi-card .value { font-size: 24px; font-weight: bold; color: #111827; }
          .kpi-card .label { font-size: 12px; color: #6b7280; margin-top: 4px; }
          .engagement-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
          .engagement-card { background: #f9fafb; padding: 12px; border-radius: 8px; display: flex; align-items: center; gap: 12px; }
          .engagement-card .icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; }
          .engagement-card .likes { background: #fee2e2; }
          .engagement-card .comments { background: #dbeafe; }
          .engagement-card .shares { background: #dcfce7; }
          .engagement-card .value { font-size: 20px; font-weight: bold; }
          .engagement-card .label { font-size: 12px; color: #6b7280; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; color: #374151; }
          .text-right { text-align: right; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
          .badge-green { background: #dcfce7; color: #166534; }
          .badge-yellow { background: #fef9c3; color: #854d0e; }
          .badge-gray { background: #f3f4f6; color: #6b7280; }
          .top-post { background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 10px; }
          .top-post .rank { width: 24px; height: 24px; background: #e0e7ff; color: #4f46e5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; margin-right: 10px; }
          .top-post .platform { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
          .top-post .content { font-size: 13px; color: #374151; margin-bottom: 8px; }
          .top-post .metrics { display: flex; gap: 15px; font-size: 12px; color: #6b7280; }
          .timing-box { background: #ecfdf5; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
          .timing-box .label { font-size: 12px; color: #065f46; }
          .timing-box .value { font-size: 18px; font-weight: bold; color: #047857; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; }
          @media print { body { padding: 20px; } .kpi-grid { grid-template-columns: repeat(4, 1fr); } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Analytics Report</h1>
          <p><strong>${companyName}</strong> • ${dateRangeLabel} • Generated ${new Date().toLocaleDateString()}</p>
        </div>
  
        <div class="section">
          <h2>Key Performance Indicators</h2>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="value">${summary.totals.impressions.toLocaleString()}</div>
              <div class="label">Impressions</div>
            </div>
            <div class="kpi-card">
              <div class="value">${summary.totalEngagement.toLocaleString()}</div>
              <div class="label">Engagement</div>
            </div>
            <div class="kpi-card">
              <div class="value">${summary.engagementRate.toFixed(2)}%</div>
              <div class="label">Engagement Rate</div>
            </div>
            <div class="kpi-card">
              <div class="value">${summary.totalPosts}</div>
              <div class="label">Published Posts</div>
            </div>
          </div>
          <div class="engagement-grid">
            <div class="engagement-card">
              <div class="icon likes">❤️</div>
              <div>
                <div class="value">${summary.totals.likes.toLocaleString()}</div>
                <div class="label">Likes</div>
              </div>
            </div>
            <div class="engagement-card">
              <div class="icon comments">💬</div>
              <div>
                <div class="value">${summary.totals.comments.toLocaleString()}</div>
                <div class="label">Comments</div>
              </div>
            </div>
            <div class="engagement-card">
              <div class="icon shares">🔄</div>
              <div>
                <div class="value">${summary.totals.shares.toLocaleString()}</div>
                <div class="label">Shares</div>
              </div>
            </div>
          </div>
        </div>
  
        ${Object.keys(byPlatform).length > 0 ? `
        <div class="section">
          <h2>Platform Performance</h2>
          <table>
            <thead>
              <tr>
                <th>Platform</th>
                <th class="text-right">Posts</th>
                <th class="text-right">Impressions</th>
                <th class="text-right">Engagement</th>
                <th class="text-right">Eng. Rate</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(byPlatform).map(([platform, platformData]) => `
                <tr>
                  <td>${getPlatformConfig(platform).label}</td>
                  <td class="text-right">${platformData.posts}</td>
                  <td class="text-right">${platformData.impressions.toLocaleString()}</td>
                  <td class="text-right">${platformData.engagement.toLocaleString()}</td>
                  <td class="text-right">
                    <span class="badge ${platformData.engagementRate >= 5 ? 'badge-green' : platformData.engagementRate >= 2 ? 'badge-yellow' : 'badge-gray'}">
                      ${platformData.engagementRate.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
  
        ${timing?.bestDay ? `
        <div class="section">
          <h2>Best Posting Times</h2>
          <div class="timing-box">
            <div class="label">Best Day to Post</div>
            <div class="value">${timing.bestDay.day}</div>
            <div class="label">${timing.bestDay.avgEngagement.toFixed(1)} average engagement</div>
          </div>
          ${timing.bestHours && timing.bestHours.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Hour</th>
                <th class="text-right">Avg Engagement</th>
              </tr>
            </thead>
            <tbody>
              ${timing.bestHours.slice(0, 5).map((hour, idx) => `
                <tr>
                  <td>#${idx + 1}</td>
                  <td>${hour.label}</td>
                  <td class="text-right">${hour.avgEngagement.toFixed(1)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : ''}
        </div>
        ` : ''}
  
        ${topPosts.length > 0 ? `
        <div class="section">
          <h2>Top Performing Posts</h2>
          ${topPosts.slice(0, 5).map((post, idx) => `
            <div class="top-post">
              <span class="rank">${idx + 1}</span>
              <span class="platform">${post.platform?.type || 'Unknown'}</span>
              <div class="content">${post.content.substring(0, 150)}${post.content.length > 150 ? '...' : ''}</div>
              <div class="metrics">
                <span>❤️ ${post.metrics?.likes || 0}</span>
                <span>💬 ${post.metrics?.comments || 0}</span>
                <span>🔄 ${post.metrics?.shares || 0}</span>
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}
  
        ${aiInsights ? `
        <div class="section">
          <h2>AI-Powered Insights</h2>
          <p style="margin-bottom: 15px; color: #374151;">${aiInsights.summary}</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <h3 style="font-size: 14px; margin-bottom: 10px; color: #4f46e5;">Key Findings</h3>
              <ul style="font-size: 13px; color: #6b7280; padding-left: 20px;">
                ${aiInsights.keyFindings.map(f => `<li style="margin-bottom: 5px;">${f}</li>`).join('')}
              </ul>
            </div>
            <div>
              <h3 style="font-size: 14px; margin-bottom: 10px; color: #4f46e5;">Recommendations</h3>
              <ul style="font-size: 13px; color: #6b7280; padding-left: 20px;">
                ${aiInsights.recommendations.map(r => `<li style="margin-bottom: 5px;">${r}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
        ` : ''}
  
        <div class="footer">
          Generated by RoboSocial CMS • ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;
  
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };