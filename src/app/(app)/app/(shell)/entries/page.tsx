import { EmptyState } from "@/components/app/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatEur } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; q?: string; type?: string; bucket?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const q = (sp.q ?? "").trim();
  const typeFilter = sp.type === "income" || sp.type === "expense" ? sp.type : null;
  const bucketFilter = (sp.bucket ?? "").trim() || null;

  let entryQuery = supabase
    .from("entries")
    .select(
      "id,title,amount,transaction_type,occurred_at,created_by_user_id,categories(name),buckets(name,type)",
    )
    .order("occurred_at", { ascending: false })
    .limit(200);

  if (q) {
    entryQuery = entryQuery.ilike("title", `%${q.replace(/%/g, "\\%")}%`);
  }
  if (typeFilter) {
    entryQuery = entryQuery.eq("transaction_type", typeFilter);
  }
  if (bucketFilter) {
    entryQuery = entryQuery.eq("bucket_id", bucketFilter);
  }

  const { data: entries } = await entryQuery;

  const { data: bucketOptions } = await supabase
    .from("buckets")
    .select("id,name,type")
    .eq("is_archived", false)
    .order("name");

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Entries
          </h1>
          <p className="mt-1 text-sm text-slate-500">Fast capture, clear history.</p>
        </div>
        <LinkButton href="/app/entries/new">New entry</LinkButton>
      </header>

      {sp.saved === "1" ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100">
          Entry saved.
        </p>
      ) : null}

      <form method="get" className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-0 flex-1 space-y-1">
            <label htmlFor="q" className="text-xs font-medium text-slate-500">
              Search title
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="e.g. groceries"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="bucket" className="text-xs font-medium text-slate-500">
              Bucket
            </label>
            <select
              id="bucket"
              name="bucket"
              defaultValue={bucketFilter ?? ""}
              className="min-h-11 w-full min-w-[12rem] rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 sm:w-auto"
            >
              <option value="">All buckets</option>
              {(bucketOptions ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          {typeFilter ? <input type="hidden" name="type" value={typeFilter} /> : null}
          <Button type="submit" className="min-h-11 w-full rounded-2xl sm:w-auto">
            Apply
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="w-full text-xs font-medium uppercase tracking-wide text-slate-400 sm:w-auto sm:py-2">
            Type
          </span>
          {(
            [
              { key: null, label: "All" },
              { key: "expense" as const, label: "Expenses" },
              { key: "income" as const, label: "Income" },
            ] as const
          ).map(({ key, label }) => {
            const active = typeFilter === key || (key === null && !typeFilter);
            const href = (() => {
              const p = new URLSearchParams();
              if (q) p.set("q", q);
              if (key) p.set("type", key);
              if (bucketFilter) p.set("bucket", bucketFilter);
              const qs = p.toString();
              return qs ? `/app/entries?${qs}` : "/app/entries";
            })();
            return (
              <Link
                key={label}
                href={href}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-full px-3 text-sm font-medium",
                  active
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300",
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </form>

      {!entries?.length ? (
        <EmptyState
          title="No entries match"
          description={
            q || typeFilter || bucketFilter
              ? "Try clearing filters or search."
              : "Add your first income or expense. You can attach a bucket later."
          }
          action={
            !q && !typeFilter && !bucketFilter ? (
              <LinkButton href="/app/entries/new">Create entry</LinkButton>
            ) : (
              <LinkButton href="/app/entries" variant="secondary">
                Clear filters
              </LinkButton>
            )
          }
        />
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900/40">
          {entries.map((e) => {
            const cat =
              e.categories && typeof e.categories === "object" && "name" in e.categories
                ? String((e.categories as { name: string }).name)
                : "—";
            const bucket =
              e.buckets && typeof e.buckets === "object" && "name" in e.buckets
                ? String((e.buckets as { name: string }).name)
                : null;
            const bucketType =
              e.buckets && typeof e.buckets === "object" && "type" in e.buckets
                ? String((e.buckets as { type: string }).type)
                : null;
            const canEdit = user?.id === e.created_by_user_id;
            return (
              <li key={e.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {e.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {cat}
                    {bucket ? (
                      <>
                        {" · "}
                        <span
                          className={
                            bucketType === "shared"
                              ? "text-violet-700 dark:text-violet-300"
                              : undefined
                          }
                        >
                          {bucket}
                          {bucketType === "shared" ? " (shared)" : ""}
                        </span>
                      </>
                    ) : null}{" "}
                    · {new Date(e.occurred_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
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
                  {canEdit ? (
                    <Link
                      href={`/app/entries/${e.id}/edit`}
                      className="text-xs font-medium text-slate-500 underline"
                    >
                      Edit
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
