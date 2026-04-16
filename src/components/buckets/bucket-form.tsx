"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBucket, type BucketActionState } from "@/server/bucket-actions";
import { useActionState } from "react";

function fe(state: BucketActionState, key: string) {
  return state.fieldErrors?.[key];
}

const selectClass =
  "min-h-11 w-full rounded-xl border border-gh-border bg-gh-surface-inset px-3 py-2.5 text-sm text-gh-text shadow-[inset_0_1px_2px_rgb(0_0_0/0.2)] outline-none transition-[border-color,box-shadow] duration-150 focus:border-gh-accent/50 focus:ring-2 focus:ring-gh-ring/35 motion-reduce:transition-none";

export function BucketForm() {
  const [state, action, pending] = useActionState<BucketActionState, FormData>(createBucket, {});

  return (
    <form action={action} className="space-y-5 scroll-mt-24">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="Household, Vacation, …"
          className="min-h-11"
        />
        {fe(state, "name") ? (
          <p className="text-xs text-gh-error-text">{fe(state, "name")}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" name="description" placeholder="What belongs in this bucket?" />
        {fe(state, "description") ? (
          <p className="text-xs text-gh-error-text">{fe(state, "description")}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Visibility</Label>
        <select id="type" name="type" defaultValue="private" className={selectClass}>
          <option value="private">Private</option>
          <option value="shared">Shared</option>
        </select>
      </div>
      <div className="flex min-h-11 items-center gap-3 rounded-2xl border border-gh-border-subtle bg-gh-surface-inset/30 px-4 py-3 ring-1 ring-gh-border-subtle">
        <input
          id="has_budget"
          name="has_budget"
          type="checkbox"
          className="h-5 w-5 rounded border-gh-border text-gh-accent focus:ring-gh-ring"
        />
        <Label htmlFor="has_budget" className="!normal-case !text-sm !font-medium !text-gh-text-secondary">
          Enable monthly budget
        </Label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="budget_amount">Budget amount (EUR)</Label>
          <Input
            id="budget_amount"
            name="budget_amount"
            inputMode="decimal"
            placeholder="When budget is on"
            className="min-h-11"
          />
          {fe(state, "budget_amount") ? (
            <p className="text-xs text-gh-error-text">{fe(state, "budget_amount")}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget_period">Budget period</Label>
          <select id="budget_period" name="budget_period" defaultValue="monthly" className={selectClass}>
            <option value="monthly">Monthly</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>
      {state.error ? <p className="text-sm text-gh-error-text">{state.error}</p> : null}
      <Button type="submit" className="min-h-12 w-full rounded-2xl sm:w-auto" disabled={pending}>
        {pending ? "Creating…" : "Create bucket"}
      </Button>
    </form>
  );
}
