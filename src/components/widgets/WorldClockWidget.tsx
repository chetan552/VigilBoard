"use client";

import { useState, useEffect } from "react";
import { Globe } from "lucide-react";

type Widget = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config: string | null;
};

type TZEntry = { label: string; tz: string };

const DEFAULT_ZONES: TZEntry[] = [
  { label: "New York", tz: "America/New_York" },
  { label: "London", tz: "Europe/London" },
  { label: "Tokyo", tz: "Asia/Tokyo" },
];

function formatTime(tz: string, now: Date, showSeconds: boolean, use24h: boolean) {
  try {
    return now.toLocaleTimeString("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      ...(showSeconds ? { second: "2-digit" } : {}),
      hour12: !use24h,
    });
  } catch {
    return "--:--";
  }
}

function formatDay(tz: string, now: Date) {
  try {
    return now.toLocaleDateString("en-US", {
      timeZone: tz,
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function WorldClockWidget({ widget }: { widget: Widget }) {
  const config = widget.config ? (() => { try { return JSON.parse(widget.config!); } catch { return {}; } })() : {};

  let zones: TZEntry[] = DEFAULT_ZONES;
  if (config.zones && Array.isArray(config.zones) && config.zones.length > 0) {
    zones = config.zones;
  }

  const showSeconds: boolean = config.showSeconds !== false;
  const use24h: boolean = config.use24h === true;

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col h-full w-full p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <div className="w-8 h-8 glass bg-gradient-to-br from-blue-500/20 to-transparent rounded-lg flex items-center justify-center">
          <Globe size={16} className="text-blue-400" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">World Clock</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-hidden justify-center">
        {zones.map((z) => (
          <div key={z.tz} className="flex items-center justify-between px-3 py-2.5 bg-[var(--surface-hover)] rounded-xl border border-[var(--border-color)]">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{z.label}</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">{formatDay(z.tz, now)}</p>
            </div>
            <span className="text-base font-bold tabular-nums text-[var(--accent-teal)]">
              {formatTime(z.tz, now, showSeconds, use24h)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
