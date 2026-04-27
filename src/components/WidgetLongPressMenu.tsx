"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Trash2, RotateCcw, Settings, Edit } from "lucide-react";
import {
  clearCompletedTasks,
  resetTodayChores,
  clearCompletedHomework,
} from "@/app/actions/widget-actions";

type Action = {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void | Promise<void>;
  href?: string;
  destructive?: boolean;
};

type Props = {
  children: React.ReactNode;
  widgetType: string;
  widgetId: string;
  screenId: string;
  config: string | null;
};

const LONG_PRESS_MS = 500;

function buildActions(widgetType: string, config: string | null, screenId: string): Action[] {
  const cfg = (() => { try { return JSON.parse(config || "{}"); } catch { return {}; } })();
  const actions: Action[] = [];

  switch (widgetType) {
    case "tasks":
      if (cfg.listName) {
        actions.push({
          label: "Clear completed tasks",
          icon: <Trash2 size={14} />,
          onClick: () => clearCompletedTasks(cfg.listName),
          destructive: true,
        });
      }
      actions.push({
        label: "Manage tasks",
        icon: <Edit size={14} />,
        href: "/admin/tasks",
      });
      break;

    case "chorechart":
      actions.push({
        label: "Reset today's chores",
        icon: <RotateCcw size={14} />,
        onClick: () => resetTodayChores(cfg.filterAssignee || null),
        destructive: true,
      });
      actions.push({
        label: "Manage chores",
        icon: <Edit size={14} />,
        href: "/admin/chores",
      });
      break;

    case "homework":
      actions.push({
        label: "Clear completed assignments",
        icon: <Trash2 size={14} />,
        onClick: () => clearCompletedHomework(cfg.filterAssignee || null),
        destructive: true,
      });
      actions.push({
        label: "Manage homework",
        icon: <Edit size={14} />,
        href: "/admin/homework",
      });
      break;

    case "mealplanner":
      actions.push({
        label: "Edit meal plan",
        icon: <Edit size={14} />,
        href: "/admin/meals",
      });
      break;

    default:
      // Fall through — at minimum offer "Configure widget"
      break;
  }

  // Universal: jump to the layout editor for this widget
  actions.push({
    label: "Configure widget",
    icon: <Settings size={14} />,
    href: `/admin/screen/${screenId}`,
  });

  return actions;
}

export function WidgetLongPressMenu({ children, widgetType, widgetId, screenId, config }: Props) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const triggered = useRef(false);

  // Cancel long-press on touchmove (treat as scroll/swipe)
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    startPos.current = null;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    triggered.current = false;
    startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    timer.current = setTimeout(() => {
      triggered.current = true;
      setOpen(true);
      // Vibrate if supported (Android Chrome on RPi)
      if ("vibrate" in navigator) navigator.vibrate(20);
    }, LONG_PRESS_MS);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!startPos.current) return;
    const dx = e.touches[0].clientX - startPos.current.x;
    const dy = e.touches[0].clientY - startPos.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > 12) cancel();
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    cancel();
    // If long-press fired, swallow the corresponding click so the underlying
    // checkbox/button doesn't also activate.
    if (triggered.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onContextMenu = (e: React.MouseEvent) => {
    // Right-click as a desktop equivalent
    e.preventDefault();
    setOpen(true);
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const actions = buildActions(widgetType, config, screenId);

  return (
    <div
      className="contents"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onContextMenu={onContextMenu}
    >
      {children}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
          />
          {/* Menu */}
          <div
            role="menu"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 glass-strong border border-[var(--border-color)] rounded-2xl p-2 min-w-[260px] shadow-2xl animate-fade-in"
            data-widget-id={widgetId}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] px-3 pt-2 pb-1.5">
              Quick Actions — {widgetType}
            </p>
            {actions.map((action, i) =>
              action.href ? (
                <Link
                  key={i}
                  href={action.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface-hover)] text-sm transition-colors w-full text-left"
                >
                  <span className="text-[var(--text-secondary)]">{action.icon}</span>
                  <span>{action.label}</span>
                </Link>
              ) : (
                <button
                  key={i}
                  onClick={async () => {
                    setOpen(false);
                    if (action.onClick) await action.onClick();
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface-hover)] text-sm transition-colors w-full text-left ${
                    action.destructive ? "text-red-400 hover:bg-red-500/10" : ""
                  }`}
                >
                  <span className={action.destructive ? "text-red-400" : "text-[var(--text-secondary)]"}>
                    {action.icon}
                  </span>
                  <span>{action.label}</span>
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
