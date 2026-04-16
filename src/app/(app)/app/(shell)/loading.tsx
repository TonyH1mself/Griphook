export default function AppShellLoading() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="animate-pulse space-y-3 motion-reduce:animate-none">
        <div className="h-9 w-44 rounded-lg bg-gh-surface-elevated" />
        <div className="h-4 w-64 max-w-full rounded bg-gh-surface-elevated" />
      </div>
      <div className="animate-pulse rounded-2xl border border-gh-border-subtle bg-gh-surface/80 p-4 motion-reduce:animate-none">
        <div className="h-4 w-24 rounded bg-gh-surface-inset" />
        <div className="mt-4 h-24 rounded-xl bg-gh-surface-inset" />
      </div>
      <div className="grid animate-pulse gap-3 sm:grid-cols-3 motion-reduce:animate-none">
        <div className="h-28 rounded-2xl bg-gh-surface-elevated" />
        <div className="h-28 rounded-2xl bg-gh-surface-elevated" />
        <div className="h-28 rounded-2xl bg-gh-surface-elevated" />
      </div>
      <div className="animate-pulse space-y-3 motion-reduce:animate-none">
        <div className="h-4 w-32 rounded bg-gh-surface-elevated" />
        <div className="h-40 rounded-2xl bg-gh-surface-elevated" />
      </div>
      <div className="animate-pulse space-y-3 motion-reduce:animate-none">
        <div className="h-4 w-40 rounded bg-gh-surface-elevated" />
        <div className="h-56 rounded-2xl bg-gh-surface-elevated" />
      </div>
    </div>
  );
}
