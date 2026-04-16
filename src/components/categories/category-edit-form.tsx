"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateUserCategory, type CategoryActionState } from "@/server/category-actions";
import { useActionState } from "react";

function fe(state: CategoryActionState, key: string) {
  return state.fieldErrors?.[key];
}

export function CategoryEditForm({
  categoryId,
  initialName,
}: {
  categoryId: string;
  initialName: string;
}) {
  const [state, action, pending] = useActionState<CategoryActionState, FormData>(
    updateUserCategory,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start">
      <input type="hidden" name="category_id" value={categoryId} />
      <Input
        name="name"
        defaultValue={initialName}
        required
        className="min-h-11 min-w-[12rem] flex-1 sm:max-w-xs"
        aria-label="Kategoriename"
      />
      <Button type="submit" className="min-h-11 shrink-0 rounded-2xl" disabled={pending}>
        {pending ? "Speichere…" : "Speichern"}
      </Button>
      {fe(state, "name") ? (
        <p className="w-full text-xs text-gh-error-text">{fe(state, "name")}</p>
      ) : null}
      {state.error ? (
        <p className="w-full text-xs text-gh-error-text">{state.error}</p>
      ) : null}
      {state.ok ? <p className="w-full text-xs text-gh-positive">Gespeichert.</p> : null}
    </form>
  );
}
