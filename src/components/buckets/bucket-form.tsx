"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBucket, type BucketActionState } from "@/server/bucket-actions";
import { useActionState } from "react";

export function BucketForm() {
  const [state, action, pending] = useActionState<BucketActionState, FormData>(createBucket, {});

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required placeholder="Household, Vacation, …" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" name="description" placeholder="What belongs in this bucket?" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Visibility</Label>
        <select
          id="type"
          name="type"
          defaultValue="private"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
        >
          <option value="private">Private</option>
          <option value="shared">Shared</option>
        </select>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-slate-800">
        <input id="has_budget" name="has_budget" type="checkbox" className="h-4 w-4 rounded border-slate-300" />
        <Label htmlFor="has_budget" className="!normal-case !text-sm !font-medium !text-slate-700 dark:!text-slate-200">
          Enable monthly budget
        </Label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="budget_amount">Budget amount (EUR)</Label>
          <Input id="budget_amount" name="budget_amount" inputMode="decimal" placeholder="Optional" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget_period">Budget period</Label>
          <select
            id="budget_period"
            name="budget_period"
            defaultValue="monthly"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
          >
            <option value="monthly">Monthly</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>
      {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      <Button type="submit" className="h-12 w-full rounded-2xl sm:w-auto" disabled={pending}>
        {pending ? "Creating…" : "Create bucket"}
      </Button>
    </form>
  );
}
