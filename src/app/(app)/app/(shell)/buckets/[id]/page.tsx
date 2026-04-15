import { ArchiveBucketButton } from "@/components/buckets/archive-bucket-button";
import { UnarchiveBucketButton } from "@/components/buckets/unarchive-bucket-button";
import { BucketBudgetForm } from "@/components/buckets/bucket-budget-form";
import { BucketMetaForm } from "@/components/buckets/bucket-meta-form";
import { MemberSharesForm } from "@/components/buckets/member-shares-form";
import { RegenerateJoinButton } from "@/components/buckets/regenerate-join-button";
import { EntryForm } from "@/components/entries/entry-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { remainingBucketBudget, sharedBucketBreakdown } from "@/lib/domain";
import { formatEur } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function BucketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: bucket } = await supabase.from("buckets").select("*").eq("id", id).maybeSingle();
  if (!bucket) notFound();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const { data: membership } = await supabase
    .from("bucket_members")
    .select("role")
    .eq("bucket_id", id)
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  const isPrivateOwner = bucket.type === "private" && bucket.created_by_user_id === user?.id;
  const isSharedAdmin = bucket.type === "shared" && membership?.role === "admin";
  const canManage = !bucket.is_archived && (isPrivateOwner || isSharedAdmin);

  const { data: members } = await supabase
    .from("bucket_members")
    .select("id,user_id,role,share_percent")
    .eq("bucket_id", id);

  const shareSum = members?.reduce((s, m) => s + Number(m.share_percent), 0) ?? 0;
  const shareBalanced = Math.abs(shareSum - 100) < 0.01;

  const userIds = members?.map((m) => m.user_id) ?? [];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id,username,display_name").in("id", userIds)
      : { data: [] as { id: string; username: string | null; display_name: string | null }[] };

  const profileById = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  const { data: monthEntries } = await supabase
    .from("entries")
    .select(
      "id,transaction_type,amount,title,occurred_at,created_by_user_id,category_id,categories(name)",
    )
    .eq("bucket_id", id)
    .gte("occurred_at", monthStart.toISOString())
    .lte("occurred_at", monthEnd.toISOString())
    .order("occurred_at", { ascending: false });

  const expensesMonth =
    monthEntries
      ?.filter((e) => e.transaction_type === "expense")
      .reduce((s, e) => s + Number(e.amount), 0) ?? 0;
  const incomeMonth =
    monthEntries
      ?.filter((e) => e.transaction_type === "income")
      .reduce((s, e) => s + Number(e.amount), 0) ?? 0;

  const budgetRemaining =
    bucket.has_budget && bucket.budget_period === "monthly"
      ? remainingBucketBudget(bucket.budget_amount, bucket.budget_period, expensesMonth)
      : null;

  const budgetCap = bucket.budget_amount != null ? Number(bucket.budget_amount) : null;
  const spentRatio =
    budgetCap != null && budgetCap > 0 ? Math.min(1.5, expensesMonth / budgetCap) : 0;

  const categoryTotals = new Map<string, { name: string; total: number }>();
  for (const e of monthEntries ?? []) {
    if (e.transaction_type !== "expense") continue;
    const cid = e.category_id;
    const name =
      e.categories && typeof e.categories === "object" && "name" in e.categories
        ? String((e.categories as { name: string }).name)
        : "—";
    const cur = categoryTotals.get(cid) ?? { name, total: 0 };
    cur.total += Number(e.amount);
    categoryTotals.set(cid, cur);
  }
  const categoryRows = [...categoryTotals.entries()]
    .map(([cid, v]) => ({ cid, ...v }))
    .sort((a, b) => b.total - a.total);

  const expenseRowsForShared =
    monthEntries
      ?.filter((e) => e.transaction_type === "expense")
      .map((e) => ({
        created_by_user_id: e.created_by_user_id,
        amount: e.amount,
        transaction_type: e.transaction_type,
      })) ?? [];

  const sharedBreakdown =
    bucket.type === "shared"
      ? sharedBucketBreakdown(
          members?.map((m) => ({ user_id: m.user_id, share_percent: m.share_percent })) ?? [],
          expenseRowsForShared,
        )
      : [];

  const { data: categories } = await supabase.from("categories").select("id,name").order("name");
  const { data: allBuckets } = await supabase
    .from("buckets")
    .select("id,name,type")
    .eq("is_archived", false)
    .order("name");

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/app/buckets"
          className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          ← Buckets
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {bucket.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {bucket.type === "shared" ? "Shared bucket" : "Private bucket"}
              {bucket.has_budget ? ` · Budget · ${bucket.budget_period}` : ""}
              {bucket.is_archived ? " · Archived" : ""}
            </p>
          </div>
          <Link
            href="/app/entries/new"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
          >
            Log entry elsewhere
          </Link>
        </div>
      </div>

      {bucket.is_archived ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          <p>This bucket is archived. Logging new entries here is turned off until you restore it.</p>
          {canManage ? (
            <div className="mt-4">
              <UnarchiveBucketButton bucketId={bucket.id} bucketName={bucket.name} />
            </div>
          ) : null}
        </div>
      ) : null}

      {bucket.description ? (
        <Card>
          <CardTitle>About</CardTitle>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {bucket.description}
          </p>
        </Card>
      ) : null}

      <Card>
        <CardTitle>This month in this bucket</CardTitle>
        <CardDescription>Calendar month totals for entries assigned here.</CardDescription>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Expenses</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-rose-700 dark:text-rose-400">
              {formatEur(expensesMonth)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Income</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
              {formatEur(incomeMonth)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Net (in bucket)
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900 dark:text-white">
              {formatEur(incomeMonth - expensesMonth)}
            </p>
          </div>
        </div>
      </Card>

      {bucket.has_budget && bucket.budget_period === "monthly" && budgetCap != null ? (
        <Card>
          <CardTitle>Budget</CardTitle>
          <CardDescription>
            Only expenses count against the cap (income does not refill it).
          </CardDescription>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Spent {formatEur(expensesMonth)}</span>
              <span className="font-medium tabular-nums text-slate-900 dark:text-white">
                of {formatEur(budgetCap)}
                {budgetRemaining != null ? ` · ${formatEur(budgetRemaining)} left` : ""}
              </span>
            </div>
            <ProgressBar
              value={spentRatio > 1 ? 1 : spentRatio}
              indicatorClassName={
                spentRatio >= 1
                  ? "bg-rose-600 dark:bg-rose-500"
                  : spentRatio >= 0.85
                    ? "bg-amber-500"
                    : undefined
              }
            />
            {spentRatio >= 1 ? (
              <p className="text-sm text-rose-700 dark:text-rose-400">
                Over cap for the month in this bucket.
              </p>
            ) : spentRatio >= 0.85 ? (
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Running tight — under 15% of budget left.
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}

      {categoryRows.length > 0 ? (
        <Card>
          <CardTitle>Top categories (expenses)</CardTitle>
          <CardDescription>This month, by category, inside this bucket.</CardDescription>
          <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
            {categoryRows.slice(0, 8).map((row) => (
              <li key={row.cid} className="flex justify-between py-2 text-sm">
                <span className="text-slate-700 dark:text-slate-200">{row.name}</span>
                <span className="tabular-nums font-medium text-slate-900 dark:text-white">
                  {formatEur(row.total)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {!bucket.is_archived ? (
        <Card>
          <CardTitle>Quick add</CardTitle>
          <CardDescription>Defaults to this bucket — fastest path on mobile.</CardDescription>
          <div className="mt-6">
            <EntryForm
              categories={categories ?? []}
              buckets={allBuckets ?? []}
              defaultBucketId={id}
              returnTo={`/app/buckets/${id}`}
            />
          </div>
        </Card>
      ) : null}

      <Card>
        <CardTitle>Recent entries</CardTitle>
        <CardDescription>Latest in this bucket (this month).</CardDescription>
        {!monthEntries?.length ? (
          <p className="mt-4 text-sm text-slate-500">No entries this month yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
            {monthEntries.slice(0, 15).map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{e.title}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(e.occurred_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
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
                  {e.created_by_user_id === user?.id ? (
                    <Link
                      href={`/app/entries/${e.id}/edit`}
                      className="text-xs font-medium text-slate-500 underline"
                    >
                      Edit
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {bucket.type === "shared" ? (
        <>
          <Card>
            <CardTitle>Join code</CardTitle>
            <CardDescription>Share with people who should become members.</CardDescription>
            <p className="mt-4 text-3xl font-semibold tracking-[0.25em] tabular-nums text-slate-900 dark:text-white">
              {bucket.join_code}
            </p>
            {canManage ? (
              <div className="mt-6">
                <RegenerateJoinButton bucketId={bucket.id} />
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-500">Only admins can rotate the join code.</p>
            )}
          </Card>

          <Card>
            <CardTitle>Fairness · this month</CardTitle>
            <CardDescription>Soll/Ist from shared rules — expenses only.</CardDescription>
            {!shareBalanced ? (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                Member shares sum to {shareSum.toFixed(1)}% (target 100%). Rebalance after new
                joins.
              </p>
            ) : null}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2 pr-3">Member</th>
                    <th className="py-2 pr-3">Share</th>
                    <th className="py-2 pr-3">Soll</th>
                    <th className="py-2 pr-3">Ist</th>
                    <th className="py-2">Δ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {sharedBreakdown.map((row) => {
                    const p = profileById.get(row.userId);
                    const label = p?.display_name || p?.username || row.userId.slice(0, 8);
                    return (
                      <tr key={row.userId}>
                        <td className="py-3 pr-3 font-medium text-slate-900 dark:text-white">
                          {label}
                        </td>
                        <td className="py-3 pr-3 tabular-nums text-slate-600">
                          {row.sharePercent.toFixed(1)}%
                        </td>
                        <td className="py-3 pr-3 tabular-nums">{formatEur(row.shareAmount)}</td>
                        <td className="py-3 pr-3 tabular-nums">{formatEur(row.actualAmount)}</td>
                        <td className="py-3 tabular-nums">{formatEur(row.delta)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardTitle>Members</CardTitle>
            <CardDescription>Roles and target share of household spend.</CardDescription>
            <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
              {(members ?? []).map((m) => {
                const p = profileById.get(m.user_id);
                const label = p?.display_name || p?.username || m.user_id.slice(0, 8);
                return (
                  <li key={m.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
                      <p className="text-xs text-slate-500">{m.role}</p>
                    </div>
                    <p className="text-sm tabular-nums text-slate-700 dark:text-slate-200">
                      {Number(m.share_percent).toFixed(1)}%
                    </p>
                  </li>
                );
              })}
            </ul>
            {canManage ? (
              <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Adjust shares</p>
                <p className="mt-1 text-xs text-slate-500">
                  After someone joins with a code, rebalance so the total stays at 100%.
                </p>
                <div className="mt-4">
                  <MemberSharesForm
                    bucketId={bucket.id}
                    members={(members ?? []).map((m) => {
                      const p = profileById.get(m.user_id);
                      const label =
                        p?.display_name || p?.username || m.user_id.slice(0, 8);
                      return {
                        user_id: m.user_id,
                        share_percent: Number(m.share_percent),
                        label,
                      };
                    })}
                  />
                </div>
              </div>
            ) : null}
          </Card>
        </>
      ) : null}

      {canManage ? (
        <Card>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Name and description.</CardDescription>
          <div className="mt-6 max-w-lg">
            <BucketMetaForm
              bucketId={bucket.id}
              name={bucket.name}
              description={bucket.description}
            />
          </div>
        </Card>
      ) : null}

      {canManage ? (
        <Card>
          <CardTitle>Budget settings</CardTitle>
          <CardDescription>Toggle monthly cap and amount.</CardDescription>
          <div className="mt-6 max-w-lg">
            <BucketBudgetForm
              bucketId={bucket.id}
              hasBudget={bucket.has_budget}
              budgetAmount={bucket.budget_amount}
              budgetPeriod={bucket.budget_period}
            />
          </div>
        </Card>
      ) : null}

      {canManage ? (
        <Card>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>Archiving hides the bucket from main lists.</CardDescription>
          <div className="mt-4">
            <ArchiveBucketButton bucketId={bucket.id} bucketName={bucket.name} />
          </div>
        </Card>
      ) : null}
    </div>
  );
}
