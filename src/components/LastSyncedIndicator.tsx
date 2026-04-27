"use client";
import { useEffect, useState } from "react";

// Subtle bottom-right pill showing how long ago the page was last rendered.
// The server passes its render timestamp; the client recomputes the age every
// few seconds so the label stays current between full refreshes.
//
// Color coding:
//   green  → fresh (< 90s)   — AutoRefresh runs every 60s by default
//   amber  → stale (1.5–10m) — refresh cycle missed
//   red    → very stale      — likely network/server issue
export function LastSyncedIndicator({ renderedAt }: { renderedAt: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  const ageSec = Math.max(0, Math.floor((now - renderedAt) / 1000));
  let label: string;
  if (ageSec < 10) label = "just now";
  else if (ageSec < 60) label = `${ageSec}s ago`;
  else if (ageSec < 3600) label = `${Math.floor(ageSec / 60)}m ago`;
  else label = `${Math.floor(ageSec / 3600)}h ago`;

  const isFresh = ageSec < 90;
  const dotColor =
    isFresh ? "bg-green-400" : ageSec < 600 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="fixed bottom-3 right-3 z-40 flex items-center gap-2 px-2.5 py-1.5 glass rounded-full text-[10px] text-[var(--text-tertiary)] opacity-40 hover:opacity-100 transition-opacity pointer-events-none">
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isFresh ? "animate-pulse" : ""}`}
      />
      <span suppressHydrationWarning>Updated {label}</span>
    </div>
  );
}
