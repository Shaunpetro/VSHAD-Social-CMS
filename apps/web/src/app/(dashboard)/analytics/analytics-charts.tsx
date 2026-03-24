// apps/web/src/app/(dashboard)/analytics/analytics-charts.tsx
"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  getPlatformConfig,
  getHeatmapColor,
  formatHour,
  DAYS_ORDER,
  HOURS,
  TimingData,
  PlatformData,
} from "./analytics-utils";

// ==================== PLATFORM ICON ====================

interface PlatformIconProps {
  type: string;
  size?: number;
}

export const PlatformIcon = ({ type, size = 20 }: PlatformIconProps) => {
  const config = getPlatformConfig(type);
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold"
      style={{
        backgroundColor: config.color,
        width: size,
        height: size,
        fontSize: size * 0.4,
      }}
    >
      {(type || "?").charAt(0).toUpperCase()}
    </div>
  );
};

// ==================== ENGAGEMENT PIE CHART ====================

interface EngagementPieChartProps {
  byPlatform: PlatformData;
}

export const EngagementPieChart = ({ byPlatform }: EngagementPieChartProps) => {
  const pieData = Object.entries(byPlatform).map(([platform, data]) => ({
    name: getPlatformConfig(platform).label,
    value: data.engagement,
    fill: getPlatformConfig(platform).color,
  }));

  const totalEngagement = pieData.reduce((sum, item) => sum + item.value, 0);

  if (pieData.length === 0 || totalEngagement === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-muted-foreground">
        No engagement data available
      </div>
    );
  }

  // Custom label renderer with proper type handling
  const renderLabel = ({
    name,
    percent,
  }: {
    name?: string;
    percent?: number;
  }) => {
    if (percent === undefined) return "";
    return `${name || ""} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={renderLabel}
          labelLine={{ stroke: "#6b7280", strokeWidth: 1 }}
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value) => {
            const numValue = typeof value === "number" ? value : 0;
            return [numValue.toLocaleString(), "Engagement"];
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => <span className="text-xs">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// ==================== ENGAGEMENT BREAKDOWN PIE ====================

interface EngagementBreakdownPieProps {
  likes: number;
  comments: number;
  shares: number;
}

export const EngagementBreakdownPie = ({
  likes,
  comments,
  shares,
}: EngagementBreakdownPieProps) => {
  const pieData = [
    { name: "Likes", value: likes, fill: "#ef4444" },
    { name: "Comments", value: comments, fill: "#3b82f6" },
    { name: "Shares", value: shares, fill: "#22c55e" },
  ].filter((item) => item.value > 0);

  const total = likes + comments + shares;

  if (total === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        No engagement data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={70}
          paddingAngle={3}
          dataKey="value"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value, name) => {
            const numValue = typeof value === "number" ? value : 0;
            return [
              `${numValue.toLocaleString()} (${((numValue / total) * 100).toFixed(1)}%)`,
              name,
            ];
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => <span className="text-xs">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// ==================== POSTING HEATMAP ====================

interface PostingHeatmapProps {
  timing: TimingData | null;
}

export const PostingHeatmap = ({ timing }: PostingHeatmapProps) => {
  // Generate heatmap data
  const generateHeatmapData = () => {
    const heatmapData: { day: string; hour: number; avgEngagement: number }[] =
      [];

    // If API provides heatmap data, use it
    if (timing?.heatmap && timing.heatmap.length > 0) {
      return timing.heatmap;
    }

    // Generate from available data
    if (timing?.byDayOfWeek && timing?.bestHours) {
      const dayEngMap: Record<string, number> = {};
      timing.byDayOfWeek.forEach((d) => {
        dayEngMap[d.day] = d.avgEngagement;
      });

      const hourEngMap: Record<number, number> = {};
      timing.bestHours.forEach((h) => {
        hourEngMap[h.hour] = h.avgEngagement;
      });

      // Calculate max values for normalization
      const maxDayEng = Math.max(...Object.values(dayEngMap), 1);
      const maxHourEng = Math.max(...Object.values(hourEngMap), 1);

      DAYS_ORDER.forEach((day) => {
        HOURS.forEach((hour) => {
          const dayEng = (dayEngMap[day] || 0) / maxDayEng;
          const hourEng = (hourEngMap[hour] || 0) / maxHourEng;
          // Combine day and hour factors
          const combined = (dayEng * 0.6 + hourEng * 0.4) * maxDayEng;
          heatmapData.push({ day, hour, avgEngagement: combined });
        });
      });
    }

    return heatmapData;
  };

  const heatmapData = generateHeatmapData();
  const maxValue = Math.max(...heatmapData.map((d) => d.avgEngagement), 1);

  // Check if we have meaningful data
  const hasData =
    heatmapData.length > 0 && heatmapData.some((d) => d.avgEngagement > 0);

  if (!hasData) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Not enough data to generate heatmap
      </div>
    );
  }

  // Group by day for rendering
  const dataByDay: Record<string, { hour: number; avgEngagement: number }[]> =
    {};
  DAYS_ORDER.forEach((day) => {
    dataByDay[day] = heatmapData
      .filter((d) => d.day === day)
      .sort((a, b) => a.hour - b.hour);
  });

  // Show only key hours (every 3 hours) for cleaner display
  const displayHours = [0, 3, 6, 9, 12, 15, 18, 21];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Hour labels */}
        <div className="flex mb-1">
          <div className="w-16 shrink-0" />
          {displayHours.map((hour) => (
            <div
              key={hour}
              className="flex-1 text-center text-xs text-muted-foreground"
            >
              {formatHour(hour)}
            </div>
          ))}
        </div>

        {/* Heatmap rows */}
        {DAYS_ORDER.map((day) => (
          <div key={day} className="flex items-center mb-1">
            <div className="w-16 shrink-0 text-xs text-muted-foreground pr-2 text-right">
              {day.slice(0, 3)}
            </div>
            <div className="flex-1 flex gap-0.5">
              {dataByDay[day]?.map((cell) => (
                <div
                  key={cell.hour}
                  className="flex-1 h-6 rounded-sm transition-colors hover:ring-1 hover:ring-primary cursor-default"
                  style={{
                    backgroundColor: getHeatmapColor(cell.avgEngagement, maxValue),
                  }}
                  title={`${day} ${formatHour(cell.hour)}: ${cell.avgEngagement.toFixed(1)} avg engagement`}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
          <span>Low</span>
          <div className="flex gap-0.5">
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity) => (
              <div
                key={intensity}
                className="w-4 h-4 rounded-sm"
                style={{
                  backgroundColor: `rgba(59, 130, 246, ${0.1 + intensity * 0.8})`,
                }}
              />
            ))}
          </div>
          <span>High</span>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPACT HEATMAP (Alternative) ====================

interface CompactHeatmapProps {
  timing: TimingData | null;
}

export const CompactHeatmap = ({ timing }: CompactHeatmapProps) => {
  if (!timing?.byDayOfWeek || timing.byDayOfWeek.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No timing data available
      </div>
    );
  }

  const maxEngagement = Math.max(
    ...timing.byDayOfWeek.map((d) => d.avgEngagement),
    1
  );

  return (
    <div className="space-y-2">
      {timing.byDayOfWeek.map((dayData) => {
        const intensity = dayData.avgEngagement / maxEngagement;
        const isTopDay = timing.bestDay?.day === dayData.day;

        return (
          <div key={dayData.day} className="flex items-center gap-3">
            <span className="w-12 text-xs text-muted-foreground text-right">
              {dayData.day.slice(0, 3)}
            </span>
            <div className="flex-1 h-6 bg-secondary/30 rounded overflow-hidden">
              <div
                className={`h-full rounded transition-all ${
                  isTopDay ? "ring-2 ring-green-500" : ""
                }`}
                style={{
                  width: `${Math.max(intensity * 100, 5)}%`,
                  backgroundColor: `rgba(59, 130, 246, ${0.3 + intensity * 0.7})`,
                }}
              />
            </div>
            <span className="w-12 text-xs text-right">
              {dayData.avgEngagement.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
};