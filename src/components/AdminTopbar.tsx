import { ChevronLeft, LogOut } from "lucide-react";
import Link from "next/link";

export function AdminTopbar({ title, backHref }: { title: string; backHref?: string }) {
  return (
    <header className="glass-strong h-14 flex items-center gap-3 px-8 border-b border-[var(--border-color)] sticky top-0 z-40 shadow-md shrink-0">
      {backHref && (
        <Link
          href={backHref}
          className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
        >
          <ChevronLeft size={17} />
        </Link>
      )}
      {backHref && <span className="text-[var(--border-color)] select-none">/</span>}
      <h1 className="text-lg font-semibold tracking-tight truncate flex-1">{title}</h1>

      <form action="/api/auth/logout" method="POST">
        <button
          type="submit"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
          title="Sign out"
        >
          <LogOut size={14} /> Sign out
        </button>
      </form>
    </header>
  );
}
