"use client";

import { useRef, useTransition } from "react";
import { Upload } from "lucide-react";

interface ImportScreenButtonProps {
  importAction: (name: string, widgets: unknown[]) => Promise<void>;
}

export function ImportScreenButton({ importAction }: ImportScreenButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.name || !Array.isArray(data.widgets)) {
          alert("Invalid layout file.");
          return;
        }
        startTransition(async () => {
          await importAction(data.name, data.widgets);
        });
      } catch {
        alert("Failed to parse layout file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="btn btn-secondary whitespace-nowrap disabled:opacity-50"
        title="Import a previously exported layout JSON"
      >
        <Upload size={18} /> {isPending ? "Importing…" : "Import Layout"}
      </button>
    </>
  );
}
