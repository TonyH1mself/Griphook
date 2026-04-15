import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { remainingBucketBudget, sharedBucketBreakdown, summarizeMonth } from "@/lib/domain";
import { formatEur } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const { data: entries } = await supabase
    .from("entries")
    .select(
      "id,transaction_type,amount,title,occurred_at,bucket_id,created_by_user_id,categories(name)",
    )
    .gte("occurred_at", monthStart.toISOString())
    .lte("occurred_at", monthEnd.toISOString())
    .order("occurred_at", { ascending: false });

  const entryRows =
    entries?.map((e) => ({
      transaction_type: e.transaction_type as "income" | "expense",
      amount: e.amount,
      occurred_at: e.occurred_at,
    })) ?? [];

  const month = summarizeMonth(entryRows, now);

  const { data: buckets } = await supabase
    .from("buckets")
    .select("*")
    .eq("is_archived", false)
    .order("name");

  const budgetCards =
    buckets
      ?.filter((b) => b.has_budget && b.budget_period === "monthly" && b.budget_amount != null)
      .map((b) => {
        const spent =
          entries
            ?.filter(
              (e) =>
                e.bucket_id === b.id &&
                e.transaction_type === "expense" &&
                new Date(e.occurred_at) >= monthStart &&
                new Date(e.occurred_at) <= monthEnd,
            )
            .reduce((s, e) => s + Number(e.amount), 0) ?? 0;
        const remaining = remainingBucketBudget(b.budget_amount, b.budget_period, spent);
        return { bucket: b, spent, remaining };
      }) ?? [];

  const sharedBuckets = buckets?.filter((b) => b.type === "shared") ?? [];

  const sharedPreviews = await Promise.all(
    sharedBuckets.map(async (b) => {
      const { data: members } = await supabase
        .from("bucket_members")
        .select("user_id,share_percent")
        .eq("bucket_id", b.id);

      const bucketEntries =
        entries?.filter((e) => e.bucket_id === b.id && e.transaction_type === "expense") ?? [];
      const breakdown = sharedBucketBreakdown(members ?? [], bucketEntries);
      const total = bucketEntries.reduce((s, e) => s + Number(e.amount), 0);
      const maxDelta = breakdown.reduce((m, row) => Math.max(m, Math.abs(row.delta)), 0);
      return { bucket: b, total, maxDelta, breakdown };
    }),
  );

  const recent = entries?.slice(0, 8) ?? [];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">This month at a glance.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardTitle>Income</CardTitle>
          <CardDescription>Recorded this month</CardDescription>
          <p className="mt-4 text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatEur(month.income)}
          </p>
        </Card>
        <Card>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>Recorded this month</CardDescription>
          <p className="mt-4 text-2xl font-semibold tabular-nums text-rose-700 dark:text-rose-400">
            {formatEur(month.expense)}
          </p>
        </Card>
        <Card>
          <CardTitle>Balance</CardTitle>
          <CardDescription>Income minus expenses</CardDescription>
          <p className="mt-4 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
            {formatEur(month.balance)}
          </p>
        </Card>
      </section>

      {budgetCards.length ? (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Bucket budgets</h2>
            <Link href="/app/buckets" className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
              View all
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {budgetCards.map(({ bucket, spent, remaining }) => (
              <Card key={bucket.id}>
                <CardTitle>{bucket.name}</CardTitle>
                <CardDescription>
                  Spent {formatEur(spent)}
                  {remaining != null ? ` · ${formatEur(remaining)} left` : null}
                </CardDescription>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {sharedPreviews.length ? (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Shared buckets</h2>
            <Link href="/app/shared" className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
              Open shared
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {sharedPreviews.map(({ bucket, total, maxDelta }) => (
              <Card key={bucket.id}>
                <CardTitle>{bucket.name}</CardTitle>
                <CardDescription>
                  {formatEur(total)} shared expenses · largest |Δ| {formatEur(maxDelta)}
                </CardDescription>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Latest entries</h2>
          <Link href="/app/entries/new" className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
            Add entry
          </Link>
        </div>
        {recent.length === 0 ? (
          <Card>
            <CardTitle>No entries yet</CardTitle>
            <CardDescription>Capture your first income or expense to populate this month.</CardDescription>
            <Link
              href="/app/entries/new"
              className="mt-4 inline-flex text-sm font-medium text-slate-900 underline dark:text-white"
            >
              New entry
            </Link>
          </Card>
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900/40">
            {recent.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{e.title}</p>
                  <p className="text-xs text-slate-500">
                    {e.categories && typeof e.categories === "object" && "name" in e.categories
                      ? String((e.categories as { name: string }).name)
                      : "—"}{" "}
                    · {new Date(e.occurred_at).toLocaleString()}
                  </p>
                </div>
                <p
                  className={
                    e.transaction_type === "income"
                      ? "text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400"
                      : "text-sm font-semibold tabular-nums text-rose-700 dark:text-rose-400"
                  }
                >
                  {e.transaction_type === "income" ? "+" : "−"}
                  {formatEur(Number(e.amount))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
