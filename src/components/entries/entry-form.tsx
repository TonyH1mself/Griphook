"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createEntry, updateEntry, type EntryActionState } from "@/server/entry-actions";
import { useActionState, useId, useState } from "react";

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

const selectClass =
  "min-h-11 w-full rounded-xl border border-gh-border bg-gh-surface-inset px-3 py-2.5 text-sm text-gh-text shadow-[inset_0_1px_2px_rgb(0_0_0/0.2)] outline-none transition-[border-color,box-shadow] duration-150 focus:border-gh-accent/50 focus:ring-2 focus:ring-gh-ring/35 motion-reduce:transition-none";

export function EntryForm({
  categories,
  buckets,
  mode = "create",
  initial,
  defaultBucketId,
  variant = "default",
  returnTo,
}: {
  categories: Category[];
  buckets: Bucket[];
  mode?: "create" | "edit";
  initial?: EntryInitial;
  defaultBucketId?: string | null;
  variant?: "default" | "compact";
  returnTo?: string | null;
}) {
  const action = mode === "edit" ? updateEntry : createEntry;
  const [state, formAction, pending] = useActionState<EntryActionState, FormData>(action, {});

  const initialType = initial?.transaction_type ?? "expense";
  const [txType, setTxType] = useState<"income" | "expense">(initialType);
  const groupId = useId();

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
      {mode === "create" && returnTo ? (
        <input type="hidden" name="return_to" value={returnTo} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="space-y-2 sm:col-span-2">
          <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-gh-text-muted">
            Typ
          </legend>
          <div
            role="radiogroup"
            aria-label="Eintragstyp"
            className="grid grid-cols-2 gap-2 rounded-2xl border border-gh-border-subtle bg-gh-surface-inset/50 p-1"
          >
            {(
              [
                { value: "expense", label: "Ausgabe" },
                { value: "income", label: "Einnahme" },
              ] as const
            ).map((opt) => {
              const active = txType === opt.value;
              const radioId = `${groupId}-${opt.value}`;
              return (
                <label
                  key={opt.value}
                  htmlFor={radioId}
                  className={cn(
                    "relative flex min-h-11 cursor-pointer items-center justify-center rounded-xl text-sm font-medium transition-[background-color,color,box-shadow] duration-150 motion-reduce:transition-none",
                    active
                      ? "bg-gh-accent-muted text-gh-accent shadow-[inset_0_0_0_1px_rgb(106_158_148/0.35)]"
                      : "text-gh-text-secondary hover:bg-gh-surface-elevated hover:text-gh-text",
                  )}
                >
                  <input
                    id={radioId}
                    type="radio"
                    name="transaction_type"
                    value={opt.value}
                    checked={active}
                    onChange={() => setTxType(opt.value)}
                    className="sr-only"
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="space-y-2">
          <Label htmlFor="amount">Betrag (EUR)</Label>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={initial?.amount}
            className="min-h-11 text-lg tabular-nums"
            aria-invalid={!!fieldErr(state, "amount")}
          />
          {fieldErr(state, "amount") ? (
            <p className="text-xs text-gh-error-text">{fieldErr(state, "amount")}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="occurred_at">Datum &amp; Uhrzeit</Label>
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
            <p className="text-xs text-gh-error-text">{fieldErr(state, "occurred_at")}</p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Bezeichnung</Label>
          <Input
            id="title"
            name="title"
            placeholder="Kurzer Titel"
            defaultValue={initial?.title}
            required
            className="min-h-11"
            aria-invalid={!!fieldErr(state, "title")}
          />
          {fieldErr(state, "title") ? (
            <p className="text-xs text-gh-error-text">{fieldErr(state, "title")}</p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="category_id">Kategorie</Label>
          <select
            id="category_id"
            name="category_id"
            required
            defaultValue={initial?.category_id ?? ""}
            className={selectClass}
            aria-invalid={!!fieldErr(state, "category_id")}
          >
            <option value="" disabled>
              Kategorie auswählen
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
            className={selectClass}
          >
            <option value="none">Kein Bucket</option>
            {buckets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.type === "shared" ? "(gemeinsam)" : ""}
              </option>
            ))}
          </select>
          {fieldErr(state, "bucket_id") ? (
            <p className="text-xs text-gh-error-text">{fieldErr(state, "bucket_id")}</p>
          ) : null}
        </div>
        {variant === "default" ? (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notizen (optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Zusätzlicher Kontext"
              defaultValue={initial?.notes ?? ""}
            />
          </div>
        ) : null}
      </div>
      {state.error ? <p className="text-sm text-gh-error-text">{state.error}</p> : null}
      <Button type="submit" className="min-h-12 w-full rounded-2xl sm:w-auto" disabled={pending}>
        {pending ? "Speichern…" : mode === "edit" ? "Änderungen speichern" : "Eintrag speichern"}
      </Button>
    </form>
  );
}
