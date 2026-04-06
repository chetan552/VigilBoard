"use client";

import { useState, useEffect } from "react";
import { Timer } from "lucide-react";

type Widget = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config: string | null;
};

function getTimeLeft(targetDate: string) {
  const now = Date.now();
  const target = new Date(targetDate).getTime();
  const diff = target - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, past: false };
}

export function CountdownWidget({ widget }: { widget: Widget }) {
  const config = widget.config ? (() => { try { return JSON.parse(widget.config!); } catch { return {}; } })() : {};
  const eventName = config.eventName || "Event";
  const targetDate = config.targetDate || "";
  const showSeconds: boolean = config.showSeconds !== false;

  const [timeLeft, setTimeLeft] = useState(() =>
    targetDate ? getTimeLeft(targetDate) : null
  );

  useEffect(() => {
    if (!targetDate) return;
    setTimeLeft(getTimeLeft(targetDate));
    const timer = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center gap-3 animate-fade-in">
        <Timer size={32} className="text-[var(--text-secondary)] opacity-40" />
        <p className="text-sm text-[var(--text-secondary)]">No event date configured</p>
      </div>
    );
  }

  if (!timeLeft) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center animate-fade-in gap-3">
      <div className="flex items-center gap-2">
        <Timer size={16} className="text-[var(--accent-teal)]" />
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          {timeLeft.past ? "Since" : "Until"}
        </p>
      </div>
      <p className="text-lg font-bold text-[var(--text-primary)] leading-tight">{eventName}</p>

      {timeLeft.past ? (
        <p className="text-2xl font-bold text-[var(--accent-teal)]">Now!</p>
      ) : (
        <div className="flex gap-3 mt-1">
          {[
            { value: timeLeft.days, label: "Days" },
            { value: timeLeft.hours, label: "Hrs" },
            { value: timeLeft.minutes, label: "Min" },
            ...(showSeconds ? [{ value: timeLeft.seconds, label: "Sec" }] : []),
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 glass rounded-xl flex items-center justify-center border border-[var(--border-color)]">
                <span className="text-2xl font-bold tabular-nums">
                  {String(value).padStart(2, "0")}
                </span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
