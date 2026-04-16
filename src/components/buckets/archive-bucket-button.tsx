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
        className="min-h-11 w-full rounded-2xl text-gh-danger hover:bg-gh-danger-soft sm:w-auto"
        disabled={pending}
        onClick={() => {
          setError(null);
          if (
            !window.confirm(
              `„${bucketName}“ archivieren? Du kannst ihn jederzeit unter Buckets → Archiviert wiederherstellen.`,
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
        {pending ? "Archiviere…" : "Bucket archivieren"}
      </Button>
      {error ? <p className="text-xs text-gh-error-text">{error}</p> : null}
    </div>
  );
}
