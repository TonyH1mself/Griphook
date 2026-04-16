"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUserCategory, type CategoryActionState } from "@/server/category-actions";
import { useActionState } from "react";

function fe(state: CategoryActionState, key: string) {
  return state.fieldErrors?.[key];
}

export function CategoryCreateForm() {
  const [state, action, pending] = useActionState<CategoryActionState, FormData>(
    createUserCategory,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new_category_name">Name</Label>
        <Input
          id="new_category_name"
          name="name"
          required
          placeholder="Lebensmittel, Transport, …"
          className="min-h-11"
          autoComplete="off"
        />
        {fe(state, "name") ? (
          <p className="text-xs text-gh-error-text">{fe(state, "name")}</p>
        ) : null}
      </div>
      <Button type="submit" className="min-h-11 rounded-2xl" disabled={pending}>
        {pending ? "Füge hinzu…" : "Kategorie anlegen"}
      </Button>
      {state.error ? <p className="text-sm text-gh-error-text">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-gh-positive">Kategorie angelegt.</p> : null}
    </form>
  );
}
