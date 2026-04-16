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
          className="text-sm font-medium text-gh-text-muted transition-colors hover:text-gh-accent"
        >
          ← Geteilt
        </Link>
        {sp.rebalance === "1" ? (
          <p className="mt-4 rounded-2xl border border-gh-warning/30 bg-gh-warning-soft px-4 py-3 text-sm text-gh-warning">
            Du bist diesem Bucket beigetreten. Bitte eine:n Admin, die Anteile so anzupassen, dass
            sie zusammen 100 % ergeben.
          </p>
        ) : null}
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-gh-text">{bucket.name}</h1>
        <p className="mt-1 text-sm text-gh-text-muted">
          Fairness · dieser Monat · {formatEur(totalExpenses)} gemeinsame Ausgaben
        </p>
      </div>

      <Card>
        <CardTitle>Soll / Ist / Delta</CardTitle>
        <CardDescription>
          Soll basiert auf dem Anteil an den gemeinsamen Ausgaben. Ist ist, was die Person als
          Zahler:in diesen Monat erfasst hat.
        </CardDescription>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gh-text-muted">
              <tr>
                <th className="py-2 pr-4 font-medium">Mitglied</th>
                <th className="py-2 pr-4 font-medium">Anteil</th>
                <th className="py-2 pr-4 font-medium">Soll</th>
                <th className="py-2 pr-4 font-medium">Ist</th>
                <th className="py-2 font-medium">Δ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gh-border-subtle">
              {breakdown.map((row) => {
                const p = profileById.get(row.userId);
                const label = p?.display_name || p?.username || row.userId.slice(0, 8);
                return (
                  <tr key={row.userId}>
                    <td className="py-3 pr-4 font-medium text-gh-text">{label}</td>
                    <td className="py-3 pr-4 tabular-nums text-gh-text-secondary">
                      {row.sharePercent.toFixed(1)} %
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-gh-text-secondary">
                      {formatEur(row.shareAmount)}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-gh-text-secondary">
                      {formatEur(row.actualAmount)}
                    </td>
                    <td className="py-3 tabular-nums text-gh-text">{formatEur(row.delta)}</td>
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
