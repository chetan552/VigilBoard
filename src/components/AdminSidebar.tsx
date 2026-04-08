"use client";

import Link from 'next/link';
import { LayoutDashboard, Monitor, Settings, CheckSquare, ClipboardList, UtensilsCrossed, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { href: "/admin", icon: Monitor, label: "Screens", title: "Manage Screens" },
    { href: "/admin/tasks", icon: CheckSquare, label: "Tasks", title: "Manage Tasks" },
    { href: "/admin/chores", icon: ClipboardList, label: "Chores", title: "Chore Chart" },
    { href: "/admin/meals", icon: UtensilsCrossed, label: "Meals", title: "Meal Planner" },
    { href: "/admin/settings", icon: Settings, label: "Settings", title: "Global Settings" },
  ];

  return (
    <nav
      className={`glass-strong border-r border-[var(--border-color)] flex flex-col py-6 z-50 shadow-xl shrink-0 transition-all duration-300 ${collapsed ? 'w-16 px-2' : 'w-56 px-3'}`}
    >
      {/* Logo + collapse toggle */}
      <div className={`mb-8 flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'}`}>
        <div className="w-9 h-9 bg-gradient-to-br from-[var(--accent-teal)] via-teal-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shrink-0">
          <LayoutDashboard size={20} className="text-black" />
        </div>
        {!collapsed && (
          <>
            <span className="font-semibold text-[var(--text-primary)] tracking-tight flex-1 truncate">Vigilboard</span>
            <button
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
              className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors shrink-0"
            >
              <ChevronLeft size={15} />
            </button>
          </>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            className="sr-only"
          />
        )}
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-1 flex-grow">
        {navItems.map((item) => {
          const isActive = item.href === '/admin'
            ? pathname === '/admin'
            : pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.title : undefined}
              className={`flex items-center rounded-xl transition-all duration-200 ${
                collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-[var(--accent-teal-glow)] text-[var(--accent-teal)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && (
                <>
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent-teal)]" />}
                </>
              )}
            </Link>
          );
        })}
      </div>

      {/* Version / expand when collapsed */}
      <div className={`flex flex-col gap-2 ${collapsed ? 'items-center px-2' : 'px-3'}`}>
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        ) : (
          <span className="text-xs text-[var(--text-tertiary)]">v0.1.0</span>
        )}
      </div>
    </nav>
  );
}
