"use client";

import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";

type Widget = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config: string | null;
};

type VerseData = {
  reference: string;
  text: string;
  translation_name: string;
};

const DEFAULT_VERSES = [
  "Genesis 1:1",
  "Joshua 1:9",
  "Psalm 23:1-6",
  "Psalm 27:1",
  "Psalm 37:4",
  "Psalm 46:1",
  "Psalm 91:1-2",
  "Psalm 119:105",
  "Psalm 139:14",
  "Proverbs 3:5-6",
  "Proverbs 16:3",
  "Proverbs 18:10",
  "Proverbs 22:6",
  "Isaiah 40:31",
  "Isaiah 41:10",
  "Isaiah 53:5",
  "Isaiah 55:8-9",
  "Jeremiah 29:11",
  "Lamentations 3:22-23",
  "Micah 6:8",
  "Nahum 1:7",
  "Matthew 5:14-16",
  "Matthew 6:33",
  "Matthew 11:28-30",
  "Matthew 28:19-20",
  "John 3:16",
  "John 14:6",
  "John 16:33",
  "Romans 5:8",
  "Romans 8:28",
  "Romans 12:2",
  "Romans 15:13",
  "1 Corinthians 10:13",
  "1 Corinthians 13:4-7",
  "2 Corinthians 5:17",
  "2 Corinthians 12:9",
  "Galatians 5:22-23",
  "Ephesians 2:8-9",
  "Ephesians 6:10-11",
  "Philippians 4:6-7",
  "Philippians 4:13",
  "Colossians 3:23",
  "2 Timothy 1:7",
  "Hebrews 11:1",
  "Hebrews 13:8",
  "James 1:2-4",
  "1 Peter 5:7",
  "1 John 4:19",
  "Deuteronomy 31:6",
  "Revelation 21:4",
];

export function BibleWidget({ widget }: { widget: Widget }) {
  const config = widget.config
    ? (() => { try { return JSON.parse(widget.config!); } catch { return {}; } })()
    : {};

  const translation: string = config.translation || "kjv";

  let verses = DEFAULT_VERSES;
  if (config.customVerses && typeof config.customVerses === "string" && config.customVerses.trim()) {
    const parsed = config.customVerses
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean);
    if (parsed.length > 0) verses = parsed;
  }

  const today = new Date();
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  const verseRef = verses[seed % verses.length];

  const [data, setData] = useState<VerseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setData(null);

    fetch(
      `https://bible-api.com/${encodeURIComponent(verseRef)}?translation=${translation}`
    )
      .then((r) => {
        if (!r.ok) throw new Error("HTTP error");
        return r.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData({
            reference: json.reference,
            text: json.text?.trim() ?? "",
            translation_name: json.translation_name ?? translation.toUpperCase(),
          });
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [verseRef, translation]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center animate-fade-in gap-4">
      {/* Header badge */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 glass bg-gradient-to-br from-[var(--accent-teal)]/20 to-transparent rounded-xl flex items-center justify-center">
          <BookOpen size={16} className="text-[var(--accent-teal)]" />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Verse of the Day
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-0 overflow-hidden">
        {loading && (
          <p className="text-sm text-[var(--text-secondary)] animate-pulse">
            Loading verse…
          </p>
        )}

        {error && !loading && (
          <>
            <p className="text-base italic text-[var(--text-secondary)] leading-relaxed">
              Unable to load verse
            </p>
            <p className="text-sm font-semibold text-[var(--accent-teal)]">
              {verseRef}
            </p>
          </>
        )}

        {data && !loading && (
          <>
            <p className="text-lg italic leading-relaxed text-[var(--text-primary)] drop-shadow-[0_0_10px_rgba(0,212,170,0.2)] line-clamp-6">
              &ldquo;{data.text}&rdquo;
            </p>
            <div className="flex flex-col items-center gap-0.5">
              <p className="text-sm font-bold text-[var(--accent-teal)]">
                {data.reference}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                {data.translation_name}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
