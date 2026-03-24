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
    const { summary, byPlatform, topPosts, trends, timing, aiInsights, companyName, dateRange } = data;
  
    const lines: string[] = [];
    const timestamp = new Date().toISOString().split("T")[0];
    const cleanCompanyName = companyName.replace(/,/g, "");
  
    // ========== HEADER ==========
    lines.push("ROBOSOCIAL ANALYTICS REPORT");
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Company: ${cleanCompanyName}`);
    lines.push(`Period: ${dateRange === "all" ? "All Time" : `Last ${dateRange}`}`);
    lines.push("");
  
    // ========== SUMMARY ==========
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
  
    // ========== ENGAGEMENT BREAKDOWN (PIE CHART DATA) ==========
    lines.push("=== ENGAGEMENT BREAKDOWN ===");
    lines.push("Type,Count,Percentage");
    const totalEng = summary.totals.likes + summary.totals.comments + summary.totals.shares;
    if (totalEng > 0) {
      const likesPercent = ((summary.totals.likes / totalEng) * 100).toFixed(1);
      const commentsPercent = ((summary.totals.comments / totalEng) * 100).toFixed(1);
      const sharesPercent = ((summary.totals.shares / totalEng) * 100).toFixed(1);
      lines.push(`Likes,${summary.totals.likes},${likesPercent}%`);
      lines.push(`Comments,${summary.totals.comments},${commentsPercent}%`);
      lines.push(`Shares,${summary.totals.shares},${sharesPercent}%`);
    }
    lines.push("");
  
    // ========== PLATFORM BREAKDOWN (PIE CHART DATA) ==========
    if (Object.keys(byPlatform).length > 0) {
      lines.push("=== PLATFORM BREAKDOWN ===");
      lines.push("Platform,Posts,Impressions,Likes,Comments,Shares,Engagement,Engagement Rate,% of Total Engagement");
      
      const totalPlatformEngagement = Object.values(byPlatform).reduce((sum, p) => sum + p.engagement, 0);
      
      Object.entries(byPlatform).forEach(([platform, platformData]) => {
        const engPercent = totalPlatformEngagement > 0 
          ? ((platformData.engagement / totalPlatformEngagement) * 100).toFixed(1) 
          : "0";
        lines.push(
          `${getPlatformConfig(platform).label},${platformData.posts},${platformData.impressions},${platformData.likes},${platformData.comments},${platformData.shares},${platformData.engagement},${platformData.engagementRate.toFixed(2)}%,${engPercent}%`
        );
      });
      lines.push("");
  
      // Platform engagement distribution summary
      lines.push("=== PLATFORM ENGAGEMENT DISTRIBUTION ===");
      lines.push("Platform,Engagement,Percentage");
      Object.entries(byPlatform)
        .sort((a, b) => b[1].engagement - a[1].engagement)
        .forEach(([platform, platformData]) => {
          const engPercent = totalPlatformEngagement > 0 
            ? ((platformData.engagement / totalPlatformEngagement) * 100).toFixed(1) 
            : "0";
          lines.push(`${getPlatformConfig(platform).label},${platformData.engagement},${engPercent}%`);
        });
      lines.push("");
    }
  
    // ========== BEST POSTING TIMES (HEATMAP DATA) ==========
    if (timing) {
      lines.push("=== BEST POSTING TIMES ===");
      
      if (timing.bestDay) {
        lines.push(`Best Day to Post,${timing.bestDay.day}`);
        lines.push(`Best Day Avg Engagement,${timing.bestDay.avgEngagement.toFixed(1)}`);
      }
      
      if (timing.bestHours && timing.bestHours.length > 0) {
        lines.push("");
        lines.push("Top Performing Hours:");
        lines.push("Rank,Hour,Avg Engagement,Posts");
        timing.bestHours.slice(0, 5).forEach((hour, idx) => {
          lines.push(`${idx + 1},${hour.label},${hour.avgEngagement.toFixed(1)},${hour.posts}`);
        });
      }
      lines.push("");
  
      // Day of week performance
      if (timing.byDayOfWeek && timing.byDayOfWeek.length > 0) {
        lines.push("=== PERFORMANCE BY DAY OF WEEK ===");
        lines.push("Day,Posts,Total Engagement,Avg Engagement");
        timing.byDayOfWeek.forEach((dayData) => {
          lines.push(`${dayData.day},${dayData.posts},${dayData.totalEngagement},${dayData.avgEngagement.toFixed(1)}`);
        });
        lines.push("");
      }
  
      // Hour of day performance (if available)
      if (timing.byHourOfDay && timing.byHourOfDay.length > 0) {
        lines.push("=== PERFORMANCE BY HOUR OF DAY ===");
        lines.push("Hour,Posts,Total Engagement,Avg Engagement");
        timing.byHourOfDay.forEach((hourData) => {
          lines.push(`${formatHour(hourData.hour)},${hourData.posts},${hourData.totalEngagement},${hourData.avgEngagement.toFixed(1)}`);
        });
        lines.push("");
      }
  
      // Heatmap grid data (if available)
      if (timing.heatmap && timing.heatmap.length > 0) {
        lines.push("=== POSTING HEATMAP (Day x Hour) ===");
        lines.push("Day,Hour,Posts,Avg Engagement");
        timing.heatmap.forEach((cell) => {
          lines.push(`${cell.day},${formatHour(cell.hour)},${cell.posts},${cell.avgEngagement.toFixed(1)}`);
        });
        lines.push("");
      }
    }
  
    // ========== TOP POSTS ==========
    if (topPosts.length > 0) {
      lines.push("=== TOP PERFORMING POSTS ===");
      lines.push("Rank,Platform,Likes,Comments,Shares,Total Engagement,Impressions,Engagement Rate,Content Preview");
      topPosts.forEach((post, idx) => {
        const contentClean = post.content.substring(0, 100).replace(/,/g, ";").replace(/\n/g, " ");
        const engRate = post.metrics?.engagementRate?.toFixed(2) || "0";
        lines.push(
          `${idx + 1},${post.platform?.type || "Unknown"},${post.metrics?.likes || 0},${post.metrics?.comments || 0},${post.metrics?.shares || 0},${post.metrics?.totalEngagement || 0},${post.metrics?.impressions || 0},${engRate}%,"${contentClean}"`
        );
      });
      lines.push("");
    }
  
    // ========== TRENDS ==========
    if (trends.length > 0) {
      lines.push("=== ENGAGEMENT TRENDS ===");
      lines.push("Period,Posts,Likes,Comments,Shares,Total Engagement,Impressions,Engagement Rate");
      trends.forEach((t) => {
        lines.push(`${t.label},${t.posts},${t.likes},${t.comments},${t.shares},${t.engagement},${t.impressions},${t.engagementRate.toFixed(2)}%`);
      });
      lines.push("");
    }
  
    // ========== AI INSIGHTS ==========
    if (aiInsights) {
      lines.push("=== AI-POWERED INSIGHTS ===");
      lines.push(`Generated At,${aiInsights.generatedAt}`);
      lines.push("");
      lines.push("Summary:");
      lines.push(`"${aiInsights.summary.replace(/"/g, '""')}"`);
      lines.push("");
      
      if (aiInsights.keyFindings.length > 0) {
        lines.push("Key Findings:");
        aiInsights.keyFindings.forEach((finding, idx) => {
          lines.push(`${idx + 1},"${finding.replace(/"/g, '""')}"`);
        });
        lines.push("");
      }
      
      if (aiInsights.recommendations.length > 0) {
        lines.push("Recommendations:");
        aiInsights.recommendations.forEach((rec, idx) => {
          lines.push(`${idx + 1},"${rec.replace(/"/g, '""')}"`);
        });
        lines.push("");
      }
      
      if (Object.keys(aiInsights.platformInsights).length > 0) {
        lines.push("Platform-Specific Insights:");
        Object.entries(aiInsights.platformInsights).forEach(([platform, insight]) => {
          lines.push(`${getPlatformConfig(platform).label},"${insight.replace(/"/g, '""')}"`);
        });
        lines.push("");
      }
      
      if (aiInsights.contentTips.length > 0) {
        lines.push("Content Tips:");
        aiInsights.contentTips.forEach((tip, idx) => {
          lines.push(`${idx + 1},"${tip.replace(/"/g, '""')}"`);
        });
        lines.push("");
      }
      
      if (aiInsights.timingAdvice) {
        lines.push("Timing Advice:");
        lines.push(`"${aiInsights.timingAdvice.replace(/"/g, '""')}"`);
      }
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
  
    // Calculate engagement breakdown percentages
    const totalEng = summary.totals.likes + summary.totals.comments + summary.totals.shares;
    const likesPercent = totalEng > 0 ? ((summary.totals.likes / totalEng) * 100).toFixed(1) : "0";
    const commentsPercent = totalEng > 0 ? ((summary.totals.comments / totalEng) * 100).toFixed(1) : "0";
    const sharesPercent = totalEng > 0 ? ((summary.totals.shares / totalEng) * 100).toFixed(1) : "0";
  
    // Calculate platform distribution
    const totalPlatformEngagement = Object.values(byPlatform).reduce((sum, p) => sum + p.engagement, 0);
    const platformDistribution = Object.entries(byPlatform)
      .map(([platform, platformData]) => ({
        name: getPlatformConfig(platform).label,
        engagement: platformData.engagement,
        percent: totalPlatformEngagement > 0 
          ? ((platformData.engagement / totalPlatformEngagement) * 100).toFixed(1)
          : "0",
        color: getPlatformConfig(platform).color,
      }))
      .sort((a, b) => b.engagement - a.engagement);
  
    // Generate heatmap HTML
    const generateHeatmapHTML = () => {
      if (!timing?.byDayOfWeek || timing.byDayOfWeek.length === 0) {
        return '<p style="color: #6b7280; text-align: center;">No timing data available</p>';
      }
  
      const maxEng = Math.max(...timing.byDayOfWeek.map(d => d.avgEngagement), 1);
      
      let html = '<div style="display: flex; flex-direction: column; gap: 6px;">';
      timing.byDayOfWeek.forEach(dayData => {
        const intensity = dayData.avgEngagement / maxEng;
        const barWidth = Math.max(intensity * 100, 5);
        const isTopDay = timing.bestDay?.day === dayData.day;
        
        html += `
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="width: 60px; font-size: 12px; color: #6b7280; text-align: right;">${dayData.day.slice(0, 3)}</span>
            <div style="flex: 1; height: 20px; background: #f3f4f6; border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; width: ${barWidth}%; background: rgba(59, 130, 246, ${0.4 + intensity * 0.6}); border-radius: 4px; ${isTopDay ? 'box-shadow: 0 0 0 2px #22c55e;' : ''}"></div>
            </div>
            <span style="width: 50px; font-size: 12px; text-align: right;">${dayData.avgEngagement.toFixed(1)}</span>
          </div>
        `;
      });
      html += '</div>';
      
      return html;
    };
  
    // Generate engagement breakdown pie visual
    const generateEngagementPieHTML = () => {
      if (totalEng === 0) return '<p style="color: #6b7280;">No data</p>';
      
      return `
        <div style="display: flex; align-items: center; gap: 20px;">
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 16px; height: 16px; background: #ef4444; border-radius: 4px;"></div>
              <span style="font-size: 13px;">Likes: ${summary.totals.likes.toLocaleString()} (${likesPercent}%)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 16px; height: 16px; background: #3b82f6; border-radius: 4px;"></div>
              <span style="font-size: 13px;">Comments: ${summary.totals.comments.toLocaleString()} (${commentsPercent}%)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 16px; height: 16px; background: #22c55e; border-radius: 4px;"></div>
              <span style="font-size: 13px;">Shares: ${summary.totals.shares.toLocaleString()} (${sharesPercent}%)</span>
            </div>
          </div>
        </div>
      `;
    };
  
    // Generate platform distribution visual
    const generatePlatformDistributionHTML = () => {
      if (platformDistribution.length === 0) return '<p style="color: #6b7280;">No platform data</p>';
      
      let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
      platformDistribution.forEach(p => {
        html += `
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 16px; height: 16px; background: ${p.color}; border-radius: 50%;"></div>
            <span style="width: 80px; font-size: 13px;">${p.name}</span>
            <div style="flex: 1; height: 16px; background: #f3f4f6; border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; width: ${p.percent}%; background: ${p.color}; border-radius: 4px;"></div>
            </div>
            <span style="width: 60px; font-size: 12px; text-align: right;">${p.percent}%</span>
          </div>
        `;
      });
      html += '</div>';
      return html;
    };
  
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
          .section { margin-bottom: 30px; page-break-inside: avoid; }
          .section h2 { font-size: 16px; color: #374151; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
          .section h3 { font-size: 14px; color: #4b5563; margin-bottom: 10px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
          .kpi-card { background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; }
          .kpi-card .value { font-size: 24px; font-weight: bold; color: #111827; }
          .kpi-card .label { font-size: 12px; color: #6b7280; margin-top: 4px; }
          .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .card { background: #f9fafb; padding: 15px; border-radius: 8px; }
          .card-title { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px; }
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
          .insight-box { background: #f5f3ff; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
          .insight-title { font-size: 13px; font-weight: 600; color: #6d28d9; margin-bottom: 8px; }
          .insight-list { font-size: 12px; color: #4b5563; padding-left: 16px; }
          .insight-list li { margin-bottom: 4px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; }
          @media print { 
            body { padding: 20px; } 
            .section { page-break-inside: avoid; }
          }
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
        </div>
  
        <div class="section">
          <h2>Engagement Analysis</h2>
          <div class="two-col">
            <div class="card">
              <div class="card-title">📊 Engagement Breakdown</div>
              ${generateEngagementPieHTML()}
            </div>
            <div class="card">
              <div class="card-title">📈 Platform Distribution</div>
              ${generatePlatformDistributionHTML()}
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
                <th class="text-right">Share</th>
                <th class="text-right">Eng. Rate</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(byPlatform).map(([platform, platformData]) => {
                const share = totalPlatformEngagement > 0 
                  ? ((platformData.engagement / totalPlatformEngagement) * 100).toFixed(1) 
                  : "0";
                return `
                  <tr>
                    <td>${getPlatformConfig(platform).label}</td>
                    <td class="text-right">${platformData.posts}</td>
                    <td class="text-right">${platformData.impressions.toLocaleString()}</td>
                    <td class="text-right">${platformData.engagement.toLocaleString()}</td>
                    <td class="text-right">${share}%</td>
                    <td class="text-right">
                      <span class="badge ${platformData.engagementRate >= 5 ? 'badge-green' : platformData.engagementRate >= 2 ? 'badge-yellow' : 'badge-gray'}">
                        ${platformData.engagementRate.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
  
        ${timing ? `
        <div class="section">
          <h2>Best Posting Times</h2>
          <div class="two-col">
            <div>
              ${timing.bestDay ? `
              <div class="timing-box">
                <div class="label">Best Day to Post</div>
                <div class="value">${timing.bestDay.day}</div>
                <div class="label">${timing.bestDay.avgEngagement.toFixed(1)} average engagement</div>
              </div>
              ` : ''}
              ${timing.bestHours && timing.bestHours.length > 0 ? `
              <h3>Top Performing Hours</h3>
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
            <div class="card">
              <div class="card-title">📅 Performance by Day</div>
              ${generateHeatmapHTML()}
            </div>
          </div>
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
                <span>📊 ${post.metrics?.engagementRate?.toFixed(2) || 0}% rate</span>
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}
  
        ${aiInsights ? `
        <div class="section">
          <h2>AI-Powered Insights</h2>
          <p style="margin-bottom: 15px; color: #374151; font-size: 14px;">${aiInsights.summary}</p>
          
          <div class="two-col">
            <div class="insight-box">
              <div class="insight-title">💡 Key Findings</div>
              <ul class="insight-list">
                ${aiInsights.keyFindings.map(f => `<li>${f}</li>`).join('')}
              </ul>
            </div>
            <div class="insight-box">
              <div class="insight-title">⚡ Recommendations</div>
              <ul class="insight-list">
                ${aiInsights.recommendations.map(r => `<li>${r}</li>`).join('')}
              </ul>
            </div>
          </div>
  
          ${aiInsights.contentTips.length > 0 || aiInsights.timingAdvice ? `
          <div class="two-col" style="margin-top: 15px;">
            ${aiInsights.contentTips.length > 0 ? `
            <div class="insight-box">
              <div class="insight-title">📝 Content Tips</div>
              <ul class="insight-list">
                ${aiInsights.contentTips.map(t => `<li>${t}</li>`).join('')}
              </ul>
            </div>
            ` : '<div></div>'}
            ${aiInsights.timingAdvice ? `
            <div class="insight-box">
              <div class="insight-title">⏰ Timing Advice</div>
              <p style="font-size: 13px; color: #4b5563;">${aiInsights.timingAdvice}</p>
            </div>
            ` : '<div></div>'}
          </div>
          ` : ''}
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