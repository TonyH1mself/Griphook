"use client";

import { Button } from "@/components/ui/button";
import { setRecurringTemplateActive } from "@/server/recurring-actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function RecurringToggleButton({
  templateId,
  isActive,
}: {
  templateId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="secondary"
        className="min-h-9 rounded-xl px-3 text-xs"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const r = await setRecurringTemplateActive(templateId, !isActive);
            if (r.error) {
              setError(r.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "…" : isActive ? "Pausieren" : "Fortsetzen"}
      </Button>
      {error ? <span className="text-xs text-gh-error-text">{error}</span> : null}
    </div>
  );
}
