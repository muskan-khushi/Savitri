'use client';
import Link from 'next/link';

export default function MarketingError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-6">
      <p className="text-4xl">⚠️</p>
      <h2 className="text-xl font-semibold text-soil">Something went wrong</h2>
      <p className="text-sm text-soil/55 max-w-sm">{error.message ?? 'An unexpected error occurred.'}</p>
      <div className="flex gap-3">
        <button onClick={reset} className="rounded-full bg-soil px-6 py-2.5 text-sm font-semibold text-cream hover:bg-terracotta transition-colors">Try again</button>
        <Link href="/" className="rounded-full border border-soil/20 px-6 py-2.5 text-sm font-medium text-soil hover:bg-wheat/40 transition-colors">Home</Link>
      </div>
    </div>
  );
}
