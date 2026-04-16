import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ListPanel } from "@/components/ui/list-panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import { requireUser } from "@/lib/auth/guards";
import { budgetHealthRows } from "@/lib/dashboard/budget-health";
import { sharedBucketBreakdown, summarizeMonth } from "@/lib/domain";
import { formatEur } from "@/lib/format";
import Link from "next/link";

function recurringDueLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDue = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((startDue.getTime() - startToday.getTime()) / 86400000);
  if (days < 0) return `${d.toLocaleDateString("de-DE")} · überfällig`;
  if (days === 0) return "Heute fällig";
  if (days === 1) return "Morgen fällig";
  return `Fällig in ${days} Tagen`;
}

const linkSubtle =
  "text-xs font-medium text-gh-text-muted transition-colors duration-150 hover:text-gh-accent motion-reduce:transition-none";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [{ data: entries }, { data: buckets }, { data: reminders }] = await Promise.all([
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
      .from("recurring_entry_templates")
      .select("id,title,next_due_at,amount,transaction_type")
      .eq("is_active", true)
      .order("next_due_at", { ascending: true })
      .limit(4),
  ]);
  void user;

  const entryRows =
    entries?.map((e) => ({
      transaction_type: e.transaction_type as "income" | "expense",
      amount: e.amount,
      occurred_at: e.occurred_at,
    })) ?? [];

  const month = summarizeMonth(entryRows, now);

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
        <h1 className="text-2xl font-semibold tracking-tight text-gh-text">Dashboard</h1>
        <p className="mt-1 text-sm text-gh-text-muted">Dein Monat, priorisiert.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="sm:col-span-1">
          <CardTitle className="text-base">Einnahmen</CardTitle>
          <CardDescription>Dieser Monat</CardDescription>
          <p className="mt-3 text-2xl font-semibold tabular-nums text-gh-positive">
            {formatEur(month.income)}
          </p>
        </Card>
        <Card className="sm:col-span-1">
          <CardTitle className="text-base">Ausgaben</CardTitle>
          <CardDescription>Dieser Monat</CardDescription>
          <p className="mt-3 text-2xl font-semibold tabular-nums text-gh-danger">
            {formatEur(month.expense)}
          </p>
        </Card>
        <Card className="border-gh-accent/25 shadow-[inset_0_0_0_1px_rgb(106_158_148/0.12)] sm:col-span-1">
          <CardTitle className="text-base">Saldo</CardTitle>
          <CardDescription>Einnahmen − Ausgaben</CardDescription>
          <p className="mt-3 text-2xl font-semibold tabular-nums text-gh-text">
            {formatEur(month.balance)}
          </p>
        </Card>
      </section>

      {health.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-sm font-semibold text-gh-text">Budget-Auslastung</h2>
            <Link href="/app/buckets" className={linkSubtle}>
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
                      className="text-sm font-semibold text-gh-text transition-colors hover:text-gh-accent"
                    >
                      {h.name}
                    </Link>
                    <p className="mt-1 text-xs text-gh-text-muted">
                      {h.status === "over" ? (
                        <span className="text-gh-danger">Über Budget</span>
                      ) : h.status === "tight" ? (
                        <span className="text-gh-warning">Wird knapp</span>
                      ) : (
                        "Im Rahmen"
                      )}{" "}
                      · {formatEur(h.spent)} / {formatEur(h.cap)}
                      {h.remaining != null ? ` · ${formatEur(h.remaining)} übrig` : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <ProgressBar
                    value={h.ratio > 1 ? 1 : h.ratio}
                    indicatorClassName={
                      h.status === "over"
                        ? "bg-gh-danger"
                        : h.status === "tight"
                          ? "bg-gh-warning"
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
            <h2 className="text-sm font-semibold text-gh-text">Weitere Bucket-Ausgaben</h2>
            <Link href="/app/buckets" className={linkSubtle}>
              Buckets
            </Link>
          </div>
          <p className="text-xs text-gh-text-muted">
            Kein Budget gesetzt — Ausgaben werden trotzdem in diesem Monat erfasst.
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
                        className="text-sm font-semibold text-gh-text transition-colors hover:text-gh-accent"
                      >
                        {b.name}
                      </Link>
                      <p className="mt-1 text-xs text-gh-text-muted">
                        {b.type === "shared" ? "Gemeinsam" : "Privat"} · {formatEur(spent)}{" "}
                        Ausgaben
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
          <h2 className="text-sm font-semibold text-gh-text">Anstehende Wiederkehrende</h2>
          <ListPanel>
            {reminders.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gh-text">{r.title}</p>
                  <p className="text-xs text-gh-text-muted">
                    {recurringDueLabel(r.next_due_at)} ·{" "}
                    {new Date(r.next_due_at).toLocaleString("de-DE")}
                  </p>
                </div>
                <p className="text-sm font-medium tabular-nums text-gh-text-secondary">
                  {formatEur(Number(r.amount))}
                </p>
              </li>
            ))}
          </ListPanel>
        </section>
      ) : null}

      {sharedPreviews.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-sm font-semibold text-gh-text">Geteilte Fairness</h2>
            <Link href="/app/buckets?type=shared" className={linkSubtle}>
              Gemeinsame Buckets
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {sharedPreviews.map(({ bucket, total, maxDelta, memberCount }) => (
              <Link key={bucket.id} href={`/app/buckets/${bucket.id}`}>
                <Card className="h-full transition-[background-color,box-shadow] duration-150 hover:bg-gh-surface motion-reduce:transition-none">
                  <CardTitle>{bucket.name}</CardTitle>
                  <CardDescription>
                    {memberCount} {memberCount === 1 ? "Mitglied" : "Mitglieder"} ·{" "}
                    {formatEur(total)} Ausgaben · max |Δ| {formatEur(maxDelta)}
                  </CardDescription>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-sm font-semibold text-gh-text">Letzte Einträge</h2>
          <Link href="/app/entries/new" className={linkSubtle}>
            Neu
          </Link>
        </div>
        {recent.length === 0 ? (
          <Card>
            <CardTitle>Noch keine Einträge in diesem Monat</CardTitle>
            <CardDescription>Starte mit einer Ausgabe oder Einnahme.</CardDescription>
            <Link
              href="/app/entries/new"
              className="mt-4 inline-flex text-sm font-medium text-gh-accent underline decoration-gh-accent/40 underline-offset-2 transition-colors hover:text-gh-accent-hover"
            >
              Neuer Eintrag
            </Link>
          </Card>
        ) : (
          <ListPanel>
            {recent.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gh-text">{e.title}</p>
                  <p className="text-xs text-gh-text-muted">
                    {e.categories && typeof e.categories === "object" && "name" in e.categories
                      ? String((e.categories as { name: string }).name)
                      : "—"}{" "}
                    · {new Date(e.occurred_at).toLocaleString("de-DE")}
                  </p>
                </div>
                <p
                  className={
                    e.transaction_type === "income"
                      ? "text-sm font-semibold tabular-nums text-gh-positive"
                      : "text-sm font-semibold tabular-nums text-gh-danger"
                  }
                >
                  {e.transaction_type === "income" ? "+" : "−"}
                  {formatEur(Number(e.amount))}
                </p>
              </li>
            ))}
          </ListPanel>
        )}
      </section>
    </div>
  );
}
