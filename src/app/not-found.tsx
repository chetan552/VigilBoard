import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-primary)] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-[var(--accent-teal)] leading-none mb-4">404</div>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-[var(--text-secondary)] mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/admin"
            className="px-5 py-2.5 bg-[var(--accent-teal)] text-black font-bold rounded-xl hover:bg-teal-400 transition-colors"
          >
            Go to Admin
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 border border-[var(--border-color)] rounded-xl hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)] transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
