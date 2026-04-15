import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { sharedBucketBreakdown } from "@/lib/domain";
import { formatEur } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SharedBucketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ rebalance?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: bucket } = await supabase.from("buckets").select("*").eq("id", id).maybeSingle();
  if (!bucket || bucket.type !== "shared") notFound();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const { data: members } = await supabase
    .from("bucket_members")
    .select("user_id,share_percent")
    .eq("bucket_id", id);

  const { data: entries } = await supabase
    .from("entries")
    .select("created_by_user_id,amount,transaction_type,occurred_at")
    .eq("bucket_id", id)
    .gte("occurred_at", monthStart.toISOString())
    .lte("occurred_at", monthEnd.toISOString());

  const userIds = members?.map((m) => m.user_id) ?? [];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id,username,display_name").in("id", userIds)
      : { data: [] as { id: string; username: string | null; display_name: string | null }[] };

  const profileById = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  const breakdown = sharedBucketBreakdown(members ?? [], entries ?? []);
  const totalExpenses =
    entries
      ?.filter((e) => e.transaction_type === "expense")
      .reduce((s, e) => s + Number(e.amount), 0) ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/app/shared"
          className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          ← Shared
        </Link>
        {sp.rebalance === "1" ? (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            You joined this bucket. Ask an admin to rebalance member percentages so they total 100%.
          </p>
        ) : null}
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {bucket.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Fairness view · this month · {formatEur(totalExpenses)} shared expenses
        </p>
      </div>

      <Card>
        <CardTitle>Soll / Ist / Delta</CardTitle>
        <CardDescription>
          Soll uses each member’s share of total expenses; Ist is what they actually logged as payer
          this month.
        </CardDescription>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Member</th>
                <th className="py-2 pr-4 font-medium">Share</th>
                <th className="py-2 pr-4 font-medium">Soll</th>
                <th className="py-2 pr-4 font-medium">Ist</th>
                <th className="py-2 font-medium">Δ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {breakdown.map((row) => {
                const p = profileById.get(row.userId);
                const label = p?.display_name || p?.username || row.userId.slice(0, 8);
                return (
                  <tr key={row.userId}>
                    <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">
                      {label}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-slate-600 dark:text-slate-300">
                      {row.sharePercent.toFixed(1)}%
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-slate-700 dark:text-slate-200">
                      {formatEur(row.shareAmount)}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-slate-700 dark:text-slate-200">
                      {formatEur(row.actualAmount)}
                    </td>
                    <td className="py-3 tabular-nums text-slate-900 dark:text-white">
                      {formatEur(row.delta)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
