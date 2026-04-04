"use client";

import { Copy } from "lucide-react";
import { useTransition } from "react";

interface DuplicateScreenButtonProps {
  screenId: string;
  duplicateAction: (id: string) => Promise<void>;
}

export function DuplicateScreenButton({ screenId, duplicateAction }: DuplicateScreenButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(async () => { await duplicateAction(screenId); })}
      disabled={isPending}
      className="text-[var(--text-secondary)] hover:text-[var(--accent-teal)] hover:bg-[var(--accent-teal)]/10 p-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      title={isPending ? "Duplicating…" : "Duplicate Screen"}
      aria-label={isPending ? "Duplicating…" : "Duplicate Screen"}
    >
      <Copy size={18} className={isPending ? "animate-pulse" : ""} />
    </button>
  );
}
