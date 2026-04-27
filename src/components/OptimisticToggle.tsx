"use client";
import { useEffect, useState, useTransition } from "react";
import { CheckSquare, Square, CheckCircle, Circle } from "lucide-react";

type Variant = "square" | "circle";
type Color = "green" | "purple" | "blue";

const COLOR_CLASSES: Record<Color, { on: string; offHover: string }> = {
  green:  { on: "text-green-400",  offHover: "hover:text-green-400" },
  purple: { on: "text-purple-400", offHover: "hover:text-purple-400" },
  blue:   { on: "text-blue-400",   offHover: "hover:text-blue-400" },
};

type Props = {
  initialCompleted: boolean;
  toggle: () => Promise<void>; // server action, pre-bound to (id, currentlyCompleted)
  ariaLabel?: string;
  variant?: Variant;
  color?: Color;
  size?: number;
};

// Tap immediately flips the icon and runs the server action in the background.
// Auto-syncs back to `initialCompleted` after the server re-renders, so a
// failed/reverted action will eventually correct itself.
export function OptimisticToggle({
  initialCompleted,
  toggle,
  ariaLabel,
  variant = "square",
  color = "green",
  size = 20,
}: Props) {
  const [optimistic, setOptimistic] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();

  // When the server re-renders with new data, sync back unless we're mid-action.
  useEffect(() => {
    if (!isPending) setOptimistic(initialCompleted);
  }, [initialCompleted, isPending]);

  const On = variant === "square" ? CheckSquare : CheckCircle;
  const Off = variant === "square" ? Square : Circle;
  const palette = COLOR_CLASSES[color];

  return (
    <form
      action={() => startTransition(async () => { await toggle(); })}
      className="shrink-0"
    >
      <button
        type="submit"
        onClick={() => setOptimistic((v) => !v)}
        aria-label={ariaLabel}
        className={`p-1 -m-1 transition-colors active:scale-95 ${
          optimistic ? palette.on : `text-[var(--text-secondary)] ${palette.offHover}`
        }`}
      >
        {optimistic ? <On size={size} /> : <Off size={size} />}
      </button>
    </form>
  );
}
