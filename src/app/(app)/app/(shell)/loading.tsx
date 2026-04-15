export default function AppShellLoading() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="animate-pulse space-y-3">
        <div className="h-9 w-44 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-64 max-w-full rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-4 h-24 rounded-xl bg-slate-100 dark:bg-slate-800/80" />
      </div>
      <div className="grid animate-pulse gap-3 sm:grid-cols-3">
        <div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
