export default function BucketDetailLoading() {
  return (
    <div className="animate-pulse space-y-6 motion-reduce:animate-none" aria-hidden>
      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-gh-surface-elevated" />
        <div className="h-9 w-3/4 max-w-md rounded-lg bg-gh-surface-elevated" />
        <div className="h-4 w-full max-w-lg rounded bg-gh-surface-elevated" />
      </div>
      <div className="h-32 rounded-2xl bg-gh-surface-elevated" />
      <div className="h-48 rounded-2xl bg-gh-surface-elevated" />
      <div className="h-64 rounded-2xl bg-gh-surface-elevated" />
    </div>
  );
}
