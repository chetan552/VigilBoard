"use client";

import { useState, useEffect } from "react";
import { Rss, ExternalLink } from "lucide-react";

type Widget = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config: string | null;
};

type NewsItem = { title: string; link: string };

const DEFAULT_FEED = "https://feeds.bbci.co.uk/news/rss.xml";

async function fetchRssItems(feedUrl: string): Promise<NewsItem[]> {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`;
  const res = await fetch(proxyUrl, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error("Failed to fetch feed");
  const data = await res.json();
  const parser = new DOMParser();
  const doc = parser.parseFromString(data.contents, "text/xml");
  const items = Array.from(doc.querySelectorAll("item")).slice(0, 20);
  return items.map((item) => ({
    title: item.querySelector("title")?.textContent?.trim() || "",
    link: item.querySelector("link")?.textContent?.trim() || "",
  })).filter(i => i.title);
}

export function NewsWidget({ widget }: { widget: Widget }) {
  const config = widget.config ? (() => { try { return JSON.parse(widget.config!); } catch { return {}; } })() : {};
  const feedUrl = config.feedUrl || DEFAULT_FEED;
  const label = config.label || "News";
  const cycleMs = config.cycleSeconds ? parseInt(config.cycleSeconds) * 1000 : 8000;

  const [items, setItems] = useState<NewsItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const BASE_INTERVAL = 300_000; // 5 min
    const MAX_INTERVAL = 1_800_000; // 30 min
    let delay = BASE_INTERVAL;
    let timerId: ReturnType<typeof setTimeout>;

    async function load() {
      try {
        setLoading(true);
        setError(false);
        const results = await fetchRssItems(feedUrl);
        setItems(results);
        setIndex(0);
        delay = BASE_INTERVAL;
      } catch {
        setError(true);
        delay = Math.min(delay * 2, MAX_INTERVAL);
      } finally {
        setLoading(false);
        timerId = setTimeout(load, delay);
      }
    }

    load();
    return () => clearTimeout(timerId);
  }, [feedUrl]);

  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % items.length), cycleMs);
    return () => clearInterval(timer);
  }, [items.length]);

  const current = items[index];

  return (
    <div className="flex flex-col h-full w-full p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <div className="w-8 h-8 glass bg-gradient-to-br from-orange-500/20 to-transparent rounded-lg flex items-center justify-center">
          <Rss size={16} className="text-orange-400" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Live Feed</p>
          <p className="text-sm font-semibold leading-tight">{label}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-start justify-center gap-3 overflow-hidden">
        {loading && (
          <p className="text-sm text-[var(--text-secondary)] animate-pulse">Loading headlines…</p>
        )}
        {error && (
          <p className="text-sm text-[var(--danger-color)]">Failed to load feed</p>
        )}
        {!loading && !error && current && (
          <>
            <p className="text-base font-semibold leading-snug text-[var(--text-primary)] line-clamp-4">
              {current.title}
            </p>
            {current.link && (
              <a
                href={current.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[var(--accent-teal)] hover:underline"
              >
                Read more <ExternalLink size={10} />
              </a>
            )}
          </>
        )}
      </div>

      {items.length > 1 && (
        <div className="flex gap-1 mt-3 shrink-0">
          {items.slice(0, 10).map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to headline ${i + 1}`}
              className="h-6 px-0.5 flex items-center justify-center"
            >
              <span className={`block rounded-full transition-all ${i === index % 10 ? 'w-4 h-1.5 bg-orange-400' : 'w-1.5 h-1 bg-[var(--border-color)]'}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
