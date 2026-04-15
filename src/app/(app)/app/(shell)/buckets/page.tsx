import { EmptyState } from "@/components/app/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { remainingBucketBudget } from "@/lib/domain";
import { formatEur } from "@/lib/format";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type StatusFilter = "active" | "archived" | "all";
type TypeFilter = "all" | "private" | "shared";

function parseStatus(raw: string | undefined): StatusFilter {
  if (raw === "archived" || raw === "all") return raw;
  return "active";
}

function parseType(raw: string | undefined): TypeFilter {
  if (raw === "private" || raw === "shared") return raw;
  return "all";
}

function filterHref(status: StatusFilter, type: TypeFilter): string {
  const p = new URLSearchParams();
  if (status !== "active") p.set("status", status);
  if (type !== "all") p.set("type", type);
  const qs = p.toString();
  return qs ? `/app/buckets?${qs}` : "/app/buckets";
}

export default async function BucketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const status = parseStatus(sp.status);
  const type = parseType(sp.type);

  const supabase = await createClient();
  let query = supabase
    .from("buckets")
    .select("id,name,type,has_budget,budget_amount,budget_period,join_code,is_archived")
    .order("name");

  if (status === "active") query = query.eq("is_archived", false);
  else if (status === "archived") query = query.eq("is_archived", true);

  if (type === "private") query = query.eq("type", "private");
  else if (type === "shared") query = query.eq("type", "shared");

  const { data: buckets } = await query;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const { data: spendRows } = await supabase
    .from("entries")
    .select("bucket_id,amount")
    .eq("transaction_type", "expense")
    .gte("occurred_at", monthStart.toISOString())
    .lte("occurred_at", monthEnd.toISOString())
    .not("bucket_id", "is", null);

  const spentByBucket = new Map<string, number>();
  for (const row of spendRows ?? []) {
    if (!row.bucket_id) continue;
    spentByBucket.set(row.bucket_id, (spentByBucket.get(row.bucket_id) ?? 0) + Number(row.amount));
  }

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: "active", label: "Active" },
    { key: "archived", label: "Archived" },
    { key: "all", label: "All" },
  ];
  const typeTabs: { key: TypeFilter; label: string }[] = [
    { key: "all", label: "All types" },
    { key: "private", label: "Private" },
    { key: "shared", label: "Shared" },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Buckets
          </h1>
          <p className="mt-1 text-sm text-slate-500">Private or shared pots — with or without a budget cap.</p>
        </div>
        <LinkButton href="/app/buckets/new">New bucket</LinkButton>
      </header>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</p>
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((t) => (
            <Link
              key={t.key}
              href={filterHref(t.key, type)}
              className={cn(
                "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium transition-colors",
                status === t.key
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Type</p>
        <div className="flex flex-wrap gap-2">
          {typeTabs.map((t) => (
            <Link
              key={t.key}
              href={filterHref(status, t.key)}
              className={cn(
                "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium transition-colors",
                type === t.key
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {!buckets?.length ? (
        <EmptyState
          title="No buckets match"
          description={
            status === "archived"
              ? "Nothing archived yet — or try another filter."
              : "Create a bucket to group spending and optional monthly caps."
          }
          action={
            status !== "archived" ? <LinkButton href="/app/buckets/new">Create bucket</LinkButton> : null
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {buckets.map((b) => {
            const spent = spentByBucket.get(b.id) ?? 0;
            const cap =
              b.has_budget && b.budget_period === "monthly" && b.budget_amount != null
                ? Number(b.budget_amount)
                : null;
            const remaining =
              cap != null && Number.isFinite(cap)
                ? remainingBucketBudget(cap, "monthly", spent)
                : null;
            const ratio = cap != null && cap > 0 ? Math.min(1.5, spent / cap) : 0;
            const over = cap != null && cap > 0 && spent > cap;
            const overBy = over && cap != null ? spent - cap : null;
            const tight = cap != null && cap > 0 && !over && ratio >= 0.85;

            return (
              <li key={b.id}>
                <Link
                  href={`/app/buckets/${b.id}`}
                  className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-4 transition-colors hover:border-slate-300 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700 dark:hover:bg-slate-900/80"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{b.name}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 font-medium",
                            b.type === "shared"
                              ? "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
                          )}
                        >
                          {b.type === "shared" ? "Shared" : "Private"}
                        </span>
                        {b.is_archived ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
                            Archived
                          </span>
                        ) : null}
                        {b.has_budget && b.budget_period === "monthly" ? (
                          <span>Monthly budget</span>
                        ) : b.has_budget ? (
                          <span>Budget</span>
                        ) : (
                          <span>No budget cap</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between tabular-nums text-slate-600 dark:text-slate-300">
                      <span>This month (expenses)</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {formatEur(spent)}
                      </span>
                    </div>
                    {cap != null && Number.isFinite(cap) ? (
                      <>
                        <div className="flex justify-between text-xs tabular-nums text-slate-500">
                          <span>of {formatEur(cap)}</span>
                          {overBy != null ? (
                            <span className="font-medium text-rose-600 dark:text-rose-400">
                              Over by {formatEur(overBy)}
                            </span>
                          ) : remaining != null ? (
                            <span>{formatEur(remaining)} left</span>
                          ) : null}
                        </div>
                        <ProgressBar
                          value={ratio > 1 ? 1 : ratio}
                          indicatorClassName={
                            over
                              ? "bg-rose-600 dark:bg-rose-500"
                              : tight
                                ? "bg-amber-500"
                                : undefined
                          }
                        />
                      </>
                    ) : (
                      <p className="text-xs text-slate-500">No monthly cap — spending still tracked.</p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
