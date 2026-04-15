import { EmptyState } from "@/components/app/empty-state";
import { CategoryArchiveToggle } from "@/components/categories/category-archive-toggle";
import { CategoryCreateForm } from "@/components/categories/category-create-form";
import { CategoryEditForm } from "@/components/categories/category-edit-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";
import Link from "next/link";

export default async function CategoriesPage() {
  const { supabase } = await requireUser();

  const { data: categories } = await supabase
    .from("categories")
    .select("id,name,is_system,is_archived,created_by_user_id")
    .order("is_system", { ascending: false })
    .order("name");

  const system = categories?.filter((c) => c.is_system) ?? [];
  const yoursActive = categories?.filter((c) => !c.is_system && !c.is_archived) ?? [];
  const yoursArchived = categories?.filter((c) => !c.is_system && c.is_archived) ?? [];

  return (
    <div className="space-y-10">
      <header>
        <Link
          href="/app/settings"
          className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          ← Settings
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Categories
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          System categories stay fixed. Add your own for entries and recurring templates.
        </p>
      </header>

      <Card>
        <CardTitle>New category</CardTitle>
        <CardDescription>Appears in pickers alongside GripHook defaults.</CardDescription>
        <div className="mt-6 max-w-lg">
          <CategoryCreateForm />
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Built-in</h2>
        {!system.length ? (
          <EmptyState title="No system categories" description="Check your database seed." />
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900/40">
            {system.map((c) => (
              <li key={c.id} className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                {c.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Yours</h2>
        {!yoursActive.length ? (
          <EmptyState
            title="No custom categories yet"
            description="Add one above — they stay private to your account."
          />
        ) : (
          <ul className="space-y-3">
            {yoursActive.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <CategoryEditForm categoryId={c.id} initialName={c.name} />
                  <CategoryArchiveToggle categoryId={c.id} isArchived={false} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {yoursArchived.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Archived</h2>
          <p className="text-xs text-slate-500">
            Hidden from pickers. Existing entries keep their labels.
          </p>
          <ul className="space-y-3">
            {yoursArchived.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/30"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{c.name}</p>
                  <CategoryArchiveToggle categoryId={c.id} isArchived />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
