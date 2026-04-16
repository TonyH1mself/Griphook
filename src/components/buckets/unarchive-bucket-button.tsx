"use client";

import { Button } from "@/components/ui/button";
import { unarchiveBucket } from "@/server/bucket-actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function UnarchiveBucketButton({
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
        className="min-h-11 w-full rounded-2xl sm:w-auto"
        disabled={pending}
        onClick={() => {
          setError(null);
          if (!window.confirm(`Restore “${bucketName}” to your active buckets?`)) return;
          startTransition(async () => {
            const r = await unarchiveBucket(bucketId);
            if (r.error) {
              setError(r.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "Restoring…" : "Restore bucket"}
      </Button>
      {error ? <p className="text-xs text-gh-error-text">{error}</p> : null}
    </div>
  );
}
