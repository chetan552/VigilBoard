"use client";
import { useEffect, useState } from "react";

type Props = {
  enabled: boolean;
  startHour: number;     // 0-23, e.g. 21 (9pm)
  endHour: number;       // 0-23, e.g. 6 (6am)
  maxLevel: number;      // 0-1, target dim opacity
  warmth: number;        // 0-1, warmth tint strength
  fadeMins?: number;     // crossfade window at each end (default 30)
};

// Computes the current dim opacity given the time of day and the configured
// night window. Linearly ramps in/out over `fadeMins` at each edge so the
// transition is gradual instead of abrupt.
function computeDimOpacity(
  now: Date,
  startHour: number,
  endHour: number,
  maxLevel: number,
  fadeMins: number
): number {
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const startMin = startHour * 60;
  const endMin = endHour * 60;

  // Compute "minutes into night" and "minutes until night ends",
  // handling the common case where the night window crosses midnight.
  let minutesIntoNight: number;
  let totalNightMins: number;

  if (endMin <= startMin) {
    // Night spans midnight (e.g. 21:00 → 06:00)
    totalNightMins = (24 * 60 - startMin) + endMin;
    if (nowMin >= startMin) {
      minutesIntoNight = nowMin - startMin;
    } else if (nowMin < endMin) {
      minutesIntoNight = (24 * 60 - startMin) + nowMin;
    } else {
      return 0; // Daytime
    }
  } else {
    // Night within a single day (unusual, but handle it)
    totalNightMins = endMin - startMin;
    if (nowMin < startMin || nowMin >= endMin) return 0;
    minutesIntoNight = nowMin - startMin;
  }

  const minutesUntilEnd = totalNightMins - minutesIntoNight;
  const startRamp = Math.min(minutesIntoNight / fadeMins, 1);
  const endRamp = Math.min(minutesUntilEnd / fadeMins, 1);
  return maxLevel * Math.max(0, Math.min(startRamp, endRamp));
}

export function NightDim({
  enabled,
  startHour,
  endHour,
  maxLevel,
  warmth,
  fadeMins = 30,
}: Props) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setOpacity(0);
      return;
    }

    function tick() {
      setOpacity(computeDimOpacity(new Date(), startHour, endHour, maxLevel, fadeMins));
    }

    tick();
    const t = setInterval(tick, 60_000); // re-evaluate every minute
    return () => clearInterval(t);
  }, [enabled, startHour, endHour, maxLevel, fadeMins]);

  if (!enabled) return null;

  // Two stacked overlays:
  // 1. Black layer for darkening
  // 2. Warm amber layer for color temperature shift (only when dim is active)
  // Both use pointer-events: none so touches pass through to widgets.
  // Long CSS transition smooths between minute-by-minute updates.
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-30 bg-black"
        style={{
          opacity,
          transition: "opacity 60s linear",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-30"
        style={{
          opacity: opacity * warmth,
          background: "rgba(255, 140, 50, 0.35)",
          mixBlendMode: "multiply",
          transition: "opacity 60s linear",
        }}
      />
    </>
  );
}
