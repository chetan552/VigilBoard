"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-primary)] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-[var(--danger-color)] leading-none mb-4">!</div>
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-[var(--text-secondary)] mb-8">
          An unexpected error occurred. You can try again or go back to the admin panel.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-[var(--accent-teal)] text-black font-bold rounded-xl hover:bg-teal-400 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/admin"
            className="px-5 py-2.5 border border-[var(--border-color)] rounded-xl hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)] transition-colors"
          >
            Go to Admin
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-[var(--text-tertiary)] font-mono">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
