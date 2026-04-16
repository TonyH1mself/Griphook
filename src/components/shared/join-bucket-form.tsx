"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinBucketByCode, type JoinActionState } from "@/server/join-actions";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

function fe(state: JoinActionState, key: string) {
  return state.fieldErrors?.[key];
}

export function JoinBucketForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<JoinActionState, FormData>(joinBucketByCode, {});

  useEffect(() => {
    if (state.successBucketId) {
      const q = state.rebalanceHint ? "?rebalance=1" : "";
      router.replace(`/app/shared/${state.successBucketId}${q}`);
      router.refresh();
    }
  }, [state.successBucketId, state.rebalanceHint, router]);

  return (
    <form action={action} className="space-y-4 scroll-mt-24">
      <div className="space-y-2">
        <Label htmlFor="code">6-digit code</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="000000"
          autoComplete="one-time-code"
          className="min-h-11 text-center text-lg tracking-[0.35em] tabular-nums"
          aria-invalid={!!fe(state, "code")}
        />
        {fe(state, "code") ? (
          <p className="text-xs text-gh-error-text">{fe(state, "code")}</p>
        ) : null}
      </div>
      {state.error ? <p className="text-sm text-gh-error-text">{state.error}</p> : null}
      <Button type="submit" className="min-h-12 w-full rounded-2xl" disabled={pending}>
        {pending ? "Joining…" : "Join bucket"}
      </Button>
    </form>
  );
}
