import { EmptyState } from "@/components/app/empty-state";
import { RecurringForm } from "@/components/recurring/recurring-form";
import { RecurringToggleButton } from "@/components/recurring/recurring-toggle-button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";
import { formatEur } from "@/lib/format";
import { categoriesPickerOrFilter } from "@/lib/supabase/categories-picker-filter";
import Link from "next/link";

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, user } = await requireUser();

  const [{ data: templates }, { data: categories }, { data: buckets }] = await Promise.all([
    supabase
      .from("recurring_entry_templates")
      .select(
        "id,title,amount,transaction_type,frequency,next_due_at,is_active,categories(name),buckets(name)",
      )
      .order("next_due_at", { ascending: true }),
    supabase
      .from("categories")
      .select("id,name")
      .or(categoriesPickerOrFilter(user.id))
      .order("name"),
    supabase.from("buckets").select("id,name,type").eq("is_archived", false).order("name"),
  ]);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Recurring
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Templates only for now — automation can be layered in later without changing this
          structure.
        </p>
      </header>

      {sp.saved === "1" ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100">
          Template saved.
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Templates</h2>
        {!templates?.length ? (
          <EmptyState
            title="No recurring templates"
            description="Add rent, subscriptions, or salary reminders."
          />
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900/40">
            {templates.map((t) => {
              const cat =
                t.categories && typeof t.categories === "object" && "name" in t.categories
                  ? String((t.categories as { name: string }).name)
                  : "—";
              const bkt =
                t.buckets && typeof t.buckets === "object" && "name" in t.buckets
                  ? String((t.buckets as { name: string }).name)
                  : null;
              return (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{t.title}</p>
                    <p className="text-xs text-slate-500">
                      {cat}
                      {bkt ? ` · ${bkt}` : ""} · {t.frequency} · next{" "}
                      {new Date(t.next_due_at).toLocaleString()}
                      {!t.is_active ? " · paused" : ""}
                    </p>
                    <Link
                      href={`/app/recurring/${t.id}/edit`}
                      className="mt-1 inline-block text-xs font-medium text-slate-500 underline"
                    >
                      Edit
                    </Link>
                  </div>
                  <div className="flex items-center gap-3">
                    <p
                      className={
                        t.transaction_type === "income"
                          ? "text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400"
                          : "text-sm font-semibold tabular-nums text-rose-700 dark:text-rose-400"
                      }
                    >
                      {t.transaction_type === "income" ? "+" : "−"}
                      {formatEur(Number(t.amount))}
                    </p>
                    <RecurringToggleButton templateId={t.id} isActive={t.is_active} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Card>
        <CardTitle>New template</CardTitle>
        <CardDescription>
          We store the schedule — generation can be manual or automated later.
        </CardDescription>
        <div className="mt-6">
          <RecurringForm categories={categories ?? []} buckets={buckets ?? []} />
        </div>
      </Card>
    </div>
  );
}
