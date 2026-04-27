"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

const TRIGGER_DISTANCE = 90;   // pixels to drag before firing refresh
const MAX_PULL = 140;          // visual cap
const RESISTANCE = 0.5;        // 1.0 = follows finger, 0.5 = half-speed (rubber-band)

// Universal pull-down-from-top to trigger router.refresh().
// Only activates when the page (or topmost scroll container) is at the very top.
// Visual feedback: the spinner badge grows + rotates as you pull.
export function PullToRefresh() {
  const router = useRouter();
  const [pull, setPull] = useState(0);          // current pull distance in px
  const [refreshing, setRefreshing] = useState(false);
  const start = useRef<{ y: number } | null>(null);
  const armed = useRef(false);                  // gesture started at top of page?

  useEffect(() => {
    function isAtTop() {
      // Most layouts use document scroll; also handle the kiosk-screen case
      // where the viewport is overflow:hidden and there's no scrollable parent.
      return (window.scrollY || document.documentElement.scrollTop) <= 1;
    }

    function onTouchStart(e: TouchEvent) {
      if (!isAtTop()) {
        armed.current = false;
        return;
      }
      armed.current = true;
      start.current = { y: e.touches[0].clientY };
    }

    function onTouchMove(e: TouchEvent) {
      if (!armed.current || !start.current) return;
      const dy = e.touches[0].clientY - start.current.y;
      if (dy <= 0) {
        setPull(0);
        return;
      }
      setPull(Math.min(MAX_PULL, dy * RESISTANCE));
    }

    async function onTouchEnd() {
      if (!armed.current) return;
      armed.current = false;
      start.current = null;

      if (pull >= TRIGGER_DISTANCE) {
        setRefreshing(true);
        // Hold the spinner visible briefly so the user sees feedback even on
        // very fast refreshes.
        const minVisible = new Promise((r) => setTimeout(r, 600));
        router.refresh();
        await minVisible;
        setRefreshing(false);
      }
      setPull(0);
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd);

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pull]);

  const visible = pull > 0 || refreshing;
  const progress = Math.min(1, pull / TRIGGER_DISTANCE);
  const armed_threshold = pull >= TRIGGER_DISTANCE;

  return (
    <div
      aria-hidden
      className={`fixed top-0 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-transform ${
        visible ? "translate-y-3" : "-translate-y-full"
      }`}
      style={{ transitionDuration: refreshing ? "200ms" : "0ms" }}
    >
      <div
        className={`glass rounded-full p-3 border-2 transition-colors ${
          armed_threshold || refreshing
            ? "border-[var(--accent-teal)] bg-[var(--accent-teal)]/10"
            : "border-[var(--border-color)]"
        }`}
        style={{ transform: `scale(${0.6 + progress * 0.4})` }}
      >
        <RefreshCw
          size={20}
          className={refreshing ? "animate-spin text-[var(--accent-teal)]" : "text-[var(--accent-teal)]"}
          style={!refreshing ? { transform: `rotate(${progress * 360}deg)`, transition: "none" } : undefined}
        />
      </div>
    </div>
  );
}
