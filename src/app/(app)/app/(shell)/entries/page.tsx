import { EmptyState } from "@/components/app/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { formatEur } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("entries")
    .select(
      "id,title,amount,transaction_type,occurred_at,created_by_user_id,categories(name),buckets(name)",
    )
    .order("occurred_at", { ascending: false })
    .limit(100);

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

      {!entries?.length ? (
        <EmptyState
          title="No entries yet"
          description="Add your first income or expense. You can attach a bucket later."
          action={<LinkButton href="/app/entries/new">Create entry</LinkButton>}
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
            const canEdit = user?.id === e.created_by_user_id;
            return (
              <li key={e.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{e.title}</p>
                  <p className="text-xs text-slate-500">
                    {cat}
                    {bucket ? ` · ${bucket}` : ""} · {new Date(e.occurred_at).toLocaleString()}
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
