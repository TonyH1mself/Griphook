"use client";

import { Button } from "@/components/ui/button";
import { archiveBucket } from "@/server/bucket-actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ArchiveBucketButton({
  bucketId,
  bucketName,
}: {
  bucketId: string;
  bucketName: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="ghost"
        className="min-h-11 w-full rounded-2xl text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 sm:w-auto"
        disabled={pending}
        onClick={() => {
          setError(null);
          if (
            !window.confirm(
              `Archive “${bucketName}”? You can restore from the database later in a follow-up.`,
            )
          )
            return;
          startTransition(async () => {
            const r = await archiveBucket(bucketId);
            if (r.error) {
              setError(r.error);
              return;
            }
            router.push("/app/buckets");
            router.refresh();
          });
        }}
      >
        {pending ? "Archiving…" : "Archive bucket"}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
