"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, Check, Trash2, ImageIcon } from "lucide-react";

interface PhotoPickerProps {
  selected: string[];
  onChange: (photos: string[]) => void;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export function PhotoPicker({ selected, onChange }: PhotoPickerProps) {
  const [library, setLibrary] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadLibrary = useCallback(async () => {
    const res = await fetch("/api/photos");
    const data = await res.json();
    setLibrary(data.photos || []);
  }, []);

  useEffect(() => { loadLibrary(); }, [loadLibrary]);

  const handleUpload = async (files: FileList) => {
    setUploadError(null);
    const allFiles = Array.from(files);

    const tooLarge = allFiles.filter(f => f.size > MAX_FILE_SIZE);
    const wrongType = allFiles.filter(f => !ALLOWED_TYPES.includes(f.type));
    const valid = allFiles.filter(f => f.size <= MAX_FILE_SIZE && ALLOWED_TYPES.includes(f.type));

    if (tooLarge.length > 0) {
      setUploadError(`${tooLarge.map(f => f.name).join(", ")} exceed${tooLarge.length === 1 ? "s" : ""} 20 MB limit`);
      if (valid.length === 0) return;
    }
    if (wrongType.length > 0) {
      setUploadError(`${wrongType.map(f => f.name).join(", ")}: unsupported format`);
      if (valid.length === 0) return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      valid.forEach(f => formData.append("files", f));
      const res = await fetch("/api/photos/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setUploadError(data.error ?? `Upload failed (${res.status})`);
      } else {
        const data = await res.json();
        if (data.saved?.length === 0) {
          setUploadError("No files were saved — check file types and sizes");
        }
      }
      await loadLibrary();
    } catch {
      setUploadError("Network error — upload failed");
    } finally {
      setUploading(false);
    }
  };

  const togglePhoto = (url: string) => {
    if (selected.includes(url)) {
      onChange(selected.filter(p => p !== url));
    } else {
      onChange([...selected, url]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Upload area */}
      <div
        className="border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent-teal)] rounded-xl p-5 text-center cursor-pointer transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const files = e.dataTransfer.files;
          if (files.length) handleUpload(files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) handleUpload(e.target.files); e.target.value = ""; }}
        />
        <Upload size={20} className="mx-auto mb-2 text-[var(--text-secondary)]" />
        <p className="text-sm text-[var(--text-secondary)]">
          {uploading ? "Uploading…" : "Drop photos here or click to upload"}
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">JPG, PNG, WebP · Max 20 MB each</p>
      </div>
      {uploadError && (
        <p className="text-xs text-[var(--danger-color)] bg-[var(--danger-color)]/10 border border-[var(--danger-color)]/20 rounded-lg px-3 py-2">
          {uploadError}
        </p>
      )}

      {/* Gallery */}
      {library.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-4 text-[var(--text-tertiary)]">
          <ImageIcon size={28} className="opacity-30" />
          <p className="text-xs">No photos uploaded yet</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-[var(--text-secondary)]">
            {selected.length > 0
              ? `${selected.length} selected — slideshow will cycle through these`
              : "Click photos to add them to the slideshow"}
          </p>
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
            {library.map((url) => {
              const isSelected = selected.includes(url);
              return (
                <div
                  key={url}
                  onClick={() => togglePhoto(url)}
                  className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    isSelected ? "border-[var(--accent-teal)] shadow-[0_0_8px_rgba(0,212,170,0.4)]" : "border-transparent hover:border-[var(--border-color)]"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[var(--accent-teal)]/20 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-[var(--accent-teal)] flex items-center justify-center">
                        <Check size={13} className="text-black" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="flex items-center gap-1.5 text-xs text-[var(--danger-color)] hover:underline self-start"
            >
              <Trash2 size={11} /> Clear selection (use random photos)
            </button>
          )}
        </>
      )}
    </div>
  );
}
