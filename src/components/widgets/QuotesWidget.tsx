"use client";

type Widget = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config: string | null;
};

type Quote = { text: string; author: string };

const DEFAULT_QUOTES: Quote[] = [
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Focus is about saying no.", author: "Steve Jobs" },
  { text: "Have no fear of perfection — you'll never reach it.", author: "Salvador Dalí" },
  { text: "Make it simple, but significant.", author: "Don Draper" }
];

function parseCustomQuotes(raw: string): Quote[] {
  return raw
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const dashIdx = line.lastIndexOf(" — ");
      if (dashIdx !== -1) {
        return { text: line.slice(0, dashIdx).trim(), author: line.slice(dashIdx + 3).trim() };
      }
      const hyphenIdx = line.lastIndexOf(" - ");
      if (hyphenIdx !== -1) {
        return { text: line.slice(0, hyphenIdx).trim(), author: line.slice(hyphenIdx + 3).trim() };
      }
      return { text: line, author: "" };
    });
}

export function QuotesWidget({ widget }: { widget: Widget }) {
  const config = widget.config ? (() => { try { return JSON.parse(widget.config!); } catch { return {}; } })() : {};

  let quotes = DEFAULT_QUOTES;
  if (config.customQuotes && typeof config.customQuotes === "string" && config.customQuotes.trim()) {
    const parsed = parseCustomQuotes(config.customQuotes);
    if (parsed.length > 0) quotes = parsed;
  }

  const rotationMode: "daily" | "random" = config.rotationMode || "daily";
  let quoteIndex: number;
  if (rotationMode === "random") {
    // Stable per-day random: seed from date so it doesn't change on every render
    const seed = new Date().getFullYear() * 1000 + new Date().getMonth() * 31 + new Date().getDate();
    quoteIndex = seed % quotes.length;
  } else {
    quoteIndex = new Date().getDay() % quotes.length;
  }
  const quote = quotes[quoteIndex];

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-10 text-center animate-fade-in">
      <div className="text-2xl italic leading-relaxed text-[var(--text-primary)] drop-shadow-[0_0_10px_rgba(0,212,170,0.2)]">
&quot;{quote.text}&quot;
      </div>
      <div className="text-base text-[var(--accent-teal)] font-medium mt-4">
        {quote.author ? <>&mdash; {quote.author}</> : null}
      </div>
    </div>
  );
}
