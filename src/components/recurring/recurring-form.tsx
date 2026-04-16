"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  createRecurringTemplate,
  updateRecurringTemplate,
  type RecurringActionState,
} from "@/server/recurring-actions";
import { useActionState } from "react";

type Category = { id: string; name: string };
type Bucket = { id: string; name: string; type: string };

export type RecurringInitial = {
  id: string;
  transaction_type: "income" | "expense";
  amount: string;
  title: string;
  notes: string | null;
  category_id: string;
  bucket_id: string | null;
  frequency: "monthly" | "weekly";
  next_due_at: string;
};

function fieldErr(state: RecurringActionState, key: string) {
  return state.fieldErrors?.[key];
}

const selectBase =
  "min-h-11 w-full rounded-xl border border-gh-border bg-gh-surface-inset px-3 py-2.5 text-sm text-gh-text shadow-[inset_0_1px_2px_rgb(0_0_0/0.2)] outline-none transition-[border-color,box-shadow] duration-150 focus:border-gh-accent/50 focus:ring-2 focus:ring-gh-ring/35 motion-reduce:transition-none";

const selectInvalid = "border-gh-danger/45 focus:border-gh-danger/55 focus:ring-gh-danger/20";

export function RecurringForm({
  categories,
  buckets,
  mode = "create",
  initial,
}: {
  categories: Category[];
  buckets: Bucket[];
  mode?: "create" | "edit";
  initial?: RecurringInitial;
}) {
  const serverAction = mode === "edit" ? updateRecurringTemplate : createRecurringTemplate;
  const [state, action, pending] = useActionState<RecurringActionState, FormData>(serverAction, {});

  const defaultNext = new Date();
  defaultNext.setDate(defaultNext.getDate() + 7);
  defaultNext.setMinutes(defaultNext.getMinutes() - defaultNext.getTimezoneOffset());
  const defaultNextValue = defaultNext.toISOString().slice(0, 16);

  const nextDueValue =
    initial?.next_due_at != null
      ? new Date(initial.next_due_at).toISOString().slice(0, 16)
      : defaultNextValue;

  const defaultBucket = initial?.bucket_id ?? "none";

  return (
    <form action={action} className="space-y-5 scroll-mt-24">
      {mode === "edit" && initial ? (
        <input type="hidden" name="template_id" value={initial.id} />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="transaction_type">Type</Label>
          <select
            id="transaction_type"
            name="transaction_type"
            defaultValue={initial?.transaction_type ?? "expense"}
            className={cn(selectBase, fieldErr(state, "transaction_type") && selectInvalid)}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (EUR)</Label>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            required
            defaultValue={initial?.amount}
            className="min-h-11 text-lg tabular-nums"
            aria-invalid={!!fieldErr(state, "amount")}
          />
          {fieldErr(state, "amount") ? (
            <p className="text-xs text-gh-error-text">{fieldErr(state, "amount")}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <select
            id="frequency"
            name="frequency"
            defaultValue={initial?.frequency ?? "monthly"}
            className={cn(selectBase, fieldErr(state, "frequency") && selectInvalid)}
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={initial?.title}
            className="min-h-11"
            aria-invalid={!!fieldErr(state, "title")}
          />
          {fieldErr(state, "title") ? (
            <p className="text-xs text-gh-error-text">{fieldErr(state, "title")}</p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="category_id">Category</Label>
          <select
            id="category_id"
            name="category_id"
            required
            className={cn(selectBase, fieldErr(state, "category_id") && selectInvalid)}
            defaultValue={initial?.category_id}
            aria-invalid={!!fieldErr(state, "category_id")}
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
          {fieldErr(state, "category_id") ? (
            <p className="text-xs text-gh-error-text">{fieldErr(state, "category_id")}</p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bucket_id">Bucket (optional)</Label>
          <select
            id="bucket_id"
            name="bucket_id"
            defaultValue={defaultBucket === null ? "none" : defaultBucket}
            className={cn(selectBase, fieldErr(state, "bucket_id") && selectInvalid)}
          >
            <option value="none">No bucket</option>
            {buckets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.type === "shared" ? "(shared)" : ""}
              </option>
            ))}
          </select>
          {fieldErr(state, "bucket_id") ? (
            <p className="text-xs text-gh-error-text">{fieldErr(state, "bucket_id")}</p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="next_due_at">Next due</Label>
          <Input
            id="next_due_at"
            name="next_due_at"
            type="datetime-local"
            required
            defaultValue={nextDueValue}
            className="min-h-11"
            aria-invalid={!!fieldErr(state, "next_due_at")}
          />
          {fieldErr(state, "next_due_at") ? (
            <p className="text-xs text-gh-error-text">{fieldErr(state, "next_due_at")}</p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={initial?.notes ?? ""}
            className="min-h-[4.5rem]"
            aria-invalid={!!fieldErr(state, "notes")}
          />
          {fieldErr(state, "notes") ? (
            <p className="text-xs text-gh-error-text">{fieldErr(state, "notes")}</p>
          ) : null}
        </div>
      </div>
      {state.error ? <p className="text-sm text-gh-error-text">{state.error}</p> : null}
      <Button type="submit" className="min-h-12 w-full rounded-2xl sm:w-auto" disabled={pending}>
        {pending ? "Saving…" : mode === "edit" ? "Save changes" : "Save template"}
      </Button>
    </form>
  );
}
