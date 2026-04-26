"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Syncs all Google-mapped task lists in the background.
// Default: every 5 minutes. Also runs once on mount.
export function TasksAutoSync({ intervalMs = 5 * 60 * 1000 }: { intervalMs?: number }) {
  const router = useRouter();
  // Use a ref so the interval callback always has the latest router
  // without being in the effect deps (avoids duplicate intervals on refresh).
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    async function sync() {
      try {
        const res = await fetch("/api/tasks/auto-sync", { method: "POST" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.warn("[TasksAutoSync] sync failed:", res.status, data?.error);
          return;
        }
        const data = await res.json();
        if (data.lists > 0) {
          console.log(`[TasksAutoSync] synced ${data.synced} tasks across ${data.lists} list(s)`);
          routerRef.current.refresh();
        }
      } catch (err) {
        console.warn("[TasksAutoSync] network error:", err);
      }
    }

    sync(); // run immediately on mount
    const timer = setInterval(sync, intervalMs);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]); // intentionally omit router — using routerRef instead

  return null;
}
