"use client";

import Link from 'next/link';
import { LayoutDashboard, Monitor, Settings, CheckSquare } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function AdminSidebar() {
  const pathname = usePathname();
  
  const navItems = [
    { href: "/admin", icon: Monitor, label: "Screens", title: "Manage Screens" },
    { href: "/admin/tasks", icon: CheckSquare, label: "Tasks", title: "Manage Tasks" },
    { href: "/admin/settings", icon: Settings, label: "Settings", title: "Global Settings" },
  ];

  return (
    <nav className="glass-strong w-56 border-r border-[var(--border-color)] flex flex-col py-6 px-3 z-50 shadow-xl shrink-0">
      <div className="mb-8 flex items-center gap-3 px-3">
        <div className="w-9 h-9 bg-gradient-to-br from-[var(--accent-teal)] via-teal-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shrink-0">
          <LayoutDashboard size={20} className="text-black" />
        </div>
        <span className="font-semibold text-[var(--text-primary)] tracking-tight">Vigilboard</span>
      </div>

      <div className="flex flex-col gap-1 flex-grow">
        {navItems.map((item) => {
          const isActive = item.href === '/admin'
            ? pathname === '/admin'
            : pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-[var(--accent-teal-glow)] text-[var(--accent-teal)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <item.icon size={18} className="shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent-teal)]" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="px-3 text-xs text-[var(--text-tertiary)]">
        v0.1.0
      </div>
    </nav>
  );
}
