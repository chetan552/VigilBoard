"use client";

import { useState, useEffect } from "react";
import { Database, RefreshCw } from "lucide-react";

type Widget = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config: string | null;
};

/** Traverse a dot-path like "data.temperature.value" into a JSON object. */
function resolvePath(obj: unknown, path: string): unknown {
  if (!path.trim()) return obj;
  return path.split(".").reduce<unknown>((cur, key) => {
    if (cur == null || typeof cur !== "object") return undefined;
    return (cur as Record<string, unknown>)[key];
  }, obj);
}

function formatValue(raw: unknown, unit: string, decimals: number): string {
  if (raw == null) return "—";
  const num = Number(raw);
  if (!isNaN(num) && decimals >= 0) {
    return num.toFixed(decimals) + (unit ? ` ${unit}` : "");
  }
  return String(raw) + (unit ? ` ${unit}` : "");
}

export function DataFetchWidget({ widget }: { widget: Widget }) {
  const config = (() => { try { return JSON.parse(widget.config || "{}"); } catch { return {}; } })();

  const url: string = config.url || "";
  const path: string = config.path || "";
  const label: string = config.label || "Data";
  const unit: string = config.unit || "";
  const decimals: number = config.decimals ?? -1; // -1 = no rounding
  const refreshSec: number = config.refreshSec || 60;
  const size: string = config.size || "text-4xl";

  const [value, setValue] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) {
      setError("No URL configured");
      setLoading(false);
      return;
    }

    const BASE = refreshSec * 1000;
    const MAX = Math.min(BASE * 32, 3_600_000); // cap at 1 hour
    let delay = BASE;
    let timerId: ReturnType<typeof setTimeout>;

    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/data-fetch?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Fetch failed");
        const raw = resolvePath(json.data, path);
        if (raw === undefined) throw new Error(`Path "${path}" not found`);
        setValue(formatValue(raw, unit, decimals));
        setError(null);
        setLastUpdated(new Date());
        delay = BASE;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Fetch failed");
        delay = Math.min(delay * 2, MAX);
      } finally {
        setLoading(false);
        timerId = setTimeout(fetchData, delay);
      }
    }

    fetchData();
    return () => clearTimeout(timerId);
  }, [url, path, unit, decimals, refreshSec]);

  return (
    <div className="flex flex-col h-full w-full p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 glass bg-gradient-to-br from-violet-500/20 to-transparent rounded-lg flex items-center justify-center">
            <Database size={15} className="text-violet-400" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{label}</p>
        </div>
        {loading && <RefreshCw size={12} className="text-[var(--text-tertiary)] animate-spin" />}
      </div>

      {/* Value */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 min-h-0">
        {error ? (
          <p className="text-xs text-[var(--danger-color)] text-center px-2">{error}</p>
        ) : value == null ? (
          <div className="w-8 h-8 border-2 border-[var(--accent-teal)] border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className={`font-bold tabular-nums text-[var(--text-primary)] leading-none ${size}`}>
            {value}
          </span>
        )}
      </div>

      {/* Last updated */}
      {lastUpdated && !error && (
        <p className="text-[10px] text-[var(--text-tertiary)] text-center shrink-0 mt-2">
          Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
    </div>
  );
}
