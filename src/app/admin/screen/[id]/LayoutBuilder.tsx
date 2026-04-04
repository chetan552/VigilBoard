"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Save, Layers, Settings as SettingsIcon, X as CloseIcon, Check } from "lucide-react";
import { saveWidgets } from "./actions";
import { PhotoPicker } from "@/components/PhotoPicker";

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

const WIDGET_TYPES = [
  { id: 'clock', label: 'Clock', w: 4, h: 3 },
  { id: 'weather', label: 'Weather', w: 4, h: 4 },
  { id: 'calendar', label: 'Calendar', w: 5, h: 6 },
  { id: 'photos', label: 'Photos', w: 5, h: 5 },
  { id: 'quotes', label: 'Quotes', w: 6, h: 2 },
  { id: 'tasks', label: 'Task List', w: 3, h: 6 },
  { id: 'text', label: 'Free Text', w: 4, h: 2 },
  { id: 'countdown', label: 'Countdown', w: 4, h: 3 },
  { id: 'news', label: 'News Feed', w: 4, h: 4 },
  { id: 'worldclock', label: 'World Clock', w: 4, h: 4 },
  { id: 'datafetch', label: 'Data Fetch', w: 3, h: 3 },
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

  return (
    <div className="flex flex-col gap-3">
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

export function LayoutBuilder({ initialScreen, taskListNames = ["Erel", "Asaph", "Eden", "Ashira"] }: { initialScreen: Screen; taskListNames?: string[] }) {
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
    const innerW = rect.width - 48;  // p-6 = 24px each side
    const innerH = rect.height - 48;
    return {
      colUnit: (innerW + 12) / 12,   // gap-3 = 12px
      rowUnit: (innerH + 12) / 8,
      rect,
    };
  };

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!pointerState.current) return;
      const { mode, widgetId, startClientX, startClientY, startW, startH, startX, startY } = pointerState.current;
      const { colUnit, rowUnit, rect } = getGridUnits() as ReturnType<typeof getGridUnits> & { rect: DOMRect };

      if (mode === 'resize') {
        const newW = Math.max(1, Math.min(12 - startX, Math.round(startW + (e.clientX - startClientX) / colUnit)));
        const newH = Math.max(1, Math.min(8 - startY, Math.round(startH + (e.clientY - startClientY) / rowUnit)));
        setWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, w: newW, h: newH } : w));
      } else if (mode === 'drag' && rect) {
        // Convert pointer position to grid cell
        const offsetX = e.clientX - rect.left - 24; // subtract p-6 padding
        const offsetY = e.clientY - rect.top - 24;
        const { colUnit: cu, rowUnit: ru } = getGridUnits();
        const newX = Math.max(0, Math.min(11, Math.floor(offsetX / cu)));
        const newY = Math.max(0, Math.min(7, Math.floor(offsetY / ru)));
        setWidgets(prev => prev.map(w => {
          if (w.id !== widgetId) return w;
          return {
            ...w,
            x: Math.min(newX, 12 - w.w),
            y: Math.min(newY, 8 - w.h),
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
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 12; x++) {
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
          <div className="glass-strong border border-[var(--border-color)] rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <SettingsIcon size={24} className="text-[var(--accent-teal)]" />
                Configure {editingWidget.type}
              </h3>
              <button onClick={() => setEditingWidgetId(null)} aria-label="Close settings" className="p-2 hover:bg-[var(--surface-hover)] rounded-xl transition-colors">
                <CloseIcon size={24} />
              </button>
            </div>
            
            <div className="flex flex-col gap-6 text-[var(--text-primary)]">
              {/* Type-Specific Fields */}
              {editingWidget.type === 'weather' && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider text-left">Location (City, State/Country)</label>
                  <input 
                    className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3 text-left"
                    placeholder="Loveland, CO"
                    value={(() => {
                      try { return JSON.parse(editingWidget.config || '{}').location || ''; } catch { return ''; }
                    })()}
                    onChange={(e) => {
                      const current = JSON.parse(editingWidget.config || '{}');
                      updateWidget(editingWidget.id, { config: JSON.stringify({ ...current, location: e.target.value }) });
                    }}
                  />
                  <p className="text-xs text-[var(--text-tertiary)] italic">Enter a city name, e.g. "Austin, TX" or "London, UK".</p>
                </div>
              )}

              {editingWidget.type === 'tasks' && (() => {
                const cfg = (() => { try { return JSON.parse(editingWidget.config || '{}'); } catch { return {}; } })();
                const update = (patch: Record<string, unknown>) =>
                  updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, ...patch }) });
                return (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider text-left">Child Name (List Name)</label>
                      <select
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3 text-left"
                        value={cfg.listName || 'Erel'}
                        onChange={(e) => update({ listName: e.target.value })}
                      >
                        {taskListNames.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Display</label>
                      <div className="flex flex-col gap-2">
                        {([
                          ['showHeader', 'Show header (icon + name)'],
                          ['showProgress', 'Show progress bar'],
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

              {editingWidget.type === 'calendar' && <CalendarPicker widget={editingWidget} updateWidget={updateWidget} />}

              {editingWidget.type === 'quotes' && (() => {
                const cfg = (() => { try { return JSON.parse(editingWidget.config || '{}'); } catch { return {}; } })();
                return (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Custom Quotes</label>
                    <textarea
                      className="input min-h-[120px] align-top font-mono text-sm"
                      placeholder={"Quote text — Author\nAnother quote — Someone"}
                      value={cfg.customQuotes || ''}
                      onChange={(e) => updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, customQuotes: e.target.value }) })}
                    />
                    <p className="text-xs text-[var(--text-tertiary)] italic">One quote per line. Format: Quote text — Author</p>
                  </div>
                );
              })()}

              {editingWidget.type === 'countdown' && (() => {
                const cfg = (() => { try { return JSON.parse(editingWidget.config || '{}'); } catch { return {}; } })();
                return (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Event Name</label>
                      <input
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3"
                        placeholder="Summer Vacation"
                        value={cfg.eventName || ''}
                        onChange={(e) => updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, eventName: e.target.value }) })}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Target Date</label>
                      <input
                        type="datetime-local"
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3"
                        value={cfg.targetDate ? cfg.targetDate.slice(0, 16) : ''}
                        onChange={(e) => updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, targetDate: e.target.value }) })}
                      />
                    </div>
                  </>
                );
              })()}

              {editingWidget.type === 'news' && (() => {
                const cfg = (() => { try { return JSON.parse(editingWidget.config || '{}'); } catch { return {}; } })();
                return (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Feed Label</label>
                      <input
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3"
                        placeholder="BBC News"
                        value={cfg.label || ''}
                        onChange={(e) => updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, label: e.target.value }) })}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">RSS Feed URL</label>
                      <input
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3 font-mono text-sm"
                        placeholder="https://feeds.bbci.co.uk/news/rss.xml"
                        value={cfg.feedUrl || ''}
                        onChange={(e) => updateWidget(editingWidget.id, { config: JSON.stringify({ ...cfg, feedUrl: e.target.value }) })}
                      />
                      <p className="text-xs text-[var(--text-tertiary)] italic">Leave blank to use BBC News</p>
                    </div>
                  </>
                );
              })()}

              {editingWidget.type === 'worldclock' && <WorldClockEditor widget={editingWidget} updateWidget={updateWidget} />}

              {editingWidget.type === 'clock' && (
                <div className="flex items-center gap-3 p-3 bg-[var(--surface-hover)] rounded-xl border border-[var(--border-color)]">
                  <span className="text-lg">🕐</span>
                  <p className="text-sm text-[var(--text-secondary)]">No configuration needed. Time format is set in <a href="/admin/settings" className="text-[var(--accent-teal)] underline" target="_blank">Settings → Display Preferences</a>.</p>
                </div>
              )}

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

              {!['weather','tasks','text','photos','calendar','quotes','countdown','news','worldclock','clock','datafetch'].includes(editingWidget.type) && (
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

              <div className="flex gap-3 mt-4">
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
        </div>
      )}

      {/* Sidebar Controls */}
      <div className="w-72 border-r border-[var(--border-color)] flex flex-col overflow-hidden shrink-0" style={{ background: '#1a1a1a' }}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
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
          <div className="absolute inset-0 grid grid-cols-12 grid-rows-8 gap-3 p-6">
            {gridCells}
          </div>

          {/* Actual Grid Overlay for Widgets */}
          <div className="absolute inset-0 grid grid-cols-12 grid-rows-8 gap-3 p-6 pointer-events-none">
            {widgets.map(w => (
              <div
                key={w.id}
                onPointerDown={(e) => handleDragPointerDown(e, w)}
                style={{
                  gridColumnStart: Math.min(w.x, 11) + 1,
                  gridColumnEnd: `span ${Math.min(w.w, 12 - Math.min(w.x, 11))}`,
                  gridRowStart: Math.min(w.y, 7) + 1,
                  gridRowEnd: `span ${Math.min(w.h, 8 - Math.min(w.y, 7))}`,
                  touchAction: 'none',
                }}
                className="@container bg-[var(--surface-hover)] border-2 border-[var(--accent-teal)] rounded-xl pointer-events-auto cursor-move relative shadow-lg flex flex-col group overflow-hidden hover:shadow-[0_0_20px_rgba(0,212,170,0.2)] transition-all duration-200"
              >
                {/* Header: type on left, action buttons on right */}
                <div className="flex items-center justify-between px-1.5 py-1 bg-[var(--surface-color)] border-b border-[var(--border-color)] shrink-0 min-w-0">
                  <span className="text-[10px] font-semibold capitalize text-[var(--text-secondary)] truncate min-w-0 mr-1">{w.type}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingWidgetId(w.id); }}
                      className="p-1 rounded-md bg-[var(--accent-teal)]/10 hover:bg-[var(--accent-teal)] text-[var(--accent-teal)] hover:text-black transition-colors"
                      title="Configure"
                      aria-label={`Configure ${w.type} widget`}
                    >
                      <SettingsIcon size={11} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeWidget(w.id); }}
                      className="p-1 rounded-md bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-colors"
                      title="Delete"
                      aria-label={`Delete ${w.type} widget`}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
                {/* Body — font scales with container width via cqw */}
                <div className="flex-1 flex flex-col items-center justify-center gap-1 p-1 min-w-0 overflow-hidden">
                  <span
                    className="font-bold capitalize text-[var(--text-primary)] opacity-40 group-hover:opacity-90 transition-opacity text-center leading-tight"
                    style={{ fontSize: 'clamp(8px, 3cqw, 14px)' }}
                  >
                    {w.type}
                  </span>
                  <span
                    className="text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ fontSize: 'clamp(7px, 2.5cqw, 11px)' }}
                  >
                    {w.w} × {w.h}
                  </span>
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
