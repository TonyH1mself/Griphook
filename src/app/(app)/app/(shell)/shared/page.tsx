import { EmptyState } from "@/components/app/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { sharedBucketBreakdown } from "@/lib/domain";
import { formatEur } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function SharedPage() {
  const supabase = await createClient();
  const { data: buckets } = await supabase
    .from("buckets")
    .select("id,name,join_code,has_budget,budget_amount,budget_period")
    .eq("type", "shared")
    .eq("is_archived", false)
    .order("name");

  const ids = buckets?.map((b) => b.id) ?? [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const { data: membersRows } =
    ids.length > 0
      ? await supabase.from("bucket_members").select("bucket_id,user_id,share_percent").in("bucket_id", ids)
      : { data: [] as { bucket_id: string; user_id: string; share_percent: number }[] };

  const { data: monthEntries } =
    ids.length > 0
      ? await supabase
          .from("entries")
          .select("bucket_id,created_by_user_id,amount,transaction_type")
          .in("bucket_id", ids)
          .gte("occurred_at", monthStart.toISOString())
          .lte("occurred_at", monthEnd.toISOString())
      : { data: [] as { bucket_id: string; created_by_user_id: string; amount: unknown; transaction_type: string }[] };

  const memberCountByBucket = new Map<string, number>();
  const membersByBucket = new Map<string, { user_id: string; share_percent: number }[]>();
  for (const m of membersRows ?? []) {
    memberCountByBucket.set(m.bucket_id, (memberCountByBucket.get(m.bucket_id) ?? 0) + 1);
    const list = membersByBucket.get(m.bucket_id) ?? [];
    list.push({ user_id: m.user_id, share_percent: Number(m.share_percent) });
    membersByBucket.set(m.bucket_id, list);
  }

  const entriesByBucket = new Map<string, typeof monthEntries>();
  for (const e of monthEntries ?? []) {
    if (!e.bucket_id) continue;
    const list = entriesByBucket.get(e.bucket_id) ?? [];
    list.push(e);
    entriesByBucket.set(e.bucket_id, list);
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gh-text">Geteilt</h1>
          <p className="mt-1 text-sm text-gh-text-muted">
            Haushalte, Reisen und andere gemeinsame Töpfe.
          </p>
        </div>
        <LinkButton href="/app/shared/join" variant="secondary">
          Mit Code beitreten
        </LinkButton>
      </header>

      {!buckets?.length ? (
        <EmptyState
          title="Noch keine gemeinsamen Buckets"
          description="Unter „Buckets“ einen gemeinsamen Bucket anlegen — oder mit 6-stelligem Code beitreten."
          action={<LinkButton href="/app/shared/join">Beitreten</LinkButton>}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {buckets.map((b) => {
            const n = memberCountByBucket.get(b.id) ?? 0;
            const list = entriesByBucket.get(b.id) ?? [];
            const expenses = list.filter((e) => e.transaction_type === "expense");
            const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
            const breakdown = sharedBucketBreakdown(membersByBucket.get(b.id) ?? [], list);
            const maxDelta = breakdown.reduce((m, row) => Math.max(m, Math.abs(row.delta)), 0);
            const budgetHint =
              b.has_budget && b.budget_period === "monthly" && b.budget_amount != null
                ? ` · Budget ${formatEur(Number(b.budget_amount))}`
                : "";

            return (
              <li key={b.id}>
                <Link
                  href={`/app/shared/${b.id}`}
                  className="flex h-full flex-col rounded-2xl border border-gh-border-subtle bg-gh-surface/85 p-4 shadow-gh-panel backdrop-blur-sm transition-[border-color,background-color] duration-150 hover:border-gh-accent/20 hover:bg-gh-surface-elevated/90 motion-reduce:transition-none"
                >
                  <p className="text-sm font-semibold text-gh-text">{b.name}</p>
                  <p className="mt-1 text-xs text-gh-text-muted">
                    Code {b.join_code} · {n} {n === 1 ? "Mitglied" : "Mitglieder"}
                    {budgetHint}
                  </p>
                  <p className="mt-3 text-sm text-gh-text-secondary">
                    <span className="font-medium text-gh-text">{formatEur(total)}</span> Ausgaben
                    diesen Monat · max |Δ| {formatEur(maxDelta)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
