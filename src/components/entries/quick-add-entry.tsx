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
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Quick add</h2>
      <p className="mt-1 text-xs text-slate-500">Log an entry without leaving the dashboard.</p>
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
