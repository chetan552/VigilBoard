"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type Widget = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config: string | null;
};

type CalendarEvent = {
  id: string;
  title: string;
  time: string;
  date: number;
};

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function CalendarWidget({ widget }: { widget: Widget }) {
  const config = typeof widget.config === "string"
    ? JSON.parse(widget.config || "{}")
    : (widget.config || {});
  const calendarId = config.calendarId || "primary";
  const eventSize: "sm" | "md" | "lg" = config.eventSize || "sm";
  const pillText = eventSize === "lg" ? "text-xs" : eventSize === "md" ? "text-[11px]" : "text-[9px]";
  const agendaTitle = eventSize === "lg" ? "text-base" : eventSize === "md" ? "text-sm" : "text-xs";

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [connected, setConnected] = useState(true);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const fetchEvents = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar/events?year=${y}&month=${m}&calendarId=${encodeURIComponent(calendarId)}`);
      const data = await res.json();
      setEvents(data.events ?? []);
      setConnected(data.connected);
      setNeedsReconnect(data.needsReconnect ?? false);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, [calendarId]);

  useEffect(() => { fetchEvents(year, month); setSelectedDay(null); }, [year, month, fetchEvents]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const agendaEvents = isCurrentMonth
    ? events.filter(e => e.date >= today.getDate()).slice(0, 5)
    : events.slice(0, 5);

  // Build grid cells
  const cells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(<div key={`empty-${i}`} className="border-t border-r border-[#333]/30 min-h-[60px]" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = isCurrentMonth && d === today.getDate();
    const isSelected = selectedDay === d;
    const dayEvents = events.filter(e => e.date === d);
    cells.push(
      <div
        key={`day-${d}`}
        onClick={() => setSelectedDay(isSelected ? null : d)}
        className={`p-1 pt-1.5 relative border-t border-r border-[#333]/30 min-h-[60px] transition-colors cursor-pointer
          ${isToday ? "bg-[var(--surface-hover)]" : ""}
          ${isSelected ? "ring-1 ring-inset ring-[var(--accent-teal)] bg-[var(--accent-teal)]/5" : "hover:bg-[var(--surface-hover)]"}
        `}
      >
        <div className={`w-6 h-6 flex items-center justify-center rounded-full text-sm mx-auto mb-0.5 ${isToday ? "bg-[var(--accent-teal)] text-black font-bold" : "text-[var(--text-secondary)]"}`}>
          {d}
        </div>
        <div className="flex flex-col gap-0.5 px-0.5">
          {dayEvents.slice(0, 2).map(e => (
            <div
              key={e.id}
              className="flex items-center gap-1 px-1 py-0.5 bg-[var(--accent-teal)]/15 rounded overflow-hidden"
            >
              <div className="w-1 h-1 rounded-full bg-[var(--accent-teal)] shrink-0" />
              <span className={`${pillText} font-medium text-[var(--accent-teal)] truncate leading-tight`}>{e.title}</span>
            </div>
          ))}
          {dayEvents.length > 2 && (
            <div className={`${pillText} text-[var(--accent-teal)]/70 px-1 font-medium`}>+{dayEvents.length - 2} more</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-[var(--surface-color)] text-[var(--text-primary)] animate-fade-in">
      {/* Calendar grid */}
      <div className="flex-grow flex flex-col border-r border-[var(--border-color)] min-w-0 overflow-hidden">
        {/* Sticky header + day names */}
        <div className="shrink-0 px-4 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-[var(--accent-teal)]" size={20} />
            <h2 className="text-xl font-semibold tracking-wide">
              {MONTH_NAMES[month]} {year}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {!isCurrentMonth && (
              <button
                onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
                className="px-2 py-0.5 text-xs font-medium text-[var(--accent-teal)] border border-[var(--accent-teal)]/40 rounded-md hover:bg-[var(--accent-teal)]/10 transition-colors"
              >
                Today
              </button>
            )}
            <button
              onClick={prevMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextMonth}
              aria-label="Next month"
              className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Day name headers */}
        <div className="grid grid-cols-7">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-xs text-[var(--text-secondary)] font-medium uppercase text-center pb-2">
              {d}
            </div>
          ))}
        </div>
        </div>{/* end sticky header */}

        {/* Day cells — scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4 touch-scroll">
          <div className={`grid grid-cols-7 transition-opacity duration-200 ${loading ? "opacity-40" : "opacity-100"}`}>
            {cells}
          </div>
        </div>
      </div>

      {/* Agenda / Day detail panel */}
      <div className="w-[220px] shrink-0 p-5 flex flex-col glass overflow-y-auto touch-scroll">
        {selectedDay !== null ? (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                {MONTH_NAMES[month].slice(0, 3)} {selectedDay}
                {isCurrentMonth && selectedDay === today.getDate() && (
                  <span className="ml-2 text-[var(--accent-teal)]">· Today</span>
                )}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                aria-label="Close day detail"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-lg leading-none"
              >
                ×
              </button>
            </div>
            {(() => {
              const dayEvents = events.filter(e => e.date === selectedDay);
              return dayEvents.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] opacity-50 text-center py-6">No events</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {dayEvents.map(event => (
                    <div key={event.id} className="flex gap-3 items-start">
                      <div className="w-1 min-h-[36px] rounded-full bg-[var(--accent-teal)] mt-0.5 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className={`font-semibold ${agendaTitle} leading-snug`}>{event.title}</span>
                        <div className="flex items-center gap-1 text-xs text-[var(--accent-teal)] font-medium mt-1">
                          <Clock size={11} /> {event.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </>
        ) : (
          <>
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-5">Agenda</h3>
            {!connected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                <p className="text-xs text-[var(--text-secondary)]">
                  {needsReconnect ? "Session expired" : "Calendar not connected"}
                </p>
                <Link
                  href="/admin/settings"
                  className="bg-[var(--accent-teal)] text-black px-3 py-1.5 rounded-lg font-bold text-xs hover:scale-105 transition-all"
                >
                  {needsReconnect ? "Reconnect" : "Connect"}
                </Link>
              </div>
            ) : loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[var(--accent-teal)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : agendaEvents.length === 0 ? (
              <div className="text-center text-[var(--text-secondary)] opacity-50 py-10 text-xs">
                No {isCurrentMonth ? "upcoming " : ""}events
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {agendaEvents.map(event => (
                  <div
                    key={event.id}
                    className="flex gap-3 items-start cursor-pointer"
                    onClick={() => setSelectedDay(event.date)}
                  >
                    <div className="w-1 min-h-[36px] rounded-full bg-[var(--accent-teal)] mt-0.5 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className={`font-semibold ${agendaTitle} leading-tight truncate`}>{event.title}</span>
                      <div className="flex items-center gap-1 text-xs text-[var(--accent-teal)] font-medium mt-1">
                        <Clock size={11} /> {event.time}
                        <span className="text-[var(--text-secondary)] ml-1">
                          {isCurrentMonth
                            ? event.date === today.getDate()
                              ? "Today"
                              : `in ${event.date - today.getDate()}d`
                            : `${MONTH_NAMES[month].slice(0, 3)} ${event.date}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
