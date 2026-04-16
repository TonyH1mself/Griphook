"use client";

import { EntryForm } from "@/components/entries/entry-form";

type Category = { id: string; name: string };
type Bucket = { id: string; name: string; type: string };

export function QuickAddEntry({
  categories,
  buckets,
  defaultBucketId,
}: {
  categories: Category[];
  buckets: Bucket[];
  defaultBucketId?: string | null;
}) {
  return (
    <section className="rounded-2xl border border-gh-border-subtle bg-gh-surface/90 p-4 shadow-gh-panel backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-gh-text">Quick add</h2>
      <p className="mt-1 text-xs text-gh-text-muted">Log an entry without leaving the dashboard.</p>
      <div className="mt-4">
        <EntryForm
          categories={categories}
          buckets={buckets}
          defaultBucketId={defaultBucketId}
          variant="compact"
          returnTo="/app"
        />
      </div>
    </section>
  );
}
