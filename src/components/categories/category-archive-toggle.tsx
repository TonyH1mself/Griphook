"use client";

import { Button } from "@/components/ui/button";
import { setCategoryArchived } from "@/server/category-actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function CategoryArchiveToggle({
  categoryId,
  isArchived,
}: {
  categoryId: string;
  isArchived: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <Button
        type="button"
        variant="secondary"
        className="min-h-11 rounded-2xl"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const r = await setCategoryArchived(categoryId, !isArchived);
            if (r.error) {
              setError(r.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "…" : isArchived ? "Restore" : "Archive"}
      </Button>
      {error ? (
        <p className="text-xs text-gh-error-text">{error}</p>
      ) : null}
    </div>
  );
}
