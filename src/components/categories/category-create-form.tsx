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
          placeholder="Groceries, Transit, …"
          className="min-h-11"
          autoComplete="off"
        />
        {fe(state, "name") ? (
          <p className="text-xs text-red-600 dark:text-red-400">{fe(state, "name")}</p>
        ) : null}
      </div>
      <Button type="submit" className="min-h-11 rounded-2xl" disabled={pending}>
        {pending ? "Adding…" : "Add category"}
      </Button>
      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">Category added.</p>
      ) : null}
    </form>
  );
}
