"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createEntry, updateEntry, type EntryActionState } from "@/server/entry-actions";
import Link from "next/link";
import { useActionState, useId, useRef, useState, type FormEvent } from "react";

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

function mergedFieldErr(
  state: EntryActionState,
  clientErrors: Record<string, string>,
  key: string,
) {
  return clientErrors[key] ?? state.fieldErrors?.[key];
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
  categoriesLoadError = false,
}: {
  categories: Category[];
  buckets: Bucket[];
  mode?: "create" | "edit";
  initial?: EntryInitial;
  defaultBucketId?: string | null;
  variant?: "default" | "compact";
  returnTo?: string | null;
  /** True if loading categories from the DB failed (e.g. broken RLS or missing column). */
  categoriesLoadError?: boolean;
}) {
  const action = mode === "edit" ? updateEntry : createEntry;
  const [state, formAction, pending] = useActionState<EntryActionState, FormData>(action, {});

  const noCategories = categories.length === 0;
  // In edit mode an existing category_id can still be saved even if the picker is empty.
  const blockSubmit = mode === "create" && noCategories;

  const initialType = initial?.transaction_type ?? "expense";
  const [txType, setTxType] = useState<"income" | "expense">(initialType);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement | null>(null);
  const groupId = useId();

  const defaultDate = new Date();
  defaultDate.setMinutes(defaultDate.getMinutes() - defaultDate.getTimezoneOffset());
  const defaultValue = defaultDate.toISOString().slice(0, 16);

  const occurredValue =
    initial?.occurred_at != null
      ? new Date(initial.occurred_at).toISOString().slice(0, 16)
      : defaultValue;

  const defaultBucket = initial?.bucket_id ?? defaultBucketId ?? "none";

  const validate = (fd: FormData): Record<string, string> => {
    const errs: Record<string, string> = {};
    const amount = String(fd.get("amount") ?? "").trim();
    const title = String(fd.get("title") ?? "").trim();
    const categoryId = String(fd.get("category_id") ?? "").trim();
    const occurredAt = String(fd.get("occurred_at") ?? "").trim();

    if (!amount) {
      errs.amount = "Betrag ist erforderlich.";
    } else {
      const n = Number.parseFloat(amount.replace(",", "."));
      if (!Number.isFinite(n) || n < 0) {
        errs.amount = "Bitte einen gültigen, nicht-negativen Betrag eingeben.";
      }
    }
    if (!title) errs.title = "Bezeichnung ist erforderlich.";
    if (!categoryId) errs.category_id = "Bitte eine Kategorie wählen.";
    if (!occurredAt) errs.occurred_at = "Datum ist erforderlich.";
    return errs;
  };

  const focusFirstError = (errs: Record<string, string>) => {
    const order = ["amount", "occurred_at", "title", "category_id"];
    const form = formRef.current;
    if (!form) return;
    for (const key of order) {
      if (!errs[key]) continue;
      const el = form.querySelector<HTMLElement>(`[name="${key}"]`);
      if (el && typeof (el as HTMLElement & { focus?: () => void }).focus === "function") {
        (el as HTMLElement & { focus: () => void }).focus();
      }
      break;
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const fd = new FormData(event.currentTarget);
    const errs = validate(fd);
    if (Object.keys(errs).length > 0) {
      event.preventDefault();
      setClientErrors(errs);
      focusFirstError(errs);
      return;
    }
    setClientErrors({});
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5 scroll-mt-24"
    >
      {mode === "edit" && initial ? (
        <input type="hidden" name="entry_id" value={initial.id} />
      ) : null}
      {mode === "create" && returnTo ? (
        <input type="hidden" name="return_to" value={returnTo} />
      ) : null}

      {mode === "create" && noCategories ? (
        <div
          role="alert"
          className="rounded-2xl border border-gh-warning/30 bg-gh-warning-soft px-4 py-3 text-sm text-gh-warning"
        >
          {categoriesLoadError ? (
            <>
              <p className="font-medium">Kategorien konnten nicht geladen werden.</p>
              <p className="mt-1 text-xs">
                Wahrscheinlich fehlt eine Datenbank-Migration. Bitte{" "}
                <code className="rounded bg-gh-surface-inset/60 px-1 py-0.5">
                  supabase/migrations/20260415210000_categories_is_archived.sql
                </code>{" "}
                anwenden (siehe docs/setup.md).
              </p>
            </>
          ) : (
            <>
              <p className="font-medium">Keine Kategorien verfügbar.</p>
              <p className="mt-1 text-xs">
                Bitte zuerst eine Kategorie anlegen — danach lassen sich Einträge speichern.
              </p>
              <p className="mt-2">
                <Link
                  href="/app/categories"
                  className="font-medium underline decoration-gh-warning/50 underline-offset-2 hover:text-gh-warning"
                >
                  Kategorien öffnen
                </Link>
              </p>
            </>
          )}
        </div>
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
            aria-invalid={!!mergedFieldErr(state, clientErrors, "amount")}
            aria-describedby={
              mergedFieldErr(state, clientErrors, "amount") ? "amount-error" : undefined
            }
          />
          {mergedFieldErr(state, clientErrors, "amount") ? (
            <p id="amount-error" className="text-xs text-gh-error-text">
              {mergedFieldErr(state, clientErrors, "amount")}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="occurred_at">Datum &amp; Uhrzeit</Label>
          <Input
            id="occurred_at"
            name="occurred_at"
            type="datetime-local"
            defaultValue={occurredValue}
            className="min-h-11"
            aria-invalid={!!mergedFieldErr(state, clientErrors, "occurred_at")}
            aria-describedby={
              mergedFieldErr(state, clientErrors, "occurred_at") ? "occurred_at-error" : undefined
            }
          />
          {mergedFieldErr(state, clientErrors, "occurred_at") ? (
            <p id="occurred_at-error" className="text-xs text-gh-error-text">
              {mergedFieldErr(state, clientErrors, "occurred_at")}
            </p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Bezeichnung</Label>
          <Input
            id="title"
            name="title"
            placeholder="Kurzer Titel"
            defaultValue={initial?.title}
            className="min-h-11"
            aria-invalid={!!mergedFieldErr(state, clientErrors, "title")}
            aria-describedby={
              mergedFieldErr(state, clientErrors, "title") ? "title-error" : undefined
            }
          />
          {mergedFieldErr(state, clientErrors, "title") ? (
            <p id="title-error" className="text-xs text-gh-error-text">
              {mergedFieldErr(state, clientErrors, "title")}
            </p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="category_id">Kategorie</Label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={initial?.category_id ?? ""}
            className={selectClass}
            aria-invalid={!!mergedFieldErr(state, clientErrors, "category_id")}
            aria-describedby={
              mergedFieldErr(state, clientErrors, "category_id") ? "category_id-error" : undefined
            }
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
          {mergedFieldErr(state, clientErrors, "category_id") ? (
            <p id="category_id-error" className="text-xs text-gh-error-text">
              {mergedFieldErr(state, clientErrors, "category_id")}
            </p>
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
          {mergedFieldErr(state, clientErrors, "bucket_id") ? (
            <p className="text-xs text-gh-error-text">
              {mergedFieldErr(state, clientErrors, "bucket_id")}
            </p>
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
      <Button
        type="submit"
        className="min-h-12 w-full rounded-2xl sm:w-auto"
        disabled={pending || blockSubmit}
        aria-disabled={pending || blockSubmit}
      >
        {pending ? "Speichern…" : mode === "edit" ? "Änderungen speichern" : "Eintrag speichern"}
      </Button>
    </form>
  );
}
