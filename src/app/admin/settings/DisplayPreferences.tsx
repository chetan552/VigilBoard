"use client";

import { useState, useTransition } from "react";
import { Check, Palette, Thermometer, Clock, RefreshCw, Moon, MoonStar } from "lucide-react";

export type DisplayPrefs = {
  accentColor: string;
  theme: "dark" | "darker" | "dim";
  tempUnit: "fahrenheit" | "celsius";
  timeFormat: "12h" | "24h";
  refreshInterval: number;
  nightDimEnabled: boolean;
  nightDimStart: number;
  nightDimEnd: number;
  nightDimLevel: number;
  nightDimWarmth: number;
};

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

const ACCENT_COLORS = [
  { label: "Teal",   value: "#00d4aa" },
  { label: "Blue",   value: "#3b82f6" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink",   value: "#ec4899" },
  { label: "Orange", value: "#f97316" },
  { label: "Green",  value: "#22c55e" },
  { label: "Red",    value: "#ef4444" },
  { label: "White",  value: "#e2e8f0" },
];

const THEMES = [
  { label: "Dark",   value: "dark",   bg: "#0a0a0a", surface: "#151515" },
  { label: "Darker", value: "darker", bg: "#000000", surface: "#0d0d0d" },
  { label: "Dim",    value: "dim",    bg: "#111827", surface: "#1f2937" },
];

const REFRESH_INTERVALS = [
  { label: "30s",  value: 30000 },
  { label: "1 min", value: 60000 },
  { label: "2 min", value: 120000 },
  { label: "5 min", value: 300000 },
];

interface Props {
  initial: DisplayPrefs;
  saveAction: (prefs: DisplayPrefs) => Promise<void>;
}

export function DisplayPreferences({ initial, saveAction }: Props) {
  const [prefs, setPrefs] = useState<DisplayPrefs>(initial);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const update = (patch: Partial<DisplayPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    // Apply CSS vars live for instant preview
    applyVars(next);
  };

  const handleSave = () => {
    startTransition(async () => {
      await saveAction(prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="flex flex-col gap-8">

      {/* Accent Color */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-[var(--accent-teal)]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Accent Color</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => update({ accentColor: c.value })}
              title={c.label}
              className="w-9 h-9 rounded-xl border-2 transition-all hover:scale-110 relative"
              style={{
                background: c.value,
                borderColor: prefs.accentColor === c.value ? "white" : "transparent",
                boxShadow: prefs.accentColor === c.value ? `0 0 12px ${c.value}88` : undefined,
              }}
            >
              {prefs.accentColor === c.value && (
                <Check size={14} className="absolute inset-0 m-auto text-black" strokeWidth={3} />
              )}
            </button>
          ))}
          {/* Custom color */}
          <label
            className="w-9 h-9 rounded-xl border-2 border-[var(--border-color)] overflow-hidden cursor-pointer hover:border-[var(--accent-teal)] transition-colors relative"
            title="Custom color"
            style={{ background: "conic-gradient(red,yellow,green,cyan,blue,magenta,red)" }}
          >
            <input
              type="color"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              value={prefs.accentColor}
              onChange={(e) => update({ accentColor: e.target.value })}
            />
          </label>
        </div>
      </section>

      {/* Theme */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Moon size={16} className="text-[var(--accent-teal)]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Theme</h3>
        </div>
        <div className="flex gap-3">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => update({ theme: t.value as DisplayPrefs["theme"] })}
              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                prefs.theme === t.value
                  ? "border-[var(--accent-teal)] bg-[var(--accent-teal)]/5"
                  : "border-[var(--border-color)] hover:border-[var(--accent-teal)]/50"
              }`}
            >
              <div
                className="w-full h-8 rounded-lg border border-white/10"
                style={{ background: t.bg }}
              >
                <div className="w-2/3 h-2 rounded mt-1 mx-auto" style={{ background: t.surface }} />
              </div>
              <span className="text-xs font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Temperature unit */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Thermometer size={16} className="text-[var(--accent-teal)]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Temperature Unit</h3>
        </div>
        <div className="flex gap-3">
          {(["fahrenheit", "celsius"] as const).map((unit) => (
            <button
              key={unit}
              onClick={() => update({ tempUnit: unit })}
              className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                prefs.tempUnit === unit
                  ? "border-[var(--accent-teal)] bg-[var(--accent-teal)] text-black"
                  : "border-[var(--border-color)] hover:border-[var(--accent-teal)]/50"
              }`}
            >
              {unit === "fahrenheit" ? "°F Fahrenheit" : "°C Celsius"}
            </button>
          ))}
        </div>
      </section>

      {/* Time format */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[var(--accent-teal)]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Time Format</h3>
        </div>
        <div className="flex gap-3">
          {([["12h", "12-hour (2:30 PM)"], ["24h", "24-hour (14:30)"]] as const).map(([fmt, label]) => (
            <button
              key={fmt}
              onClick={() => update({ timeFormat: fmt })}
              className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                prefs.timeFormat === fmt
                  ? "border-[var(--accent-teal)] bg-[var(--accent-teal)] text-black"
                  : "border-[var(--border-color)] hover:border-[var(--accent-teal)]/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Live screen refresh */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <RefreshCw size={16} className="text-[var(--accent-teal)]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Live Screen Auto-Refresh</h3>
        </div>
        <div className="flex gap-3">
          {REFRESH_INTERVALS.map((r) => (
            <button
              key={r.value}
              onClick={() => update({ refreshInterval: r.value })}
              className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                prefs.refreshInterval === r.value
                  ? "border-[var(--accent-teal)] bg-[var(--accent-teal)] text-black"
                  : "border-[var(--border-color)] hover:border-[var(--accent-teal)]/50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </section>

      {/* Night Dim */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <MoonStar size={16} className="text-[var(--accent-teal)]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Night Dim</h3>
        </div>

        <label className="flex items-center gap-3 px-4 py-3 bg-[var(--surface-hover)] rounded-xl border border-[var(--border-color)] cursor-pointer">
          <input
            type="checkbox"
            checked={prefs.nightDimEnabled}
            onChange={(e) => update({ nightDimEnabled: e.target.checked })}
            className="w-4 h-4 accent-[var(--accent-teal)]"
          />
          <span className="text-sm">Automatically dim the screen at night</span>
        </label>

        {prefs.nightDimEnabled && (
          <div className="flex flex-col gap-4 p-4 bg-[var(--surface-hover)] rounded-xl border border-[var(--border-color)]">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Start</label>
                <select
                  className="input"
                  value={prefs.nightDimStart}
                  onChange={(e) => update({ nightDimStart: parseInt(e.target.value) })}
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>{formatHour(h)}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">End</label>
                <select
                  className="input"
                  value={prefs.nightDimEnd}
                  onChange={(e) => update({ nightDimEnd: parseInt(e.target.value) })}
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>{formatHour(h)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Dim Level</label>
                <span className="text-xs font-mono text-[var(--text-tertiary)]">{Math.round(prefs.nightDimLevel * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={prefs.nightDimLevel}
                onChange={(e) => update({ nightDimLevel: parseFloat(e.target.value) })}
                className="w-full accent-[var(--accent-teal)]"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-tertiary)]">
                <span>Subtle</span>
                <span>Strong</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Warmth</label>
                <span className="text-xs font-mono text-[var(--text-tertiary)]">{Math.round(prefs.nightDimWarmth * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={prefs.nightDimWarmth}
                onChange={(e) => update({ nightDimWarmth: parseFloat(e.target.value) })}
                className="w-full accent-[var(--accent-teal)]"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-tertiary)]">
                <span>Cool</span>
                <span>Warm (sunset glow)</span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-tertiary)] italic">
              Dims from {formatHour(prefs.nightDimStart)} to {formatHour(prefs.nightDimEnd)} with a 30-minute crossfade at each end.
            </p>
          </div>
        )}
      </section>

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="btn btn-primary px-8 disabled:opacity-50"
        >
          {saved ? <><Check size={16} /> Saved</> : isPending ? "Saving…" : "Save Preferences"}
        </button>
        {saved && <span className="text-sm text-green-400">Changes applied</span>}
      </div>
    </div>
  );
}

function applyVars(prefs: DisplayPrefs) {
  const root = document.documentElement;
  const hex = prefs.accentColor;

  root.style.setProperty("--accent-teal", hex);
  root.style.setProperty("--accent-teal-glow", `${hex}26`);

  const theme = { dark: ["#0a0a0a", "#151515", "#202020", "#2a2a2a"], darker: ["#000000", "#0d0d0d", "#161616", "#222222"], dim: ["#111827", "#1f2937", "#283548", "#374151"] }[prefs.theme];
  root.style.setProperty("--bg-color", theme[0]);
  root.style.setProperty("--surface-color", theme[1]);
  root.style.setProperty("--surface-hover", theme[2]);
  root.style.setProperty("--border-color", theme[3]);
}
