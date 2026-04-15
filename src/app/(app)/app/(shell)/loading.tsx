export default function AppShellLoading() {
  return (
    <div className="animate-pulse space-y-8" aria-hidden>
      <div className="h-8 w-40 rounded-lg bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      <div className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
