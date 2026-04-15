"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBucketMemberShares, type MemberSharesState } from "@/server/member-share-actions";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";

type Member = { user_id: string; share_percent: number; label: string };

function equalPercents(count: number): number[] {
  if (count <= 0) return [];
  const scaled = Array.from({ length: count }, () => Math.floor(10000 / count) / 100);
  const drift = Math.round((100 - scaled.reduce((a, b) => a + b, 0)) * 100) / 100;
  scaled[0] = Math.round((scaled[0] + drift) * 100) / 100;
  return scaled;
}

export function MemberSharesForm({ bucketId, members }: { bucketId: string; members: Member[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<MemberSharesState, FormData>(
    updateBucketMemberShares,
    {},
  );

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="bucket_id" value={bucketId} />
      <p className="text-xs text-slate-500">
        Target split of <strong>shared expenses</strong> this month (Soll). Must total 100%.
      </p>
      <ul className="space-y-3">
        {members.map((m) => (
          <li key={m.user_id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
            <Label htmlFor={`share_${m.user_id}`} className="min-w-32 text-sm font-medium">
              {m.label}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id={`share_${m.user_id}`}
                name={`share_${m.user_id}`}
                type="text"
                inputMode="decimal"
                defaultValue={Number(m.share_percent).toFixed(1)}
                className="min-h-11 w-28 tabular-nums"
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 rounded-2xl"
          onClick={() => {
            if (!formRef.current) return;
            const vals = equalPercents(members.length);
            members.forEach((m, i) => {
              const el = formRef.current?.querySelector<HTMLInputElement>(
                `[name="share_${m.user_id}"]`,
              );
              if (el) el.value = String(vals[i] ?? 0);
            });
          }}
        >
          Split evenly
        </Button>
        <Button type="submit" className="min-h-11 rounded-2xl" disabled={pending}>
          {pending ? "Saving…" : "Save shares"}
        </Button>
      </div>
      {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      {state.ok ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">Shares updated.</p>
      ) : null}
    </form>
  );
}
