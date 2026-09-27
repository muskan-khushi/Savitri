'use client';

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center px-6">
      <p className="text-4xl">⚠️</p>
      <h2 className="text-lg font-semibold text-soil">Something went wrong</h2>
      <p className="text-sm text-soil/55 max-w-sm">{error.message ?? 'An unexpected error occurred in the dashboard.'}</p>
      <button
        onClick={reset}
        className="rounded-full bg-soil px-6 py-2 text-sm font-semibold text-cream hover:bg-terracotta transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
