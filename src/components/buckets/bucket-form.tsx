"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createBucket, type BucketActionState } from "@/server/bucket-actions";
import { useActionState, useId, useState } from "react";

function fe(state: BucketActionState, key: string) {
  return state.fieldErrors?.[key];
}

const selectClass =
  "min-h-11 w-full rounded-xl border border-gh-border bg-gh-surface-inset px-3 py-2.5 text-sm text-gh-text shadow-[inset_0_1px_2px_rgb(0_0_0/0.2)] outline-none transition-[border-color,box-shadow] duration-150 focus:border-gh-accent/50 focus:ring-2 focus:ring-gh-ring/35 motion-reduce:transition-none";

export function BucketForm() {
  const [state, action, pending] = useActionState<BucketActionState, FormData>(createBucket, {});

  const [type, setType] = useState<"private" | "shared">("private");
  const [hasBudget, setHasBudget] = useState(false);
  const typeGroupId = useId();

  return (
    <form action={action} className="space-y-5 scroll-mt-24">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="Haushalt, Urlaub, …"
          className="min-h-11"
        />
        {fe(state, "name") ? (
          <p className="text-xs text-gh-error-text">{fe(state, "name")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung (optional)</Label>
        <Textarea id="description" name="description" placeholder="Was gehört in diesen Bucket?" />
        {fe(state, "description") ? (
          <p className="text-xs text-gh-error-text">{fe(state, "description")}</p>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-gh-text-muted">
          Sichtbarkeit
        </legend>
        <div
          role="radiogroup"
          aria-label="Bucket-Sichtbarkeit"
          className="grid grid-cols-2 gap-2 rounded-2xl border border-gh-border-subtle bg-gh-surface-inset/50 p-1"
        >
          {(
            [
              {
                value: "private" as const,
                label: "Privat",
                desc: "Nur für dich sichtbar.",
              },
              {
                value: "shared" as const,
                label: "Gemeinsam",
                desc: "Mit 6-stelligem Code teilbar.",
              },
            ] as const
          ).map((opt) => {
            const active = type === opt.value;
            const radioId = `${typeGroupId}-${opt.value}`;
            return (
              <label
                key={opt.value}
                htmlFor={radioId}
                className={cn(
                  "relative flex min-h-[3.5rem] cursor-pointer flex-col items-start justify-center rounded-xl px-3 py-2 text-left transition-[background-color,color,box-shadow] duration-150 motion-reduce:transition-none",
                  active
                    ? "bg-gh-accent-muted text-gh-accent shadow-[inset_0_0_0_1px_rgb(106_158_148/0.35)]"
                    : "text-gh-text-secondary hover:bg-gh-surface-elevated hover:text-gh-text",
                )}
              >
                <input
                  id={radioId}
                  type="radio"
                  name="type"
                  value={opt.value}
                  checked={active}
                  onChange={() => setType(opt.value)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{opt.label}</span>
                <span
                  className={cn(
                    "text-[11px] leading-tight",
                    active ? "text-gh-accent/80" : "text-gh-text-muted",
                  )}
                >
                  {opt.desc}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex min-h-11 items-center gap-3 rounded-2xl border border-gh-border-subtle bg-gh-surface-inset/30 px-4 py-3 ring-1 ring-gh-border-subtle">
        <input
          id="has_budget"
          name="has_budget"
          type="checkbox"
          checked={hasBudget}
          onChange={(e) => setHasBudget(e.target.checked)}
          className="h-5 w-5 rounded border-gh-border text-gh-accent focus:ring-gh-ring"
        />
        <Label htmlFor="has_budget" className="!normal-case !text-sm !font-medium !text-gh-text-secondary">
          Monatsbudget aktivieren
        </Label>
      </div>

      {hasBudget ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="budget_amount">Budgetbetrag (EUR)</Label>
            <Input
              id="budget_amount"
              name="budget_amount"
              inputMode="decimal"
              placeholder="z. B. 500"
              className="min-h-11"
            />
            {fe(state, "budget_amount") ? (
              <p className="text-xs text-gh-error-text">{fe(state, "budget_amount")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget_period">Periode</Label>
            <select
              id="budget_period"
              name="budget_period"
              defaultValue="monthly"
              className={selectClass}
            >
              <option value="monthly">Monatlich</option>
              <option value="none">Keine</option>
            </select>
          </div>
        </div>
      ) : (
        <>
          <input type="hidden" name="budget_amount" value="" />
          <input type="hidden" name="budget_period" value="none" />
        </>
      )}

      {type === "shared" ? (
        <p className="rounded-xl border border-gh-accent/25 bg-gh-accent-muted/60 px-3 py-2 text-xs text-gh-accent">
          Ein 6-stelliger Beitrittscode wird automatisch erstellt. Teile ihn mit Personen, die
          Mitglied werden sollen.
        </p>
      ) : null}

      {state.error ? <p className="text-sm text-gh-error-text">{state.error}</p> : null}
      <Button type="submit" className="min-h-12 w-full rounded-2xl sm:w-auto" disabled={pending}>
        {pending
          ? "Erstellen…"
          : type === "shared"
            ? "Gemeinsamen Bucket erstellen"
            : "Bucket erstellen"}
      </Button>
    </form>
  );
}
