"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Save, Layers, Settings as SettingsIcon, X as CloseIcon, Check } from "lucide-react";
import { saveWidgets, renameScreen } from "./actions";
import { InlineRenameForm } from "@/components/InlineRenameForm";
import { PhotoPicker } from "@/components/PhotoPicker";
import { WidgetPreviewRenderer } from "@/components/widgets/WidgetPreviewRenderer";
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

type Screen = {
  id: string;
  name: string;
  widgets: Widget[];
};

const GRID_COLS = 24;
const GRID_ROWS = 12;

const WIDGET_TYPES = [
  { id: 'clock', label: 'Clock', w: 6, h: 4 },
  { id: 'weather', label: 'Weather', w: 6, h: 6 },
  { id: 'calendar', label: 'Calendar', w: 8, h: 9 },
  { id: 'photos', label: 'Photos', w: 8, h: 8 },
  { id: 'quotes', label: 'Quotes', w: 10, h: 3 },
  { id: 'tasks', label: 'Task List', w: 5, h: 9 },
  { id: 'text', label: 'Free Text', w: 6, h: 3 },
  { id: 'countdown', label: 'Countdown', w: 6, h: 4 },
  { id: 'news', label: 'News Feed', w: 6, h: 6 },
  { id: 'worldclock', label: 'World Clock', w: 6, h: 6 },
  { id: 'datafetch', label: 'Data Fetch', w: 4, h: 4 },
  { id: 'bible', label: 'Bible Verse', w: 10, h: 3 },
  { id: 'chorechart', label: 'Chore Chart', w: 5, h: 8 },
  { id: 'mealplanner', label: 'Meal Planner', w: 6, h: 8 },
  { id: 'homework', label: 'Homework', w: 5, h: 8 },
];

type GoogleCalendarList = { id: string; title: string };

function isValidTimezone(tz: string): boolean {
  if (!tz.trim()) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

type TZEntry = { label: string; tz: string };

function WorldClockEditor({ widget, updateWidget }: {
  widget: Widget;
  updateWidget: (id: string, patch: Partial<Widget>) => void;
}) {
  const cfg = (() => { try { return JSON.parse(widget.config || '{}'); } catch { return {}; } })();
  const [zones, setZones] = useState<TZEntry[]>(
    cfg.zones && Array.isArray(cfg.zones) && cfg.zones.length > 0
      ? cfg.zones
      : [
          { label: 'New York', tz: 'America/New_York' },
          { label: 'London', tz: 'Europe/London' },
          { label: 'Tokyo', tz: 'Asia/Tokyo' },
        ]
  );

  const commit = (newZones: TZEntry[]) => {
    setZones(newZones);
    // Only persist rows with a valid timezone
    const valid = newZones.filter((z) => isValidTimezone(z.tz));
    if (valid.length > 0) {
      updateWidget(widget.id, { config: JSON.stringify({ ...cfg, zones: newZones }) });
    }
  };

  const updateCfg = (patch: Record<string, unknown>) =>
    updateWidget(widget.id, { config: JSON.stringify({ ...cfg, zones, ...patch }) });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Time Format</label>
          <div className="flex gap-2">
            {([['12h', '12h'], ['24h', '24h']] as const).map(([val, lbl]) => (
              <button key={val} type="button"
                onClick={() => updateCfg({ use24h: val === '24h' })}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${(cfg.use24h ? '24h' : '12h') === val ? 'bg-[var(--accent-teal)] text-black border-[var(--accent-teal)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-teal)]'}`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>
      <label className="flex items-center gap-3 px-3 py-2.5 bg-[var(--surface-hover)] rounded-xl border border-[var(--border-color)] cursor-pointer">
        <input
          type="checkbox"
          checked={cfg.showSeconds !== false}
          onChange={(e) => updateCfg({ showSeconds: e.target.checked })}
          className="w-4 h-4 accent-[var(--accent-teal)]"
        />
        <span className="text-sm">Show seconds</span>
      </label>
      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Timezones</label>
      {zones.map((z, i) => {
        const tzInvalid = z.tz.trim() !== '' && !isValidTimezone(z.tz);
        return (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex gap-2 items-center">
              <input
                className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-2 text-sm flex-1"
                placeholder="Label (e.g. New York)"
                value={z.label}
                onChange={(e) => commit(zones.map((zn, idx) => idx === i ? { ...zn, label: e.target.value } : zn))}
              />
              <input
                className={`bg-[var(--bg-color)] border rounded-xl p-2 text-sm flex-1 font-mono ${tzInvalid ? 'border-red-500/60 bg-red-500/5' : 'border-[var(--border-color)]'}`}
                placeholder="America/New_York"
                value={z.tz}
                onChange={(e) => commit(zones.map((zn, idx) => idx === i ? { ...zn, tz: e.target.value } : zn))}
              />
              <button
                type="button"
                onClick={() => commit(zones.filter((_, idx) => idx !== i))}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
              >×</button>
            </div>
            {tzInvalid && (
              <p className="text-xs text-red-400 pl-1">Invalid timezone — use IANA format, e.g. America/Chicago</p>
            )}
          </div>
        );
      })}
      {zones.length < 6 && (
        <button
          type="button"
          onClick={() => commit([...zones, { label: '', tz: '' }])}
          className="text-xs text-[var(--accent-teal)] hover:underline text-left"
        >+ Add timezone</button>
      )}
      <p className="text-xs text-[var(--text-tertiary)] italic">Use IANA timezone names, e.g. America/Chicago</p>
    </div>
  );
}

function CalendarPicker({ widget, updateWidget }: {
  widget: Widget;
  updateWidget: (id: string, patch: Partial<Widget>) => void;
}) {
  const cfg = (() => { try { return JSON.parse(widget.config || '{}'); } catch { return {}; } })();
  const [lists, setLists] = useState<GoogleCalendarList[]>([]);
  const [connected, setConnected] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/calendar/lists")
      .then((r) => r.json())
      .then((data) => {
        setLists(data.lists ?? []);
        setConnected(data.connected && !data.needsReconnect);
      })
      .catch(() => setConnected(false))
      .finally(() => setLoading(false));
  }, []);

  const currentId = cfg.calendarId || "primary";

  const handleSelect = (id: string) => {
    updateWidget(widget.id, { config: JSON.stringify({ ...cfg, calendarId: id }) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-5 h-5 border-2 border-[var(--accent-teal)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!connected || lists.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Calendar</label>
        {!connected ? (
          <p className="text-xs text-amber-400 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
            Google not connected. <a href="/admin/settings" className="underline">Connect in Settings</a> to pick a calendar.
          </p>
        ) : (
          <p className="text-xs text-[var(--text-secondary)] italic">No calendars found.</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Calendar</label>
      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
        {lists.map((list) => (
          <button
            key={list.id}
            type="button"
            onClick={() => handleSelect(list.id)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-colors ${
              currentId === list.id
                ? "border-[var(--accent-teal)] bg-[var(--accent-teal)]/10 text-[var(--accent-teal)]"
                : "border-[var(--border-color)] hover:border-[var(--accent-teal)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)]"
            }`}
          >
            <div className={`w-2 h-2 rounded-full shrink-0 ${currentId === list.id ? "bg-[var(--accent-teal)]" : "bg-[var(--text-tertiary)]"}`} />
            {list.title}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LayoutBuilder({ initialScreen, taskListNames = [], prefs }: { initialScreen: Screen; taskListNames?: string[]; prefs?: DisplayPrefs }) {
  const [widgets, setWidgets] = useState<Widget[]>(initialScreen.widgets || []);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);

  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const pointerState = useRef<{
    mode: 'drag' | 'resize';
    widgetId: string;
    startClientX: number;
    startClientY: number;
    startW: number;
    startH: number;
    startX: number;
    startY: number;
  } | null>(null);

  const getGridUnits = () => {
    if (!canvasRef.current) return { colUnit: 1, rowUnit: 1 };
    const rect = canvasRef.current.getBoundingClientRect();
    const innerW = rect.width - 16;  // p-2 = 8px each side
    const innerH = rect.height - 16;
    return {
      colUnit: (innerW + 4) / GRID_COLS,   // gap-1 = 4px
      rowUnit: (innerH + 4) / GRID_ROWS,
      rect,
    };
  };

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!pointerState.current) return;
      const { mode, widgetId, startClientX, startClientY, startW, startH, startX, startY } = pointerState.current;
      const { colUnit, rowUnit, rect } = getGridUnits() as ReturnType<typeof getGridUnits> & { rect: DOMRect };

      if (mode === 'resize') {
        const newW = Math.max(1, Math.min(GRID_COLS - startX, Math.round(startW + (e.clientX - startClientX) / colUnit)));
        const newH = Math.max(1, Math.min(GRID_ROWS - startY, Math.round(startH + (e.clientY - startClientY) / rowUnit)));
        setWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, w: newW, h: newH } : w));
      } else if (mode === 'drag' && rect) {
        // Convert pointer position to grid cell
        const offsetX = e.clientX - rect.left - 8; // subtract p-2 padding
        const offsetY = e.clientY - rect.top - 8;
        const { colUnit: cu, rowUnit: ru } = getGridUnits();
        const newX = Math.max(0, Math.min(GRID_COLS - 1, Math.floor(offsetX / cu)));
        const newY = Math.max(0, Math.min(GRID_ROWS - 1, Math.floor(offsetY / ru)));
        setWidgets(prev => prev.map(w => {
          if (w.id !== widgetId) return w;
          return {
            ...w,
            x: Math.min(newX, GRID_COLS - w.w),
            y: Math.min(newY, GRID_ROWS - w.h),
          };
        }));
      }
    };

    const onPointerUp = () => { pointerState.current = null; };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  const handleDragPointerDown = (e: React.PointerEvent, widget: Widget) => {
    // Don't start drag from buttons or resize handle
    if ((e.target as HTMLElement).closest('button, [data-resize]')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerState.current = {
      mode: 'drag',
      widgetId: widget.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startW: widget.w,
      startH: widget.h,
      startX: widget.x,
      startY: widget.y,
    };
  };

  const handleResizePointerDown = (e: React.PointerEvent, widget: Widget) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerState.current = {
      mode: 'resize',
      widgetId: widget.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startW: widget.w,
      startH: widget.h,
      startX: widget.x,
      startY: widget.y,
    };
  };

  const editingWidget = widgets.find(w => w.id === editingWidgetId);

  const findOpenPosition = (w: number, h: number): { x: number; y: number } => {
    for (let row = 0; row <= 8 - h; row++) {
      for (let col = 0; col <= 12 - w; col++) {
        const overlaps = widgets.some(existing =>
          col < existing.x + existing.w &&
          col + w > existing.x &&
          row < existing.y + existing.h &&
          row + h > existing.y
        );
        if (!overlaps) return { x: col, y: row };
      }
    }
    return { x: 0, y: 0 }; // fallback if grid is full
  };

  const addWidget = (type: string) => {
    const template = WIDGET_TYPES.find(t => t.id === type);
    if (!template) return;
    const { x, y } = findOpenPosition(template.w, template.h);
    setWidgets([...widgets, {
      id: `w-${Date.now()}`,
      type,
      x,
      y,
      w: template.w,
      h: template.h,
      config: null
    }]);
  };

  const updateWidget = (id: string, updates: Partial<Widget>) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await saveWidgets(initialScreen.id, widgets);
    setIsSaving(false);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(0), 2500);
  };


  // Generate background grid cells
  const gridCells = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      gridCells.push(
        <div 
          key={`cell-${x}-${y}`}
          className="col-span-1 row-span-1 border border-[var(--border-color)]/20 border-dashed hover:border-[var(--accent-teal)]/30 hover:bg-[var(--accent-teal-glow)]/10 transition-colors"
        />
      );
    }
  }

  return (
    <div className="flex flex-row h-full">
      {/* Settings Modal */}
      {editingWidget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="glass-strong border border-[var(--border-color)] rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            {/* Sticky header */}
            <div className="flex justify-between items-center px-8 pt-8 pb-4 shrink-0">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <SettingsIcon size={24} className="text-[var(--accent-teal)]" />
                Configure {editingWidget.type}
              </h3>
              <button onClick={() => setEditingWidgetId(null)} aria-label="Close settings" className="p-2 hover:bg-[var(--surface-hover)] rounded-xl transition-colors">
                <CloseIcon size={24} />
              </button>
            </div>
            
            {/* Scrollable body */}
            <div className="flex flex-col gap-6 text-[var(--text-primary)] overflow-y-auto px-8 pb-4 flex-1 min-h-0">
              {/* Type-Specific Fields */}
              {editingWidget.type === 'weather' && (() => {
                const cfg = (() => { try { return JSON.parse(editingWidget.config || '{}'); } catch { return {}; } })();
                const update = (patch: Record<string, unknown>) =>
                  updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, ...patch }) });
                return (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider text-left">Location (City, State/Country)</label>
                      <input
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3 text-left"
                        placeholder="Loveland, CO"
                        value={cfg.location || ''}
                        onChange={(e) => update({ location: e.target.value })}
                      />
                      <p className="text-xs text-[var(--text-tertiary)] italic">Enter a city name, e.g. "Austin, TX" or "London, UK".</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Temperature Unit</label>
                      <div className="flex gap-2">
                        {([['fahrenheit', '°F'], ['celsius', '°C']] as const).map(([val, lbl]) => (
                          <button key={val} type="button"
                            onClick={() => update({ tempUnit: val })}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${(cfg.tempUnit || '') === val ? 'bg-[var(--accent-teal)] text-black border-[var(--accent-teal)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-teal)]'}`}>
                            {lbl}
                          </button>
                        ))}
                        <button type="button"
                          onClick={() => { const c = {...cfg}; delete c.tempUnit; updateWidget(editingWidget.id, { config: JSON.stringify(c) }); }}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${!cfg.tempUnit ? 'bg-[var(--accent-teal)] text-black border-[var(--accent-teal)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-teal)]'}`}>
                          Global
                        </button>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)] italic">"Global" follows the Display Preferences setting.</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Show Sections</label>
                      <div className="flex flex-col gap-2">
                        {([
                          ['showStats', 'Wind / Humidity / Visibility'],
                          ['showForecast', '5-Day Forecast'],
                        ] as const).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-3 px-3 py-2.5 bg-[var(--surface-hover)] rounded-xl border border-[var(--border-color)] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cfg[key] !== false}
                              onChange={(e) => update({ [key]: e.target.checked })}
                              className="w-4 h-4 accent-[var(--accent-teal)]"
                            />
                            <span className="text-sm">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}

              {editingWidget.type === 'tasks' && (() => {
                const cfg = (() => { try { return JSON.parse(editingWidget.config || '{}'); } catch { return {}; } })();
                const update = (patch: Record<string, unknown>) =>
                  updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, ...patch }) });
                return (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider text-left">Task List</label>
                      <select
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3 text-left"
                        value={cfg.listName || ''}
                        onChange={(e) => update({ listName: e.target.value })}
                      >
                        <option value="" disabled>— Select a list —</option>
                        {taskListNames.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider text-left">Custom Title</label>
                      <input
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3 text-left"
                        placeholder="Defaults to list name"
                        value={cfg.title || ''}
                        onChange={(e) => update({ title: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Max Tasks</label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3"
                          placeholder="20"
                          value={cfg.maxTasks || ''}
                          onChange={(e) => update({ maxTasks: parseInt(e.target.value) || 20 })}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Sort Order</label>
                        <select
                          className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3"
                          value={cfg.sortOrder || 'newest'}
                          onChange={(e) => update({ sortOrder: e.target.value })}
                        >
                          <option value="newest">Newest first</option>
                          <option value="oldest">Oldest first</option>
                          <option value="alpha">Alphabetical</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Display</label>
                      <div className="flex flex-col gap-2">
                        {([
                          ['showHeader', 'Show header (icon + name)'],
                          ['showProgress', 'Show progress bar'],
                          ['showCompleted', 'Show completed tasks'],
                        ] as const).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-3 px-3 py-2.5 bg-[var(--surface-hover)] rounded-xl border border-[var(--border-color)] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cfg[key] !== false}
                              onChange={(e) => update({ [key]: e.target.checked })}
                              className="w-4 h-4 accent-[var(--accent-teal)]"
                            />
                            <span className="text-sm">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}

              {editingWidget.type === 'text' && (() => {
                const cfg = (() => { try { return JSON.parse(editingWidget.config || '{}'); } catch { return {}; } })();
                const currentSize = cfg.size || 'text-4xl';
                const currentAlign = cfg.align || 'text-center';
                const update = (patch: Record<string, string>) =>
                  updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, ...patch }) });
                return (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Text Content</label>
                      <textarea
                        className="input min-h-[80px] align-top"
                        placeholder="Enter your custom message here..."
                        value={cfg.text || ''}
                        onChange={(e) => update({ text: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Font Size</label>
                      <div className="flex gap-2">
                        {([['text-2xl', 'S'], ['text-4xl', 'M'], ['text-6xl', 'L'], ['text-8xl', 'XL']] as const).map(([size, label]) => (
                          <button key={size} type="button" onClick={() => update({ size })}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${currentSize === size ? 'bg-[var(--accent-teal)] text-black border-[var(--accent-teal)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-teal)]'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Alignment</label>
                      <div className="flex gap-2">
                        {([['text-left', 'Left'], ['text-center', 'Center'], ['text-right', 'Right']] as const).map(([align, label]) => (
                          <button key={align} type="button" onClick={() => update({ align })}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${currentAlign === align ? 'bg-[var(--accent-teal)] text-black border-[var(--accent-teal)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-teal)]'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}

              {editingWidget.type === 'photos' && (() => {
                const cfg = (() => { try { return JSON.parse(editingWidget.config || '{}'); } catch { return {}; } })();
                const selectedPhotos: string[] = Array.isArray(cfg.photos) ? cfg.photos : [];
                return (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Your Photos</label>
                      <PhotoPicker
                        selected={selectedPhotos}
                        onChange={(photos) => updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, photos }) })}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Fallback Theme (if no photos selected)</label>
                      <input
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3"
                        placeholder="nature, minimal, architecture"
                        value={cfg.query || ''}
                        onChange={(e) => updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, query: e.target.value }) })}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Image Fit</label>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          ['cover',   'Cover',   'Fills widget, cropped'],
                          ['contain', 'Contain', 'Full image, letterboxed'],
                          ['fill',    'Stretch', 'Stretches to fill'],
                          ['center',  'Center',  'Original size, centered'],
                        ] as const).map(([val, label, desc]) => (
                          <button key={val} type="button"
                            onClick={() => updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, fit: val }) })}
                            className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-colors ${(cfg.fit || 'cover') === val ? 'bg-[var(--accent-teal)]/10 border-[var(--accent-teal)] text-[var(--accent-teal)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-teal)]'}`}>
                            <span className="text-sm font-semibold">{label}</span>
                            <span className="text-[10px] opacity-70">{desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Slide Interval (seconds)</label>
                      <input
                        type="number"
                        min={3}
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3"
                        placeholder="15"
                        value={cfg.interval || ''}
                        onChange={(e) => updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, interval: parseInt(e.target.value) || 15 }) })}
                      />
                    </div>
                  </>
                );
              })()}

              {editingWidget.type === 'calendar' && (() => {
                const cfg = (() => { try { return JSON.parse(editingWidget.config || '{}'); } catch { return {}; } })();
                const currentSize = cfg.eventSize || 'sm';
                return (
                  <>
                    <CalendarPicker widget={editingWidget} updateWidget={updateWidget} />
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Event Text Size</label>
                      <div className="flex gap-2">
                        {([['sm', 'S'], ['md', 'M'], ['lg', 'L']] as const).map(([size, lbl]) => (
                          <button key={size} type="button"
                            onClick={() => updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, eventSize: size }) })}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${currentSize === size ? 'bg-[var(--accent-teal)] text-black border-[var(--accent-teal)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-teal)]'}`}>
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}

              {editingWidget.type === 'quotes' && (() => {
                const cfg = (() => { try { return JSON.parse(editingWidget.config || '{}'); } catch { return {}; } })();
                const update = (patch: Record<string, unknown>) =>
                  updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, ...patch }) });
                return (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Custom Quotes</label>
                      <textarea
                        className="input min-h-[120px] align-top font-mono text-sm"
                        placeholder={"Quote text — Author\nAnother quote — Someone"}
                        value={cfg.customQuotes || ''}
                        onChange={(e) => update({ customQuotes: e.target.value })}
                      />
                      <p className="text-xs text-[var(--text-tertiary)] italic">One quote per line. Format: Quote text — Author</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Quote Rotation</label>
                      <div className="flex gap-2">
                        {([['daily', 'Day of week'], ['random', 'Date-seeded']] as const).map(([val, lbl]) => (
                          <button key={val} type="button"
                            onClick={() => update({ rotationMode: val })}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${(cfg.rotationMode || 'daily') === val ? 'bg-[var(--accent-teal)] text-black border-[var(--accent-teal)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-teal)]'}`}>
                            {lbl}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)] italic">Both modes show a new quote per day. Date-seeded varies by calendar date.</p>
                    </div>
                  </>
                );
              })()}

              {editingWidget.type === 'bible' && (() => {
                const cfg = (() => { try { return JSON.parse(editingWidget.config || '{}'); } catch { return {}; } })();
                const update = (patch: Record<string, unknown>) =>
                  updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, ...patch }) });
                return (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Translation</label>
                      <select
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3"
                        value={cfg.translation || 'kjv'}
                        onChange={(e) => update({ translation: e.target.value })}
                      >
                        <option value="kjv">King James (KJV)</option>
                        <option value="asv">American Standard (ASV)</option>
                        <option value="web">World English Bible (WEB)</option>
                        <option value="bbe">Bible in Basic English (BBE)</option>
                        <option value="darby">Darby</option>
                        <option value="ylt">Young&apos;s Literal (YLT)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Custom Verses</label>
                      <textarea
                        className="input min-h-[120px] align-top font-mono text-sm"
                        placeholder={"John 3:16\nPsalm 23:1-6\nRomans 8:28"}
                        value={cfg.customVerses || ''}
                        onChange={(e) => update({ customVerses: e.target.value })}
                      />
                      <p className="text-xs text-[var(--text-tertiary)] italic">Optional. One verse per line. Leave blank to use the default 50-verse rotation.</p>
                    </div>
                  </>
                );
              })()}

              {editingWidget.type === 'chorechart' && (() => {
                const cfg = (() => { try { return JSON.parse(editingWidget.config || '{}'); } catch { return {}; } })();
                const update = (patch: Record<string, unknown>) =>
                  updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, ...patch }) });
                return (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Title</label>
                      <input
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3"
                        placeholder="Chores"
                        value={cfg.title || ''}
                        onChange={(e) => update({ title: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Filter Assignee</label>
                      <input
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3"
                        placeholder="Leave blank to show all"
                        value={cfg.filterAssignee || ''}
                        onChange={(e) => update({ filterAssignee: e.target.value })}
                      />
                      <p className="text-xs text-[var(--text-tertiary)] italic">Show chores for one person only, or leave blank for everyone.</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Group By</label>
                      <div className="flex gap-2">
                        {([['assignee', 'Assignee'], ['day', 'Day']] as const).map(([val, lbl]) => (
                          <button key={val} type="button"
                            onClick={() => update({ groupBy: val })}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${(cfg.groupBy || 'assignee') === val ? 'bg-[var(--accent-teal)] text-black border-[var(--accent-teal)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-teal)]'}`}>
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-3 px-3 py-2.5 bg-[var(--surface-hover)] rounded-xl border border-[var(--border-color)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfg.showHeader !== false}
                        onChange={(e) => update({ showHeader: e.target.checked })}
                        className="w-4 h-4 accent-[var(--accent-teal)]"
                      />
                      <span className="text-sm">Show header</span>
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-[var(--surface-hover)] rounded-xl border border-[var(--border-color)]">
                      <p className="text-xs text-[var(--text-secondary)]">Manage chores in <a href="/admin/chores" className="text-[var(--accent-teal)] underline" target="_blank">Admin → Chore Chart</a>.</p>
                    </div>
                  </>
                );
              })()}

              {editingWidget.type === 'mealplanner' && (() => {
                const cfg = (() => { try { return JSON.parse(editingWidget.config || '{}'); } catch { return {}; } })();
                const update = (patch: Record<string, unknown>) =>
                  updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, ...patch }) });
                return (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Title</label>
                      <input
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3"
                        placeholder="Meal Planner"
                        value={cfg.title || ''}
                        onChange={(e) => update({ title: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Meal Type</label>
                      <div className="flex gap-2 flex-wrap">
                        {([['dinner', 'Dinner'], ['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['all', 'All']] as const).map(([val, lbl]) => (
                          <button key={val} type="button"
                            onClick={() => update({ mealType: val })}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${(cfg.mealType || 'dinner') === val ? 'bg-[var(--accent-teal)] text-black border-[var(--accent-teal)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-teal)]'}`}>
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">View</label>
                      <div className="flex gap-2">
                        {([['week', 'Full Week'], ['today', "Today Only"]] as const).map(([val, lbl]) => (
                          <button key={val} type="button"
                            onClick={() => update({ view: val })}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${(cfg.view || 'week') === val ? 'bg-[var(--accent-teal)] text-black border-[var(--accent-teal)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-teal)]'}`}>
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-3 px-3 py-2.5 bg-[var(--surface-hover)] rounded-xl border border-[var(--border-color)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfg.showHeader !== false}
                        onChange={(e) => update({ showHeader: e.target.checked })}
                        className="w-4 h-4 accent-[var(--accent-teal)]"
                      />
                      <span className="text-sm">Show header</span>
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-[var(--surface-hover)] rounded-xl border border-[var(--border-color)]">
                      <p className="text-xs text-[var(--text-secondary)]">Plan meals in <a href="/admin/meals" className="text-[var(--accent-teal)] underline" target="_blank">Admin → Meal Planner</a>.</p>
                    </div>
                  </>
                );
              })()}

              {editingWidget.type === 'homework' && (() => {
                const cfg = (() => { try { return JSON.parse(editingWidget.config || '{}'); } catch { return {}; } })();
                const update = (patch: Record<string, unknown>) =>
                  updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, ...patch }) });
                return (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Filter Student</label>
                      <input
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3"
                        placeholder="Leave blank to show all students"
                        value={cfg.filterAssignee || ''}
                        onChange={(e) => update({ filterAssignee: e.target.value })}
                      />
                      <p className="text-xs text-[var(--text-tertiary)] italic">Show one student&apos;s assignments only, or leave blank for everyone.</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Custom Title</label>
                      <input
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3"
                        placeholder="Defaults to student name + Homework"
                        value={cfg.title || ''}
                        onChange={(e) => update({ title: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Display</label>
                      <div className="flex flex-col gap-2">
                        {([
                          ['showHeader', 'Show header'],
                          ['showCompleted', 'Show completed assignments'],
                        ] as const).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-3 px-3 py-2.5 bg-[var(--surface-hover)] rounded-xl border border-[var(--border-color)] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={key === 'showCompleted' ? cfg[key] === true : cfg[key] !== false}
                              onChange={(e) => update({ [key]: e.target.checked })}
                              className="w-4 h-4 accent-[var(--accent-teal)]"
                            />
                            <span className="text-sm">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-[var(--surface-hover)] rounded-xl border border-[var(--border-color)]">
                      <p className="text-xs text-[var(--text-secondary)]">Manage assignments in <a href="/admin/homework" className="text-[var(--accent-teal)] underline" target="_blank">Admin → Homework</a>.</p>
                    </div>
                  </>
                );
              })()}

              {editingWidget.type === 'countdown' && (() => {
                const cfg = (() => { try { return JSON.parse(editingWidget.config || '{}'); } catch { return {}; } })();
                const update = (patch: Record<string, unknown>) =>
                  updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, ...patch }) });
                return (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Event Name</label>
                      <input
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3"
                        placeholder="Summer Vacation"
                        value={cfg.eventName || ''}
                        onChange={(e) => update({ eventName: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Target Date</label>
                      <input
                        type="datetime-local"
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3"
                        value={cfg.targetDate ? cfg.targetDate.slice(0, 16) : ''}
                        onChange={(e) => update({ targetDate: e.target.value })}
                      />
                    </div>
                    <label className="flex items-center gap-3 px-3 py-2.5 bg-[var(--surface-hover)] rounded-xl border border-[var(--border-color)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfg.showSeconds !== false}
                        onChange={(e) => update({ showSeconds: e.target.checked })}
                        className="w-4 h-4 accent-[var(--accent-teal)]"
                      />
                      <span className="text-sm">Show seconds tile</span>
                    </label>
                  </>
                );
              })()}

              {editingWidget.type === 'news' && (() => {
                const cfg = (() => { try { return JSON.parse(editingWidget.config || '{}'); } catch { return {}; } })();
                const update = (patch: Record<string, unknown>) =>
                  updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, ...patch }) });
                return (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Feed Label</label>
                      <input
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3"
                        placeholder="BBC News"
                        value={cfg.label || ''}
                        onChange={(e) => update({ label: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">RSS Feed URL</label>
                      <input
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3 font-mono text-sm"
                        placeholder="https://feeds.bbci.co.uk/news/rss.xml"
                        value={cfg.feedUrl || ''}
                        onChange={(e) => update({ feedUrl: e.target.value })}
                      />
                      <p className="text-xs text-[var(--text-tertiary)] italic">Leave blank to use BBC News</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Headline Cycle (seconds)</label>
                      <input
                        type="number"
                        min={3}
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3"
                        placeholder="8"
                        value={cfg.cycleSeconds || ''}
                        onChange={(e) => update({ cycleSeconds: parseInt(e.target.value) || 8 })}
                      />
                    </div>
                  </>
                );
              })()}

              {editingWidget.type === 'worldclock' && <WorldClockEditor widget={editingWidget} updateWidget={updateWidget} />}

              {editingWidget.type === 'clock' && (() => {
                const cfg = (() => { try { return JSON.parse(editingWidget.config || '{}'); } catch { return {}; } })();
                const update = (patch: Record<string, unknown>) =>
                  updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, ...patch }) });
                return (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Time Format</label>
                      <div className="flex gap-2">
                        {([['12h', '12h'], ['24h', '24h']] as const).map(([val, lbl]) => (
                          <button key={val} type="button"
                            onClick={() => update({ timeFormat: val })}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${(cfg.timeFormat || '') === val ? 'bg-[var(--accent-teal)] text-black border-[var(--accent-teal)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-teal)]'}`}>
                            {lbl}
                          </button>
                        ))}
                        <button type="button"
                          onClick={() => { const c = {...cfg}; delete c.timeFormat; updateWidget(editingWidget.id, { config: JSON.stringify(c) }); }}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${!cfg.timeFormat ? 'bg-[var(--accent-teal)] text-black border-[var(--accent-teal)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-teal)]'}`}>
                          Global
                        </button>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)] italic">"Global" follows <a href="/admin/settings" className="text-[var(--accent-teal)] underline" target="_blank">Display Preferences</a>.</p>
                    </div>
                    <label className="flex items-center gap-3 px-3 py-2.5 bg-[var(--surface-hover)] rounded-xl border border-[var(--border-color)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfg.showFooter !== false}
                        onChange={(e) => update({ showFooter: e.target.checked })}
                        className="w-4 h-4 accent-[var(--accent-teal)]"
                      />
                      <span className="text-sm">Show footer (Week / Day / UTC)</span>
                    </label>
                  </>
                );
              })()}

              {editingWidget.type === 'datafetch' && (() => {
                const cfg = (() => { try { return JSON.parse(editingWidget.config || '{}'); } catch { return {}; } })();
                const update = (patch: Record<string, unknown>) =>
                  updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, ...patch }) });
                const currentSize = cfg.size || 'text-4xl';
                return (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">JSON URL</label>
                      <input
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3 font-mono text-sm"
                        placeholder="https://api.example.com/data.json"
                        value={cfg.url || ''}
                        onChange={(e) => update({ url: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Value Path</label>
                      <input
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3 font-mono text-sm"
                        placeholder="data.temperature.value"
                        value={cfg.path || ''}
                        onChange={(e) => update({ path: e.target.value })}
                      />
                      <p className="text-xs text-[var(--text-tertiary)] italic">Dot-notation path into the JSON response, e.g. <code>results.0.price</code></p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Label</label>
                        <input
                          className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3 text-sm"
                          placeholder="Temperature"
                          value={cfg.label || ''}
                          onChange={(e) => update({ label: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Unit</label>
                        <input
                          className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3 text-sm"
                          placeholder="°F"
                          value={cfg.unit || ''}
                          onChange={(e) => update({ unit: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Decimal Places</label>
                        <input
                          type="number"
                          min={-1}
                          max={10}
                          className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3 text-sm"
                          placeholder="-1 (auto)"
                          value={cfg.decimals ?? ''}
                          onChange={(e) => update({ decimals: e.target.value === '' ? -1 : parseInt(e.target.value) })}
                        />
                        <p className="text-xs text-[var(--text-tertiary)] italic">-1 = no rounding</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Refresh (sec)</label>
                        <input
                          type="number"
                          min={10}
                          className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3 text-sm"
                          placeholder="60"
                          value={cfg.refreshSec || ''}
                          onChange={(e) => update({ refreshSec: parseInt(e.target.value) || 60 })}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Value Size</label>
                      <div className="flex gap-2">
                        {([['text-2xl', 'S'], ['text-4xl', 'M'], ['text-6xl', 'L'], ['text-8xl', 'XL']] as const).map(([size, lbl]) => (
                          <button key={size} type="button" onClick={() => update({ size })}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${currentSize === size ? 'bg-[var(--accent-teal)] text-black border-[var(--accent-teal)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-teal)]'}`}>
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}

              {!['weather','tasks','text','photos','calendar','quotes','countdown','news','worldclock','clock','datafetch','bible','chorechart','mealplanner','homework'].includes(editingWidget.type) && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider text-left">Widget Properties (JSON Config)</label>
                  <textarea
                    className="input min-h-[100px] font-mono text-sm align-top"
                    placeholder='{"key": "value"}'
                    value={editingWidget.config || ''}
                    onChange={(e) => updateWidget(editingWidget.id, { config: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col gap-2">
                   <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider text-left">Width (Cols)</label>
                   <input 
                    type="number"
                    className="input"
                    value={editingWidget.w}
                    onChange={(e) => updateWidget(editingWidget.id, { w: parseInt(e.target.value) || 1 })}
                   />
                 </div>
                 <div className="flex flex-col gap-2">
                   <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider text-left">Height (Rows)</label>
                   <input 
                    type="number"
                    className="input"
                    value={editingWidget.h}
                    onChange={(e) => updateWidget(editingWidget.id, { h: parseInt(e.target.value) || 1 })}
                   />
                 </div>
              </div>

            </div>
            {/* Sticky footer */}
            <div className="flex gap-3 px-8 py-5 border-t border-[var(--border-color)] shrink-0">
              {confirmDeleteId === editingWidget.id ? (
                <button
                  onClick={() => {
                    removeWidget(editingWidget.id);
                    setEditingWidgetId(null);
                    setConfirmDeleteId(null);
                  }}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-all"
                >
                  Confirm Delete
                </button>
              ) : (
                <button
                  onClick={() => {
                    setConfirmDeleteId(editingWidget.id);
                    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
                    confirmTimeoutRef.current = setTimeout(() => setConfirmDeleteId(null), 3000);
                  }}
                  className="flex-1 bg-red-500/10 text-red-500 py-3 rounded-xl font-bold hover:bg-red-500/20 transition-all border border-red-500/20"
                >
                  Delete Widget
                </button>
              )}
              <button
                onClick={() => { setEditingWidgetId(null); setConfirmDeleteId(null); }}
                className="flex-1 bg-[var(--accent-teal)] text-black py-3 rounded-xl font-bold hover:bg-teal-400 transition-all shadow-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Controls */}
      <div className="w-72 border-r border-[var(--border-color)] flex flex-col overflow-hidden shrink-0" style={{ background: '#1a1a1a' }}>
        {/* Sidebar header */}
        <div className="flex flex-col gap-0 border-b border-[var(--border-color)]">
          {/* Screen name — inline editable */}
          <div className="px-4 pt-3 pb-1">
            <InlineRenameForm
              defaultValue={initialScreen.name}
              action={renameScreen.bind(null, initialScreen.id)}
              className="w-full text-sm font-semibold bg-transparent border-b border-transparent hover:border-[var(--border-color)] focus:border-[var(--accent-teal)] outline-none truncate transition-colors text-[var(--text-primary)]"
            />
          </div>
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] flex items-center gap-1.5">
            <Layers size={12} className="text-[var(--accent-teal)]" /> Elements
          </span>
          <div className="flex items-center gap-2">
            {savedAt > 0 && (
              <span className="flex items-center gap-1 text-xs text-[var(--accent-teal)]">
                <Check size={11} /> Saved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-[var(--accent-teal)] text-black rounded-md hover:bg-teal-400 disabled:opacity-50 transition-colors"
            >
              <Save size={11} /> {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {/* Add Widget section */}
          <div>
            <p className="text-[11px] uppercase font-bold text-[var(--text-tertiary)] tracking-widest mb-2.5">Add Widget</p>
            <div className="grid grid-cols-2 gap-1.5">
              {WIDGET_TYPES.map(w => (
                <button
                  key={w.id}
                  onClick={() => addWidget(w.id)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium text-[var(--text-secondary)] bg-[var(--surface-hover)] hover:text-[var(--accent-teal)] hover:bg-[var(--accent-teal-glow)] border border-[var(--border-color)] hover:border-[var(--accent-teal)] rounded-lg transition-all duration-150"
                >
                  <Plus size={11} className="shrink-0" /> {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Widgets section */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] uppercase font-bold text-[var(--text-tertiary)] tracking-widest mb-0.5">Active Widgets</p>
            {widgets.map(w => (
              <div key={w.id} className="bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-xl p-3 hover:border-[var(--accent-teal)] transition-colors">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="font-semibold text-sm capitalize text-[var(--text-primary)]">{w.type}</span>
                  <button onClick={() => removeWidget(w.id)} className="text-[var(--danger-color)] hover:bg-[var(--danger-color)]/10 p-1 rounded-md transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-[var(--text-secondary)]">
                  <label className="flex items-center justify-between">
                    <span>Col</span><input type="number" value={w.x} onChange={e => updateWidget(w.id, {x: parseInt(e.target.value)})} className="w-12 bg-[var(--surface-color)] border border-[var(--border-color)] rounded px-1.5 py-0.5 text-[var(--text-primary)] text-right text-xs" />
                  </label>
                  <label className="flex items-center justify-between">
                    <span>Row</span><input type="number" value={w.y} onChange={e => updateWidget(w.id, {y: parseInt(e.target.value)})} className="w-12 bg-[var(--surface-color)] border border-[var(--border-color)] rounded px-1.5 py-0.5 text-[var(--text-primary)] text-right text-xs" />
                  </label>
                  <label className="flex items-center justify-between">
                    <span>Width</span><input type="number" value={w.w} onChange={e => updateWidget(w.id, {w: parseInt(e.target.value)})} className="w-12 bg-[var(--surface-color)] border border-[var(--border-color)] rounded px-1.5 py-0.5 text-[var(--text-primary)] text-right text-xs" />
                  </label>
                  <label className="flex items-center justify-between">
                    <span>Height</span><input type="number" value={w.h} onChange={e => updateWidget(w.id, {h: parseInt(e.target.value)})} className="w-12 bg-[var(--surface-color)] border border-[var(--border-color)] rounded px-1.5 py-0.5 text-[var(--text-primary)] text-right text-xs" />
                  </label>
                </div>
              </div>
            ))}
            {widgets.length === 0 && (
              <p className="text-xs text-[var(--text-tertiary)] py-2">No widgets added yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="flex-grow p-5 bg-[var(--bg-color)]">
        <div ref={canvasRef} className="relative w-full h-full bg-[var(--surface-color)] rounded-xl border-2 border-dashed border-[var(--border-color)] overflow-hidden">
          {/* Base Grid for Snapping visually — must match widget overlay gap/padding exactly */}
          <div className="absolute inset-0 grid gap-1 p-2" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))` }}>
            {gridCells}
          </div>

          {/* Actual Grid Overlay for Widgets */}
          <div className="absolute inset-0 grid gap-1 p-2 pointer-events-none" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))` }}>
            {widgets.map(w => (
              <div
                key={w.id}
                onPointerDown={(e) => handleDragPointerDown(e, w)}
                style={{
                  gridColumnStart: Math.min(w.x, GRID_COLS - 1) + 1,
                  gridColumnEnd: `span ${Math.min(w.w, GRID_COLS - Math.min(w.x, GRID_COLS - 1))}`,
                  gridRowStart: Math.min(w.y, GRID_ROWS - 1) + 1,
                  gridRowEnd: `span ${Math.min(w.h, GRID_ROWS - Math.min(w.y, GRID_ROWS - 1))}`,
                  touchAction: 'none',
                }}
                className="card border-2 border-[var(--accent-teal)] rounded-xl pointer-events-auto cursor-move relative shadow-lg group overflow-hidden hover:shadow-[0_0_20px_rgba(0,212,170,0.2)] transition-all duration-200"
              >
                {/* Hover overlay: type label + action buttons */}
                <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm rounded-t-xl pointer-events-none group-hover:pointer-events-auto">
                  <span className="text-[10px] font-semibold capitalize text-white/80 truncate min-w-0 mr-1">{w.type}</span>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingWidgetId(w.id); }}
                      className="p-1 rounded-md bg-white/10 hover:bg-[var(--accent-teal)] text-white hover:text-black transition-colors"
                      title="Configure"
                      aria-label={`Configure ${w.type} widget`}
                    >
                      <SettingsIcon size={11} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeWidget(w.id); }}
                      className="p-1 rounded-md bg-white/10 hover:bg-red-500 text-white transition-colors"
                      title="Delete"
                      aria-label={`Delete ${w.type} widget`}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
                {/* Live widget preview */}
                <div className="flex-1 min-h-0 overflow-hidden pointer-events-none select-none">
                  <WidgetPreviewRenderer widget={w} prefs={prefs} />
                </div>
                {/* Resize handle — bottom-right corner */}
                <div
                  data-resize=""
                  onPointerDown={(e) => handleResizePointerDown(e, w)}
                  className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-end justify-end p-1"
                  title="Drag to resize"
                  aria-label="Drag to resize"
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M7 1L1 7M7 4L4 7" stroke="var(--accent-teal)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
