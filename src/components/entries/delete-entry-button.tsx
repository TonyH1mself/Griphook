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
    <div className="space-y-2 border-t border-gh-border-subtle pt-6">
      <p className="text-sm font-medium text-gh-text">Delete entry</p>
      <p className="text-xs text-gh-text-muted">This cannot be undone.</p>
      <Button
        type="button"
        variant="ghost"
        className="min-h-11 w-full rounded-2xl text-gh-danger hover:bg-gh-danger-soft sm:w-auto"
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
      {error ? <p className="text-xs text-gh-error-text">{error}</p> : null}
    </div>
  );
}
