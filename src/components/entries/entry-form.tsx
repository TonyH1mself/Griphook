"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEntry, type EntryActionState } from "@/server/entry-actions";
import { useActionState } from "react";

type Category = { id: string; name: string };
type Bucket = { id: string; name: string; type: string };

export function EntryForm({ categories, buckets }: { categories: Category[]; buckets: Bucket[] }) {
  const [state, action, pending] = useActionState<EntryActionState, FormData>(createEntry, {});

  const defaultDate = new Date();
  defaultDate.setMinutes(defaultDate.getMinutes() - defaultDate.getTimezoneOffset());
  const defaultValue = defaultDate.toISOString().slice(0, 16);

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="transaction_type">Type</Label>
          <select
            id="transaction_type"
            name="transaction_type"
            defaultValue="expense"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (EUR)</Label>
          <Input id="amount" name="amount" inputMode="decimal" placeholder="0.00" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="occurred_at">When</Label>
          <Input id="occurred_at" name="occurred_at" type="datetime-local" required defaultValue={defaultValue} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="Groceries, salary, …" required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="category_id">Category</Label>
          <select
            id="category_id"
            name="category_id"
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bucket_id">Bucket (optional)</Label>
          <select
            id="bucket_id"
            name="bucket_id"
            defaultValue="none"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
          >
            <option value="none">No bucket</option>
            {buckets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.type === "shared" ? "(shared)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" name="notes" placeholder="Context, receipt hints, …" />
        </div>
      </div>
      {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      <Button type="submit" className="h-12 w-full rounded-2xl sm:w-auto" disabled={pending}>
        {pending ? "Saving…" : "Save entry"}
      </Button>
    </form>
  );
}
