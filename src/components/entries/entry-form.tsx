"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createEntry, updateEntry, type EntryActionState } from "@/server/entry-actions";
import { useActionState, useState } from "react";

type Category = { id: string; name: string };
type Bucket = { id: string; name: string; type: string };

export type EntryInitial = {
  id: string;
  transaction_type: "income" | "expense";
  amount: string;
  title: string;
  notes: string | null;
  category_id: string;
  bucket_id: string | null;
  occurred_at: string;
};

function fieldErr(state: EntryActionState, key: string) {
  return state.fieldErrors?.[key];
}

export function EntryForm({
  categories,
  buckets,
  mode = "create",
  initial,
  defaultBucketId,
  variant = "default",
  /** After create, redirect here instead of the entries list (internal path only). */
  returnTo,
}: {
  categories: Category[];
  buckets: Bucket[];
  mode?: "create" | "edit";
  initial?: EntryInitial;
  defaultBucketId?: string | null;
  /** Hides notes for compact dashboard quick-add. */
  variant?: "default" | "compact";
  returnTo?: string | null;
}) {
  const action = mode === "edit" ? updateEntry : createEntry;
  const [state, formAction, pending] = useActionState<EntryActionState, FormData>(action, {});

  const [txType, setTxType] = useState<"income" | "expense">(
    initial?.transaction_type ?? "expense",
  );

  const defaultDate = new Date();
  defaultDate.setMinutes(defaultDate.getMinutes() - defaultDate.getTimezoneOffset());
  const defaultValue = defaultDate.toISOString().slice(0, 16);

  const occurredValue =
    initial?.occurred_at != null
      ? new Date(initial.occurred_at).toISOString().slice(0, 16)
      : defaultValue;

  const defaultBucket = initial?.bucket_id ?? defaultBucketId ?? "none";

  return (
    <form action={formAction} className="space-y-5 scroll-mt-24">
      {mode === "edit" && initial ? (
        <input type="hidden" name="entry_id" value={initial.id} />
      ) : null}
      <input type="hidden" name="transaction_type" value={txType} />
      {mode === "create" && returnTo ? (
        <input type="hidden" name="return_to" value={returnTo} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Type</Label>
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 p-1 dark:border-slate-800">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTxType(t)}
                className={cn(
                  "min-h-11 rounded-xl text-sm font-medium transition-colors",
                  txType === t
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900",
                )}
              >
                {t === "expense" ? "Expense" : "Income"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (EUR)</Label>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={initial?.amount}
            className="min-h-11 text-lg tabular-nums"
            aria-invalid={!!fieldErr(state, "amount")}
          />
          {fieldErr(state, "amount") ? (
            <p className="text-xs text-red-600 dark:text-red-400">{fieldErr(state, "amount")}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="occurred_at">When</Label>
          <Input
            id="occurred_at"
            name="occurred_at"
            type="datetime-local"
            required
            defaultValue={occurredValue}
            className="min-h-11"
            aria-invalid={!!fieldErr(state, "occurred_at")}
          />
          {fieldErr(state, "occurred_at") ? (
            <p className="text-xs text-red-600 dark:text-red-400">
              {fieldErr(state, "occurred_at")}
            </p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="Short label"
            defaultValue={initial?.title}
            required
            className="min-h-11"
            aria-invalid={!!fieldErr(state, "title")}
          />
          {fieldErr(state, "title") ? (
            <p className="text-xs text-red-600 dark:text-red-400">{fieldErr(state, "title")}</p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="category_id">Category</Label>
          <select
            id="category_id"
            name="category_id"
            required
            defaultValue={initial?.category_id}
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
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
            <p className="text-xs text-red-600 dark:text-red-400">
              {fieldErr(state, "category_id")}
            </p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bucket_id">Bucket (optional)</Label>
          <select
            id="bucket_id"
            name="bucket_id"
            defaultValue={defaultBucket === null ? "none" : defaultBucket}
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
          >
            <option value="none">No bucket</option>
            {buckets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.type === "shared" ? "(shared)" : ""}
              </option>
            ))}
          </select>
          {fieldErr(state, "bucket_id") ? (
            <p className="text-xs text-red-600 dark:text-red-400">{fieldErr(state, "bucket_id")}</p>
          ) : null}
        </div>
        {variant === "default" ? (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Optional context"
              defaultValue={initial?.notes ?? ""}
            />
          </div>
        ) : null}
      </div>
      {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      <Button type="submit" className="min-h-12 w-full rounded-2xl sm:w-auto" disabled={pending}>
        {pending ? "Saving…" : mode === "edit" ? "Save changes" : "Save entry"}
      </Button>
    </form>
  );
}
