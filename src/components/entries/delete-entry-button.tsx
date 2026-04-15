"use client";

import { Button } from "@/components/ui/button";
import { deleteEntry } from "@/server/entry-actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DeleteEntryButton({ entryId, title }: { entryId: string; title: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2 border-t border-slate-200 pt-6 dark:border-slate-800">
      <p className="text-sm font-medium text-slate-900 dark:text-white">Delete entry</p>
      <p className="text-xs text-slate-500">This cannot be undone.</p>
      <Button
        type="button"
        variant="ghost"
        className="min-h-11 w-full rounded-2xl text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 sm:w-auto"
        disabled={pending}
        onClick={() => {
          setError(null);
          if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
          startTransition(async () => {
            const r = await deleteEntry(entryId);
            if (r.error) {
              setError(r.error);
              return;
            }
            router.push("/app/entries");
            router.refresh();
          });
        }}
      >
        {pending ? "Deleting…" : "Delete entry"}
      </Button>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
