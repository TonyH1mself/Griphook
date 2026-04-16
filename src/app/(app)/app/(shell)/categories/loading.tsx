export default function CategoriesLoading() {
  return (
    <div className="animate-pulse space-y-6 motion-reduce:animate-none" aria-hidden>
      <div className="h-8 w-48 rounded-lg bg-gh-surface-elevated" />
      <div className="h-40 rounded-2xl bg-gh-surface-elevated" />
      <div className="h-32 rounded-2xl bg-gh-surface-elevated" />
      <div className="h-48 rounded-2xl bg-gh-surface-elevated" />
    </div>
  );
}
