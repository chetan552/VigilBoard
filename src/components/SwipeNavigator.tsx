"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  prevId: string | null;
  nextId: string | null;
  prevName?: string | null;
  nextName?: string | null;
};

const SWIPE_THRESHOLD = 80;       // pixels — must drag past this to navigate
const HORIZONTAL_BIAS = 1.4;      // |dx| > |dy| * this → treat as horizontal swipe

// Listens for horizontal swipes on the live screen and navigates between
// sibling screens. Also shows tiny edge arrows when there are neighbors.
export function SwipeNavigator({ prevId, nextId, prevName, nextName }: Props) {
  const router = useRouter();
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const [hint, setHint] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY, t: Date.now() };
      setHint(null);
    }

    function onTouchMove(e: TouchEvent) {
      if (!start.current) return;
      const t = e.touches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      // Only show hint if the gesture clearly looks horizontal (avoid hijacking
      // vertical scrolls inside widgets).
      if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * HORIZONTAL_BIAS) {
        setHint(dx < 0 ? "right" : "left"); // dx<0 (swipe left) → next
      } else if (hint) {
        setHint(null);
      }
    }

    function onTouchEnd(e: TouchEvent) {
      const s = start.current;
      start.current = null;
      setHint(null);
      if (!s) return;

      const t = e.changedTouches[0];
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      const elapsed = Date.now() - s.t;

      // Must be a quick, horizontal-dominant swipe past threshold
      if (
        Math.abs(dx) > SWIPE_THRESHOLD &&
        Math.abs(dx) > Math.abs(dy) * HORIZONTAL_BIAS &&
        elapsed < 800
      ) {
        if (dx < 0 && nextId) router.push(`/screen/${nextId}`);
        else if (dx > 0 && prevId) router.push(`/screen/${prevId}`);
      }
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
  }, [nextId, prevId]);

  if (!prevId && !nextId) return null;

  return (
    <>
      {prevId && (
        <div
          aria-hidden
          className={`pointer-events-none fixed left-2 top-1/2 -translate-y-1/2 z-30 flex items-center gap-2 transition-opacity duration-200 ${
            hint === "left" ? "opacity-100" : "opacity-30"
          }`}
        >
          <div className="glass rounded-full p-2">
            <ChevronLeft size={20} className="text-[var(--accent-teal)]" />
          </div>
          {hint === "left" && prevName && (
            <span className="text-xs font-medium px-2 py-1 glass rounded-md text-[var(--text-primary)]">{prevName}</span>
          )}
        </div>
      )}
      {nextId && (
        <div
          aria-hidden
          className={`pointer-events-none fixed right-2 top-1/2 -translate-y-1/2 z-30 flex items-center gap-2 transition-opacity duration-200 ${
            hint === "right" ? "opacity-100" : "opacity-30"
          }`}
        >
          {hint === "right" && nextName && (
            <span className="text-xs font-medium px-2 py-1 glass rounded-md text-[var(--text-primary)]">{nextName}</span>
          )}
          <div className="glass rounded-full p-2">
            <ChevronRight size={20} className="text-[var(--accent-teal)]" />
          </div>
        </div>
      )}
    </>
  );
}
