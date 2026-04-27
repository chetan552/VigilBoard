"use client";
import { useEffect } from "react";

// Keeps the screen awake on supported devices (Chromium-based browsers).
// Re-acquires the lock when the page becomes visible again, since the browser
// drops it on tab/visibility change.
export function ScreenWakeLock() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let lock: WakeLockSentinel | null = null;

    async function acquire() {
      try {
        // @ts-expect-error — wakeLock typings still partial in some setups
        lock = await navigator.wakeLock.request("screen");
      } catch (err) {
        console.warn("[ScreenWakeLock] could not acquire:", err);
      }
    }

    function onVisibility() {
      if (document.visibilityState === "visible" && !lock) {
        acquire();
      }
    }

    acquire();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      lock?.release().catch(() => {});
      lock = null;
    };
  }, []);

  return null;
}
