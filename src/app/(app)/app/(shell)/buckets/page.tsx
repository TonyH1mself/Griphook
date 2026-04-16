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

const chipActive =
  "bg-gh-accent-muted text-gh-accent shadow-[inset_0_0_0_1px_rgb(106_158_148/0.35)]";
const chipIdle =
  "border border-gh-border bg-gh-surface-elevated/50 text-gh-text-secondary hover:border-gh-text-muted/25 hover:bg-gh-surface";

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
    { key: "active", label: "Aktiv" },
    { key: "archived", label: "Archiviert" },
    { key: "all", label: "Alle" },
  ];
  const typeTabs: { key: TypeFilter; label: string }[] = [
    { key: "all", label: "Alle Typen" },
    { key: "private", label: "Privat" },
    { key: "shared", label: "Gemeinsam" },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gh-text">Buckets</h1>
          <p className="mt-1 text-sm text-gh-text-muted">
            Private oder gemeinsame Töpfe — mit oder ohne Monatsbudget.
          </p>
        </div>
        <div>
          <LinkButton href="/app/buckets/new">Neuer Bucket</LinkButton>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gh-text-muted">Status</p>
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((t) => (
            <Link
              key={t.key}
              href={filterHref(t.key, type)}
              className={cn(
                "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium transition-[background-color,color,box-shadow,border-color] duration-150 motion-reduce:transition-none",
                status === t.key ? chipActive : chipIdle,
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-gh-text-muted">Typ</p>
        <div className="flex flex-wrap gap-2">
          {typeTabs.map((t) => (
            <Link
              key={t.key}
              href={filterHref(status, t.key)}
              className={cn(
                "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium transition-[background-color,color,box-shadow,border-color] duration-150 motion-reduce:transition-none",
                type === t.key ? chipActive : chipIdle,
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {!buckets?.length ? (
        <EmptyState
          title={status === "archived" ? "Keine archivierten Buckets" : "Noch keine Buckets"}
          description={
            status === "archived"
              ? "Nichts archiviert — oder den Filter wechseln."
              : "Lege einen Bucket an, um Ausgaben zu gruppieren und optional ein Monatsbudget zu setzen."
          }
          action={
            status !== "archived" ? (
              <LinkButton href="/app/buckets/new">Neuer Bucket</LinkButton>
            ) : null
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
                  className="flex h-full flex-col rounded-2xl border border-gh-border-subtle bg-gh-surface/85 p-4 shadow-gh-panel backdrop-blur-sm transition-[border-color,background-color,box-shadow] duration-150 hover:border-gh-accent/20 hover:bg-gh-surface-elevated/90 motion-reduce:transition-none"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gh-text">{b.name}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gh-text-muted">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 font-medium",
                            b.type === "shared"
                              ? "bg-gh-accent-muted text-gh-accent"
                              : "bg-gh-surface-inset text-gh-text-secondary ring-1 ring-gh-border-subtle",
                          )}
                        >
                          {b.type === "shared" ? "Gemeinsam" : "Privat"}
                        </span>
                        {b.is_archived ? (
                          <span className="rounded-full bg-gh-warning-soft px-2 py-0.5 font-medium text-gh-warning ring-1 ring-gh-warning/25">
                            Archiviert
                          </span>
                        ) : null}
                        {b.has_budget && b.budget_period === "monthly" ? (
                          <span>Monatsbudget</span>
                        ) : b.has_budget ? (
                          <span>Budget</span>
                        ) : (
                          <span>Kein Budget</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between tabular-nums text-gh-text-secondary">
                      <span>Diesen Monat (Ausgaben)</span>
                      <span className="font-medium text-gh-text">{formatEur(spent)}</span>
                    </div>
                    {cap != null && Number.isFinite(cap) ? (
                      <>
                        <div className="flex justify-between text-xs tabular-nums text-gh-text-muted">
                          <span>von {formatEur(cap)}</span>
                          {overBy != null ? (
                            <span className="font-medium text-gh-danger">
                              {formatEur(overBy)} über Budget
                            </span>
                          ) : remaining != null ? (
                            <span>{formatEur(remaining)} übrig</span>
                          ) : null}
                        </div>
                        <ProgressBar
                          value={ratio > 1 ? 1 : ratio}
                          indicatorClassName={
                            over ? "bg-gh-danger" : tight ? "bg-gh-warning" : undefined
                          }
                        />
                      </>
                    ) : (
                      <p className="text-xs text-gh-text-muted">
                        Ausgaben werden erfasst, ohne Budget-Grenze.
                      </p>
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
