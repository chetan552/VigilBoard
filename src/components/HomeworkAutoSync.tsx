"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Syncs all configured ICS homework feeds in the background.
// Default: every hour. Also runs once on mount.
// Hourly is enough — school calendars rarely change more than a few times a day.
export function HomeworkAutoSync({ intervalMs = 60 * 60 * 1000 }: { intervalMs?: number }) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    async function sync() {
      try {
        const res = await fetch("/api/homework/auto-sync", { method: "POST" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.warn("[HomeworkAutoSync] sync failed:", res.status, data?.error);
          return;
        }
        const data = await res.json();
        const changed = (data.imported || 0) + (data.updated || 0);
        if (changed > 0) {
          console.log(
            `[HomeworkAutoSync] ${data.imported} new, ${data.updated} updated across ${data.succeeded}/${data.feeds} feed(s)`
          );
          routerRef.current.refresh();
        }
        if (data.errors?.length) {
          console.warn("[HomeworkAutoSync] feed errors:", data.errors);
        }
      } catch (err) {
        console.warn("[HomeworkAutoSync] network error:", err);
      }
    }

    sync();
    const timer = setInterval(sync, intervalMs);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  return null;
}
