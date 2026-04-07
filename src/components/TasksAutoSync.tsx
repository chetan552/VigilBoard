"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Syncs all Google-mapped task lists in the background.
// Default: every 15 minutes. Also runs once on mount.
export function TasksAutoSync({ intervalMs = 15 * 60 * 1000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    async function sync() {
      try {
        const res = await fetch("/api/tasks/auto-sync", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          if (data.lists > 0) router.refresh();
        }
      } catch {
        // Silently ignore — network may be unavailable
      }
    }

    sync(); // run immediately on mount
    const timer = setInterval(sync, intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null;
}
