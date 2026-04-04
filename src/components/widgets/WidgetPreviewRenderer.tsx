"use client";

// Client-safe widget renderer for the editor preview.
// All widgets here must be "use client" components.
// TasksWidget is a server component (DB access), so it gets a placeholder.

import { ClockWidget } from "./ClockWidget";
import { WeatherWidget } from "./WeatherWidget";
import { CalendarWidget } from "./CalendarWidget";
import { QuotesWidget } from "./QuotesWidget";
import { PhotosWidget } from "./PhotosWidget";
import { TextWidget } from "./TextWidget";
import { CountdownWidget } from "./CountdownWidget";
import { NewsWidget } from "./NewsWidget";
import { WorldClockWidget } from "./WorldClockWidget";
import { DataFetchWidget } from "./DataFetchWidget";
import { CheckSquare } from "lucide-react";
import type { DisplayPrefs } from "@/lib/prefs";

type Widget = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config: string | null;
};

function TasksPlaceholder({ widget }: { widget: Widget }) {
  const cfg = (() => { try { return JSON.parse(widget.config || "{}"); } catch { return {}; } })();
  const listName = cfg.listName || "Tasks";
  return (
    <div className="flex flex-col h-full w-full p-4 gap-2">
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 glass bg-gradient-to-br from-green-500/20 to-transparent rounded-lg flex items-center justify-center">
          <CheckSquare size={14} className="text-green-400" />
        </div>
        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{listName}</span>
      </div>
      <div className="flex flex-col gap-1.5 flex-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-7 bg-[var(--surface-hover)] rounded-lg border border-[var(--border-color)] opacity-40 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );
}

export function WidgetPreviewRenderer({ widget, prefs }: { widget: Widget; prefs?: DisplayPrefs }) {
  switch (widget.type) {
    case "clock":
      return <ClockWidget widget={widget} timeFormat={prefs?.timeFormat ?? "12h"} />;
    case "weather":
      return <WeatherWidget widget={widget} tempUnit={prefs?.tempUnit ?? "fahrenheit"} />;
    case "calendar":
      return <CalendarWidget widget={widget} />;
    case "quotes":
      return <QuotesWidget widget={widget} />;
    case "photos":
      return <PhotosWidget widget={widget} />;
    case "text":
      return <TextWidget widget={widget} />;
    case "countdown":
      return <CountdownWidget widget={widget} />;
    case "news":
      return <NewsWidget widget={widget} />;
    case "worldclock":
      return <WorldClockWidget widget={widget} />;
    case "datafetch":
      return <DataFetchWidget widget={widget} />;
    case "tasks":
      return <TasksPlaceholder widget={widget} />;
    default:
      return (
        <div className="flex items-center justify-center h-full text-xs text-[var(--text-tertiary)] capitalize">
          {widget.type}
        </div>
      );
  }
}
