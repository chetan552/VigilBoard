"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function IcsSyncButton({ assignee, url }: { assignee: string; url: string }) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch("/api/homework/import-ics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignee, url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult(data.error || "Sync failed");
      } else {
        const parts: string[] = [];
        if (data.imported > 0) parts.push(`${data.imported} new`);
        if (data.updated > 0) parts.push(`${data.updated} updated`);
        if (parts.length === 0) parts.push("up to date");
        setResult(parts.join(", "));
        router.refresh();
      }
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Network error");
    } finally {
      setSyncing(false);
      setTimeout(() => setResult(null), 6000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSync}
        disabled={syncing}
        title="Sync now"
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--accent-teal)] border border-[var(--accent-teal)]/30 rounded-lg hover:bg-[var(--accent-teal)]/10 transition-colors disabled:opacity-50"
      >
        <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
        {syncing ? "Syncing…" : "Sync"}
      </button>
      {result && (
        <span className={`text-xs ${result.toLowerCase().includes("fail") || result.toLowerCase().includes("error") ? "text-red-400" : "text-green-400"}`}>
          {result}
        </span>
      )}
    </div>
  );
}
