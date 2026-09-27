'use client';
import Link from 'next/link';

export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream text-center px-6">
      <p className="text-5xl">⚠️</p>
      <h1 className="text-2xl font-bold text-soil">Something went wrong</h1>
      <p className="text-sm text-soil/55 max-w-sm">{error.message ?? 'An unexpected error occurred.'}</p>
      <div className="flex gap-3 mt-2">
        <button onClick={reset} className="rounded-full bg-soil px-6 py-3 text-sm font-semibold text-cream hover:bg-terracotta transition-colors">Retry</button>
        <Link href="/" className="rounded-full border border-soil/20 px-6 py-3 text-sm font-medium text-soil hover:bg-wheat/40 transition-colors">Home</Link>
      </div>
    </div>
  );
}
