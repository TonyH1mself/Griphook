"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBucketBudget, type BucketActionState } from "@/server/bucket-actions";
import { useActionState } from "react";

function fe(s: BucketActionState, k: string) {
  return s.fieldErrors?.[k];
}

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
      <div className="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-slate-800">
        <input
          id={`bdg-on-${bucketId}`}
          name="has_budget"
          type="checkbox"
          defaultChecked={hasBudget}
          className="h-5 w-5 rounded border-slate-300"
        />
        <Label htmlFor={`bdg-on-${bucketId}`} className="!normal-case !text-sm !font-medium">
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
            <p className="text-xs text-red-600">{fe(state, "budget_amount")}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`bdg-per-${bucketId}`}>Period</Label>
          <select
            id={`bdg-per-${bucketId}`}
            name="budget_period"
            defaultValue={budgetPeriod === "monthly" ? "monthly" : "none"}
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="monthly">Monthly</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <Button type="submit" variant="secondary" className="min-h-11 rounded-2xl" disabled={pending}>
        {pending ? "Saving…" : "Save budget"}
      </Button>
    </form>
  );
}
