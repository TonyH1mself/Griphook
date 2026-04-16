"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBucketBudget, type BucketActionState } from "@/server/bucket-actions";
import { useActionState } from "react";

function fe(s: BucketActionState, k: string) {
  return s.fieldErrors?.[k];
}

const selectClass =
  "min-h-11 w-full rounded-xl border border-gh-border bg-gh-surface-inset px-3 py-2.5 text-sm text-gh-text shadow-[inset_0_1px_2px_rgb(0_0_0/0.2)] outline-none transition-[border-color,box-shadow] duration-150 focus:border-gh-accent/50 focus:ring-2 focus:ring-gh-ring/35 motion-reduce:transition-none";

export function BucketBudgetForm({
  bucketId,
  hasBudget,
  budgetAmount,
  budgetPeriod,
}: {
  bucketId: string;
  hasBudget: boolean;
  budgetAmount: string | number | null;
  budgetPeriod: string;
}) {
  const bound = updateBucketBudget.bind(null, bucketId);
  const [state, action, pending] = useActionState<BucketActionState, FormData>(bound, {});

  const amt = budgetAmount != null && budgetAmount !== "" ? String(budgetAmount) : "";

  return (
    <form action={action} className="space-y-3">
      <div className="flex min-h-11 items-center gap-3 rounded-2xl border border-gh-border-subtle bg-gh-surface-inset/30 px-4 py-3 ring-1 ring-gh-border-subtle">
        <input
          id={`bdg-on-${bucketId}`}
          name="has_budget"
          type="checkbox"
          defaultChecked={hasBudget}
          className="h-5 w-5 rounded border-gh-border text-gh-accent focus:ring-gh-ring"
        />
        <Label htmlFor={`bdg-on-${bucketId}`} className="!normal-case !text-sm !font-medium !text-gh-text-secondary">
          Monthly budget cap (expenses only)
        </Label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`bdg-amt-${bucketId}`}>Amount (EUR)</Label>
          <Input
            id={`bdg-amt-${bucketId}`}
            name="budget_amount"
            inputMode="decimal"
            defaultValue={amt}
            className="min-h-11"
          />
          {fe(state, "budget_amount") ? (
            <p className="text-xs text-gh-error-text">{fe(state, "budget_amount")}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`bdg-per-${bucketId}`}>Period</Label>
          <select
            id={`bdg-per-${bucketId}`}
            name="budget_period"
            defaultValue={budgetPeriod === "monthly" ? "monthly" : "none"}
            className={selectClass}
          >
            <option value="monthly">Monthly</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>
      {state.error ? <p className="text-sm text-gh-error-text">{state.error}</p> : null}
      <Button type="submit" variant="secondary" className="min-h-11 rounded-2xl" disabled={pending}>
        {pending ? "Saving…" : "Save budget"}
      </Button>
    </form>
  );
}
