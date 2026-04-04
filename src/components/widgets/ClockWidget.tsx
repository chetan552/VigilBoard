"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Clock as ClockIcon } from "lucide-react";

type Widget = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config: string | null;
};

function dayOfYear(d: Date) {
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
}

export function ClockWidget({ widget: _widget, timeFormat = "12h" }: { widget: Widget; timeFormat?: "12h" | "24h" }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now
    ? timeFormat === "24h"
      ? format(now, "HH:mm")
      : format(now, "h:mm")
    : "--:--";
  const ampm = now && timeFormat === "12h" ? format(now, "a") : "";

  return (
    <div className="flex flex-col h-full w-full p-8 justify-between animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 glass bg-gradient-to-br from-[var(--accent-teal)]/20 to-transparent rounded-xl flex items-center justify-center">
          <ClockIcon size={24} className="text-[var(--accent-teal)]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Live Clock</h3>
          <p className="text-xs text-[var(--text-tertiary)]">Real-time display</p>
        </div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center">
        <div suppressHydrationWarning className="font-bold text-7xl lg:text-8xl leading-none tracking-tight font-[tabular-nums] text-center drop-shadow-[0_0_10px_rgba(0,212,170,0.3)]">
          {timeStr}
          {ampm && <span suppressHydrationWarning className="text-4xl lg:text-5xl text-[var(--accent-teal)] ml-2">{ampm}</span>}
        </div>
        <div suppressHydrationWarning className="text-2xl text-gradient font-medium mt-6 text-center">
          {now ? format(now, "EEEE, MMMM d, yyyy") : ""}
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-[var(--border-color)]/30">
        <div className="flex justify-between text-sm">
          <div suppressHydrationWarning className="text-[var(--text-secondary)]">
            <span className="font-medium">Week</span> {now ? format(now, "w") : "--"}
          </div>
          <div suppressHydrationWarning className="text-[var(--text-secondary)]">
            <span className="font-medium">Day</span> {now ? dayOfYear(now) : "--"}/365
          </div>
          <div suppressHydrationWarning className="text-[var(--text-secondary)]">
            <span className="font-medium">UTC</span> {now ? format(now, "HH:mm") : "--:--"}
          </div>
        </div>
      </div>
    </div>
  );
}
