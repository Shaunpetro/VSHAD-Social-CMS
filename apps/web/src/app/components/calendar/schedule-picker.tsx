// apps/web/src/app/components/calendar/schedule-picker.tsx
"use client";

import { Calendar, Clock, Plus, Trash2, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";

interface SingleScheduleProps {
  mode: "single";
  scheduledFor: Date | null;
  onScheduleChange: (date: Date | null) => void;
}

interface BulkScheduleProps {
  mode: "bulk";
  startDate: Date | null;
  endDate: Date | null;
  postsCount: number;
  timesPerDay: string[];
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onPostsCountChange: (count: number) => void;
  onTimesPerDayChange: (times: string[]) => void;
}

type SchedulePickerProps = SingleScheduleProps | BulkScheduleProps;

export function SchedulePicker(props: SchedulePickerProps) {
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return "";
    return date.toISOString().slice(0, 16);
  };

  const formatDateOnlyForInput = (date: Date | null): string => {
    if (!date) return "";
    return date.toISOString().slice(0, 10);
  };

  if (props.mode === "single") {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          <Calendar className="inline h-4 w-4 mr-2" />
          Schedule Date & Time
        </label>
        <input
          type="datetime-local"
          value={formatDateForInput(props.scheduledFor)}
          onChange={(e) => {
            const value = e.target.value;
            props.onScheduleChange(value ? new Date(value) : null);
          }}
          min={formatDateForInput(new Date())}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm 
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
                     dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        {props.scheduledFor && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Scheduled for: {props.scheduledFor.toLocaleString()}
          </p>
        )}
      </div>
    );
  }

  // Bulk scheduling mode
  const daysDiff = props.startDate && props.endDate
    ? Math.ceil((props.endDate.getTime() - props.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <CalendarRange className="h-4 w-4" />
        Bulk Schedule Settings
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={formatDateOnlyForInput(props.startDate)}
            onChange={(e) => {
              const value = e.target.value;
              props.onStartDateChange(value ? new Date(value + "T00:00:00") : null);
            }}
            min={formatDateOnlyForInput(new Date())}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm 
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
                       dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={formatDateOnlyForInput(props.endDate)}
            onChange={(e) => {
              const value = e.target.value;
              props.onEndDateChange(value ? new Date(value + "T23:59:59") : null);
            }}
            min={formatDateOnlyForInput(props.startDate || new Date())}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm 
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
                       dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Number of Posts to Generate
        </label>
        <input
          type="number"
          min={1}
          max={50}
          value={props.postsCount}
          onChange={(e) => props.onPostsCountChange(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm 
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
                     dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          Posting Times (per day)
        </label>
        <div className="space-y-2">
          {props.timesPerDay.map((time, index) => (
            <div key={index} className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <input
                type="time"
                value={time}
                onChange={(e) => {
                  const newTimes = [...props.timesPerDay];
                  newTimes[index] = e.target.value;
                  props.onTimesPerDayChange(newTimes);
                }}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm 
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
                           dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              {props.timesPerDay.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const newTimes = props.timesPerDay.filter((_, i) => i !== index);
                    props.onTimesPerDayChange(newTimes);
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-950 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        {props.timesPerDay.length < 5 && (
          <button
            type="button"
            onClick={() => props.onTimesPerDayChange([...props.timesPerDay, "12:00"])}
            className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <Plus className="h-4 w-4" />
            Add Time Slot
          </button>
        )}
      </div>

      {props.startDate && props.endDate && daysDiff > 0 && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm">
          <p className="font-medium text-blue-700 dark:text-blue-300">
            📊 Schedule Summary
          </p>
          <p className="text-blue-600 dark:text-blue-400 mt-1">
            {props.postsCount} posts will be distributed across {daysDiff} day{daysDiff > 1 ? "s" : ""},
            with up to {props.timesPerDay.length} posting time{props.timesPerDay.length > 1 ? "s" : ""} per day.
          </p>
          <p className="text-blue-500 dark:text-blue-500 text-xs mt-1">
            Average: ~{(props.postsCount / daysDiff).toFixed(1)} posts/day
          </p>
        </div>
      )}
    </div>
  );
}