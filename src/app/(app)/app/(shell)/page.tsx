import { QuickAddEntry } from "@/components/entries/quick-add-entry";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { requireUser } from "@/lib/auth/guards";
import { budgetHealthRows } from "@/lib/dashboard/budget-health";
import { sharedBucketBreakdown, summarizeMonth } from "@/lib/domain";
import { formatEur } from "@/lib/format";
import { categoriesPickerOrFilter } from "@/lib/supabase/categories-picker-filter";
import Link from "next/link";

function recurringDueLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDue = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((startDue.getTime() - startToday.getTime()) / 86400000);
  if (days < 0) return `${d.toLocaleDateString()} · overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [{ data: entries }, { data: buckets }, { data: categories }, { data: reminders }] =
    await Promise.all([
      supabase
        .from("entries")
        .select(
          "id,transaction_type,amount,title,occurred_at,bucket_id,created_by_user_id,categories(name)",
        )
        .gte("occurred_at", monthStart.toISOString())
        .lte("occurred_at", monthEnd.toISOString())
        .order("occurred_at", { ascending: false }),
      supabase.from("buckets").select("*").eq("is_archived", false).order("name"),
      supabase
        .from("categories")
        .select("id,name")
        .or(categoriesPickerOrFilter(user.id))
        .order("name"),
      supabase
        .from("recurring_entry_templates")
        .select("id,title,next_due_at,amount,transaction_type")
        .eq("is_active", true)
        .order("next_due_at", { ascending: true })
        .limit(4),
    ]);

  const entryRows =
    entries?.map((e) => ({
      transaction_type: e.transaction_type as "income" | "expense",
      amount: e.amount,
      occurred_at: e.occurred_at,
    })) ?? [];

  const month = summarizeMonth(entryRows, now);

  const quickBuckets = buckets?.map((b) => ({ id: b.id, name: b.name, type: b.type })) ?? [];

  const expensesByBucket = new Map<string, number>();
  for (const e of entries ?? []) {
    if (e.transaction_type !== "expense" || !e.bucket_id) continue;
    expensesByBucket.set(e.bucket_id, (expensesByBucket.get(e.bucket_id) ?? 0) + Number(e.amount));
  }

  const health = budgetHealthRows(buckets ?? [], expensesByBucket);
  const healthIds = new Set(health.map((h) => h.bucketId));

  const spendOnlyBuckets =
    buckets?.filter((b) => {
      const spent = expensesByBucket.get(b.id) ?? 0;
      const inHealth = healthIds.has(b.id);
      return !inHealth && spent > 0;
    }) ?? [];

  const sharedBuckets = buckets?.filter((b) => b.type === "shared") ?? [];
  const sharedIds = sharedBuckets.map((b) => b.id);

  const { data: sharedMembers } =
    sharedIds.length > 0
      ? await supabase
          .from("bucket_members")
          .select("bucket_id,user_id,share_percent")
          .in("bucket_id", sharedIds)
      : { data: [] as { bucket_id: string; user_id: string; share_percent: number }[] };

  const membersByBucket = new Map<string, { user_id: string; share_percent: number }[]>();
  for (const m of sharedMembers ?? []) {
    const list = membersByBucket.get(m.bucket_id) ?? [];
    list.push({ user_id: m.user_id, share_percent: Number(m.share_percent) });
    membersByBucket.set(m.bucket_id, list);
  }

  const sharedPreviews = sharedBuckets.map((b) => {
    const members = membersByBucket.get(b.id) ?? [];
    const bucketEntries =
      entries?.filter((e) => e.bucket_id === b.id && e.transaction_type === "expense") ?? [];
    const breakdown = sharedBucketBreakdown(members, bucketEntries);
    const total = bucketEntries.reduce((s, e) => s + Number(e.amount), 0);
    const maxDelta = breakdown.reduce((m, row) => Math.max(m, Math.abs(row.delta)), 0);
    const memberCount = members.length;
    return { bucket: b, total, maxDelta, memberCount };
  });

  const recent = entries?.slice(0, 8) ?? [];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">Your month, prioritized.</p>
      </header>

      {categories?.length ? (
        <QuickAddEntry categories={categories} buckets={quickBuckets ?? []} />
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="sm:col-span-1">
          <CardTitle className="text-base">Income</CardTitle>
          <CardDescription>This month</CardDescription>
          <p className="mt-3 text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatEur(month.income)}
          </p>
        </Card>
        <Card className="sm:col-span-1">
          <CardTitle className="text-base">Expenses</CardTitle>
          <CardDescription>This month</CardDescription>
          <p className="mt-3 text-2xl font-semibold tabular-nums text-rose-700 dark:text-rose-400">
            {formatEur(month.expense)}
          </p>
        </Card>
        <Card className="border-slate-900/10 dark:border-white/10 sm:col-span-1">
          <CardTitle className="text-base">Saldo</CardTitle>
          <CardDescription>In − out</CardDescription>
          <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
            {formatEur(month.balance)}
          </p>
        </Card>
      </section>

      {health.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Budget pressure
            </h2>
            <Link
              href="/app/buckets"
              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Buckets
            </Link>
          </div>
          <div className="grid gap-3">
            {health.slice(0, 5).map((h) => (
              <Card key={h.bucketId} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/app/buckets/${h.bucketId}`}
                      className="text-sm font-semibold text-slate-900 dark:text-white"
                    >
                      {h.name}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {h.status === "over" ? (
                        <span className="text-rose-700 dark:text-rose-400">Over cap</span>
                      ) : h.status === "tight" ? (
                        <span className="text-amber-800 dark:text-amber-200">Running tight</span>
                      ) : (
                        "On track"
                      )}{" "}
                      · {formatEur(h.spent)} / {formatEur(h.cap)}
                      {h.remaining != null ? ` · ${formatEur(h.remaining)} left` : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <ProgressBar
                    value={h.ratio > 1 ? 1 : h.ratio}
                    indicatorClassName={
                      h.status === "over"
                        ? "bg-rose-600 dark:bg-rose-500"
                        : h.status === "tight"
                          ? "bg-amber-500"
                          : undefined
                    }
                  />
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {spendOnlyBuckets.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Other bucket spending
            </h2>
            <Link
              href="/app/buckets"
              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Buckets
            </Link>
          </div>
          <p className="text-xs text-slate-500">
            No monthly cap — still tracking expenses this month.
          </p>
          <div className="grid gap-3">
            {spendOnlyBuckets.map((b) => {
              const spent = expensesByBucket.get(b.id) ?? 0;
              return (
                <Card key={b.id} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Link
                        href={`/app/buckets/${b.id}`}
                        className="text-sm font-semibold text-slate-900 dark:text-white"
                      >
                        {b.name}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        {b.type === "shared" ? "Shared" : "Private"} · {formatEur(spent)} expenses
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      {reminders && reminders.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Upcoming recurring
          </h2>
          <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200/80 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900/40">
            {reminders.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{r.title}</p>
                  <p className="text-xs text-slate-500">
                    {recurringDueLabel(r.next_due_at)} · {new Date(r.next_due_at).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm font-medium tabular-nums text-slate-700 dark:text-slate-200">
                  {formatEur(Number(r.amount))}
                </p>
              </li>
            ))}
          </ul>
          <Link href="/app/recurring" className="text-xs font-medium text-slate-500 underline">
            Manage recurring
          </Link>
        </section>
      ) : null}

      {sharedPreviews.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Shared fairness
            </h2>
            <Link
              href="/app/shared"
              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Shared
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {sharedPreviews.map(({ bucket, total, maxDelta, memberCount }) => (
              <Link key={bucket.id} href={`/app/shared/${bucket.id}`}>
                <Card className="h-full transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/80">
                  <CardTitle>{bucket.name}</CardTitle>
                  <CardDescription>
                    {memberCount} {memberCount === 1 ? "member" : "members"} · {formatEur(total)}{" "}
                    expenses · max |Δ| {formatEur(maxDelta)}
                  </CardDescription>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Latest entries</h2>
          <Link
            href="/app/entries/new"
            className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            Add
          </Link>
        </div>
        {recent.length === 0 ? (
          <Card>
            <CardTitle>No entries this month</CardTitle>
            <CardDescription>Start with a quick expense or income.</CardDescription>
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
