"use client";
import { useState, useEffect } from "react";
import { Home, Maximize2, Minimize2 } from "lucide-react";
import Link from "next/link";

export function ScreenControls({ adminHref }: { adminHref: string }) {
  const [visible, setVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const show = () => {
      setVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setVisible(false), 3000);
    };
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("mousemove", show);
    document.addEventListener("touchstart", show);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("mousemove", show);
      document.removeEventListener("touchstart", show);
      document.removeEventListener("fullscreenchange", onFsChange);
      clearTimeout(timeout);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <Link
        href={adminHref}
        className="p-2 rounded-xl glass border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-teal)] transition-colors"
        title="Back to Admin"
        aria-label="Back to Admin"
      >
        <Home size={16} />
      </Link>
      <button
        onClick={toggleFullscreen}
        className="p-2 rounded-xl glass border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-teal)] transition-colors"
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
    </div>
  );
}
