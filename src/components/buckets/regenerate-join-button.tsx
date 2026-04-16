"use client";

import { Button } from "@/components/ui/button";
import { regenerateJoinCode } from "@/server/bucket-actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function RegenerateJoinButton({ bucketId }: { bucketId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        className="rounded-2xl"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          setError(null);
          startTransition(async () => {
            const res = await regenerateJoinCode(bucketId);
            if (res && "error" in res && res.error) {
              setError(res.error);
              return;
            }
            if (res && "join_code" in res && res.join_code) {
              setMessage(`Neuer Code: ${res.join_code}`);
            }
            router.refresh();
          });
        }}
      >
        {pending ? "Erzeuge neu…" : "Beitrittscode neu erzeugen"}
      </Button>
      {message ? <p className="text-xs text-gh-text-muted">{message}</p> : null}
      {error ? <p className="text-xs text-gh-error-text">{error}</p> : null}
    </div>
  );
}
