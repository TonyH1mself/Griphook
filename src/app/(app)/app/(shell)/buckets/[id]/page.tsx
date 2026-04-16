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
import { requireUser } from "@/lib/auth/guards";
import { formatEur } from "@/lib/format";
import { fetchCategoriesForPicker } from "@/lib/supabase/categories-picker-filter";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function BucketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const { data: bucket } = await supabase.from("buckets").select("*").eq("id", id).maybeSingle();
  if (!bucket) notFound();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const { data: membership } = await supabase
    .from("bucket_members")
    .select("role")
    .eq("bucket_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isPrivateOwner = bucket.type === "private" && bucket.created_by_user_id === user.id;
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

  const categories = await fetchCategoriesForPicker(supabase, user.id, null);
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
          className="text-sm font-medium text-gh-text-muted transition-colors hover:text-gh-accent"
        >
          ← Buckets
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gh-text">{bucket.name}</h1>
            <p className="mt-1 text-sm text-gh-text-muted">
              {bucket.type === "shared" ? "Gemeinsamer Bucket" : "Privater Bucket"}
              {bucket.has_budget
                ? ` · Budget · ${bucket.budget_period === "monthly" ? "monatlich" : bucket.budget_period}`
                : ""}
              {bucket.is_archived ? " · Archiviert" : ""}
            </p>
          </div>
          <Link
            href="/app/entries/new"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-gh-border bg-gh-surface-elevated px-4 text-sm font-medium text-gh-text shadow-sm transition-[background-color,border-color] duration-150 hover:border-gh-text-muted/30 hover:bg-gh-surface motion-reduce:transition-none"
          >
            Anderswo erfassen
          </Link>
        </div>
      </div>

      {bucket.is_archived ? (
        <div className="rounded-2xl border border-gh-warning/30 bg-gh-warning-soft px-4 py-3 text-sm text-gh-warning">
          <p>
            Dieser Bucket ist archiviert. Neue Einträge sind deaktiviert, bis du ihn
            wiederherstellst.
          </p>
          {canManage ? (
            <div className="mt-4">
              <UnarchiveBucketButton bucketId={bucket.id} bucketName={bucket.name} />
            </div>
          ) : null}
        </div>
      ) : null}

      {bucket.description ? (
        <Card>
          <CardTitle>Beschreibung</CardTitle>
          <p className="mt-3 text-sm leading-relaxed text-gh-text-secondary">
            {bucket.description}
          </p>
        </Card>
      ) : null}

      <Card>
        <CardTitle>Dieser Monat</CardTitle>
        <CardDescription>Monatssummen für Einträge in diesem Bucket.</CardDescription>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gh-text-muted">
              Ausgaben
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-gh-danger">
              {formatEur(expensesMonth)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gh-text-muted">
              Einnahmen
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-gh-positive">
              {formatEur(incomeMonth)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gh-text-muted">
              Saldo (im Bucket)
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-gh-text">
              {formatEur(incomeMonth - expensesMonth)}
            </p>
          </div>
        </div>
      </Card>

      {bucket.has_budget && bucket.budget_period === "monthly" && budgetCap != null ? (
        <Card>
          <CardTitle>Budget</CardTitle>
          <CardDescription>
            Nur Ausgaben zählen gegen das Budget — Einnahmen füllen es nicht auf.
          </CardDescription>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gh-text-muted">Ausgegeben {formatEur(expensesMonth)}</span>
              <span className="font-medium tabular-nums text-gh-text">
                von {formatEur(budgetCap)}
                {budgetRemaining != null ? ` · ${formatEur(budgetRemaining)} übrig` : ""}
              </span>
            </div>
            <ProgressBar
              value={spentRatio > 1 ? 1 : spentRatio}
              indicatorClassName={
                spentRatio >= 1 ? "bg-gh-danger" : spentRatio >= 0.85 ? "bg-gh-warning" : undefined
              }
            />
            {spentRatio >= 1 ? (
              <p className="text-sm text-gh-danger">Diesen Monat über Budget in diesem Bucket.</p>
            ) : spentRatio >= 0.85 ? (
              <p className="text-sm text-gh-warning">
                Wird knapp — weniger als 15 % Budget übrig.
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}

      {categoryRows.length > 0 ? (
        <Card>
          <CardTitle>Top-Kategorien (Ausgaben)</CardTitle>
          <CardDescription>Diesen Monat, nach Kategorie, in diesem Bucket.</CardDescription>
          <ul className="mt-4 divide-y divide-gh-border-subtle">
            {categoryRows.slice(0, 8).map((row) => (
              <li key={row.cid} className="flex justify-between py-2 text-sm">
                <span className="text-gh-text-secondary">{row.name}</span>
                <span className="tabular-nums font-medium text-gh-text">
                  {formatEur(row.total)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {!bucket.is_archived ? (
        <Card>
          <CardTitle>Schnell erfassen</CardTitle>
          <CardDescription>
            Standardmäßig in diesem Bucket — schnellster Weg auf dem Handy.
          </CardDescription>
          <div className="mt-6">
            <EntryForm
              categories={categories}
              buckets={allBuckets ?? []}
              defaultBucketId={id}
              returnTo={`/app/buckets/${id}`}
            />
          </div>
        </Card>
      ) : null}

      <Card>
        <CardTitle>Letzte Einträge</CardTitle>
        <CardDescription>Diesen Monat in diesem Bucket.</CardDescription>
        {!monthEntries?.length ? (
          <p className="mt-4 text-sm text-gh-text-muted">Noch keine Einträge in diesem Monat.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gh-border-subtle">
            {monthEntries.slice(0, 15).map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm font-medium text-gh-text">{e.title}</p>
                  <p className="text-xs text-gh-text-muted">
                    {new Date(e.occurred_at).toLocaleString("de-DE")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
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
                  {e.created_by_user_id === user.id ? (
                    <Link
                      href={`/app/entries/${e.id}/edit`}
                      className="text-xs font-medium text-gh-text-muted underline decoration-gh-border transition-colors hover:text-gh-accent"
                    >
                      Bearbeiten
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
            <CardTitle>Beitrittscode</CardTitle>
            <CardDescription>Teile ihn mit Personen, die Mitglied werden sollen.</CardDescription>
            <p className="mt-4 text-3xl font-semibold tracking-[0.25em] tabular-nums text-gh-text">
              {bucket.join_code}
            </p>
            {canManage ? (
              <div className="mt-6">
                <RegenerateJoinButton bucketId={bucket.id} />
              </div>
            ) : (
              <p className="mt-4 text-xs text-gh-text-muted">
                Nur Admins können den Beitrittscode neu erzeugen.
              </p>
            )}
          </Card>

          <Card>
            <CardTitle>Fairness · dieser Monat</CardTitle>
            <CardDescription>Soll/Ist gemäß Anteilen — nur Ausgaben.</CardDescription>
            {!shareBalanced ? (
              <p className="mt-3 rounded-xl border border-gh-warning/30 bg-gh-warning-soft px-3 py-2 text-sm text-gh-warning">
                Mitglieder-Anteile summieren sich auf {shareSum.toFixed(1)} % (Ziel 100 %). Bitte
                nach neuen Beitritten angleichen.
              </p>
            ) : null}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-gh-text-muted">
                  <tr>
                    <th className="py-2 pr-3">Mitglied</th>
                    <th className="py-2 pr-3">Anteil</th>
                    <th className="py-2 pr-3">Soll</th>
                    <th className="py-2 pr-3">Ist</th>
                    <th className="py-2">Δ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gh-border-subtle">
                  {sharedBreakdown.map((row) => {
                    const p = profileById.get(row.userId);
                    const label = p?.display_name || p?.username || row.userId.slice(0, 8);
                    return (
                      <tr key={row.userId}>
                        <td className="py-3 pr-3 font-medium text-gh-text">
                          {label}
                        </td>
                        <td className="py-3 pr-3 tabular-nums text-gh-text-secondary">
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
            <CardTitle>Mitglieder</CardTitle>
            <CardDescription>Rollen und Zielanteil an den Haushaltsausgaben.</CardDescription>
            <ul className="mt-4 divide-y divide-gh-border-subtle">
              {(members ?? []).map((m) => {
                const p = profileById.get(m.user_id);
                const label = p?.display_name || p?.username || m.user_id.slice(0, 8);
                return (
                  <li key={m.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gh-text">{label}</p>
                      <p className="text-xs text-gh-text-muted">
                        {m.role === "admin" ? "Admin" : "Mitglied"}
                      </p>
                    </div>
                    <p className="text-sm tabular-nums text-gh-text-secondary">
                      {Number(m.share_percent).toFixed(1)} %
                    </p>
                  </li>
                );
              })}
            </ul>
            {canManage ? (
              <div className="mt-6 border-t border-gh-border-subtle pt-6">
                <p className="text-sm font-medium text-gh-text">Anteile anpassen</p>
                <p className="mt-1 text-xs text-gh-text-muted">
                  Nach einem neuen Beitritt bitte so anpassen, dass die Summe 100 % bleibt.
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
          <CardTitle>Einstellungen</CardTitle>
          <CardDescription>Name und Beschreibung.</CardDescription>
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
          <CardTitle>Budget-Einstellungen</CardTitle>
          <CardDescription>Monatsbudget an/aus und Betrag.</CardDescription>
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
          <CardTitle>Gefahrenzone</CardTitle>
          <CardDescription>Archivieren blendet den Bucket aus den Hauptlisten aus.</CardDescription>
          <div className="mt-4">
            <ArchiveBucketButton bucketId={bucket.id} bucketName={bucket.name} />
          </div>
        </Card>
      ) : null}
    </div>
  );
}
