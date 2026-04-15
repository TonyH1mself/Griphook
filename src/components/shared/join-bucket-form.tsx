"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinBucketByCode, type JoinActionState } from "@/server/join-actions";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

export function JoinBucketForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<JoinActionState, FormData>(joinBucketByCode, {});

  useEffect(() => {
    if (state.successBucketId) {
      router.replace(`/app/shared/${state.successBucketId}`);
      router.refresh();
    }
  }, [state.successBucketId, router]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">6-digit code</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="000000"
          required
          autoComplete="one-time-code"
        />
      </div>
      {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      <Button type="submit" className="h-12 w-full rounded-2xl" disabled={pending}>
        {pending ? "Joining…" : "Join bucket"}
      </Button>
    </form>
  );
}
