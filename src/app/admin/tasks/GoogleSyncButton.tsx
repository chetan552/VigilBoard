"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Link as LinkIcon, Unlink, AlertCircle } from "lucide-react";

type GoogleList = { id: string; title: string };

interface Props {
  listName: string;
  googleTaskListId: string | null;
  lastSynced: string | null;
  onMappingChange: (listName: string, googleTaskListId: string | null) => Promise<void>;
}

export function GoogleSyncButton({ listName, googleTaskListId, lastSynced, onMappingChange }: Props) {
  const router = useRouter();
  const [googleLists, setGoogleLists] = useState<GoogleList[]>([]);
  const [connected, setConnected] = useState(true);
  const [loadingLists, setLoadingLists] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadGoogleLists = async () => {
    setLoadingLists(true);
    try {
      const res = await fetch("/api/tasks/google-lists");
      const data = await res.json();
      setGoogleLists(data.lists ?? []);
      setConnected(data.connected);
      if (data.needsReconnect) setConnected(false);
    } catch {
      setConnected(false);
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    if (showPicker) loadGoogleLists();
  }, [showPicker]);

  const handleSync = async () => {
    if (!googleTaskListId) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/tasks/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listName, googleTaskListId }),
      });
      const data = await res.json();
      if (data.error) {
        if (data.needsReconnect) setConnected(false);
        throw new Error(data.error);
      }
      setSyncResult(`Synced ${data.synced} task${data.synced !== 1 ? "s" : ""}`);
      router.refresh();
    } catch (err) {
      setSyncResult(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncResult(null), 6000);
    }
  };

  const handleMapSelect = async (id: string | null) => {
    setSaving(true);
    await onMappingChange(listName, id);
    setSaving(false);
    setShowPicker(false);
  };

  const mappedList = googleLists.find((l) => l.id === googleTaskListId);

  return (
    <div className="flex flex-col gap-2">
      {/* Mapping row */}
      <div className="flex items-center gap-2">
        {googleTaskListId ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-lg flex-1 min-w-0">
            <LinkIcon size={11} className="text-green-400 shrink-0" />
            <span className="text-xs text-green-400 truncate">
              {mappedList?.title ?? "Google Tasks"}
            </span>
          </div>
        ) : (
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[var(--text-secondary)] border border-dashed border-[var(--border-color)] hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)] rounded-lg transition-colors flex-1"
          >
            <LinkIcon size={11} /> Connect Google Tasks
          </button>
        )}

        {googleTaskListId && (
          <>
            <button
              onClick={handleSync}
              disabled={syncing}
              title="Sync now"
              aria-label="Sync now"
              className="p-1.5 text-[var(--accent-teal)] hover:bg-[var(--accent-teal)]/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setShowPicker(true)}
              title="Change mapping"
              aria-label="Change mapping"
              className="p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
            >
              <LinkIcon size={13} />
            </button>
          </>
        )}
      </div>

      {/* Status row */}
      {syncResult && (
        <p className={`text-xs ${syncResult.includes("failed") ? "text-red-400" : "text-green-400"}`}>
          {syncResult}
        </p>
      )}
      {lastSynced && !syncResult && (
        <p className="text-[10px] text-[var(--text-tertiary)]">
          Last synced {new Date(lastSynced).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      )}

      {/* List picker modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPicker(false)}>
          <div className="glass-strong border border-[var(--border-color)] rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-base mb-1">Connect to Google Tasks</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Syncing will import tasks from Google into <strong>{listName}</strong>&apos;s list.
            </p>

            {!connected ? (
              <div className="flex items-center gap-2 text-sm text-amber-400 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <AlertCircle size={16} />
                Google not connected or Tasks permission not granted. Go to{" "}
                <a href="/admin/settings" className="underline">Settings</a> to reconnect.
              </div>
            ) : loadingLists ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-[var(--accent-teal)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {googleLists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => handleMapSelect(list.id)}
                    disabled={saving}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-colors ${
                      list.id === googleTaskListId
                        ? "border-[var(--accent-teal)] bg-[var(--accent-teal)]/10 text-[var(--accent-teal)]"
                        : "border-[var(--border-color)] hover:border-[var(--accent-teal)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    <LinkIcon size={13} />
                    {list.title}
                  </button>
                ))}
                {googleLists.length === 0 && (
                  <p className="text-sm text-[var(--text-secondary)] text-center py-4">No Google Tasks lists found</p>
                )}
                {googleTaskListId && (
                  <button
                    onClick={() => handleMapSelect(null)}
                    disabled={saving}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl border border-red-500/20 transition-colors mt-1"
                  >
                    <Unlink size={12} /> Disconnect
                  </button>
                )}
              </div>
            )}

            <button onClick={() => setShowPicker(false)} className="mt-4 w-full text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-1">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
