export default function BucketDetailLoading() {
  return (
    <div className="animate-pulse space-y-8" aria-hidden>
      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-9 w-3/4 max-w-md rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-full max-w-lg rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
