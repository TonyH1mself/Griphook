import { EmptyState } from "@/components/app/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { ListPanel } from "@/components/ui/list-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatEur } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const filterInput =
  "min-h-11 w-full rounded-xl border border-gh-border bg-gh-surface-inset px-3 text-sm text-gh-text shadow-[inset_0_1px_2px_rgb(0_0_0/0.2)] outline-none transition-[border-color,box-shadow] duration-150 focus:border-gh-accent/50 focus:ring-2 focus:ring-gh-ring/35 motion-reduce:transition-none";

const chipActive =
  "bg-gh-accent-muted text-gh-accent shadow-[inset_0_0_0_1px_rgb(106_158_148/0.35)]";
const chipIdle =
  "border border-gh-border bg-gh-surface-elevated/50 text-gh-text-secondary hover:border-gh-text-muted/25 hover:bg-gh-surface";

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
          <h1 className="text-2xl font-semibold tracking-tight text-gh-text">Einträge</h1>
          <p className="mt-1 text-sm text-gh-text-muted">Schnell erfassen, klarer Verlauf.</p>
        </div>
        <LinkButton href="/app/entries/new">Neuer Eintrag</LinkButton>
      </header>

      {sp.saved === "1" ? (
        <p className="rounded-2xl border border-gh-accent/25 bg-gh-info-soft px-4 py-3 text-sm text-gh-positive">
          Eintrag gespeichert.
        </p>
      ) : null}

      <form
        method="get"
        className="space-y-4 rounded-2xl border border-gh-border-subtle bg-gh-surface/85 p-4 shadow-gh-panel backdrop-blur-sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-0 flex-1 space-y-1">
            <label htmlFor="q" className="text-xs font-medium text-gh-text-muted">
              Titel suchen
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="z. B. Einkauf"
              className={filterInput}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="bucket" className="text-xs font-medium text-gh-text-muted">
              Bucket
            </label>
            <select
              id="bucket"
              name="bucket"
              defaultValue={bucketFilter ?? ""}
              className={`${filterInput} min-w-[12rem] sm:w-auto`}
            >
              <option value="">Alle Buckets</option>
              {(bucketOptions ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          {typeFilter ? <input type="hidden" name="type" value={typeFilter} /> : null}
          <Button type="submit" className="min-h-11 w-full rounded-2xl sm:w-auto">
            Anwenden
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="w-full text-xs font-medium uppercase tracking-wide text-gh-text-muted sm:w-auto sm:py-2">
            Typ
          </span>
          {(
            [
              { key: null, label: "Alle" },
              { key: "expense" as const, label: "Ausgaben" },
              { key: "income" as const, label: "Einnahmen" },
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
                  "inline-flex min-h-9 items-center rounded-full px-3 text-sm font-medium transition-[background-color,color,box-shadow] duration-150 motion-reduce:transition-none",
                  active ? chipActive : chipIdle,
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
          title="Keine Einträge gefunden"
          description={
            q || typeFilter || bucketFilter
              ? "Filter oder Suche zurücksetzen."
              : "Lege deinen ersten Eintrag an — einen Bucket kannst du später zuweisen."
          }
          action={
            !q && !typeFilter && !bucketFilter ? (
              <LinkButton href="/app/entries/new">Eintrag anlegen</LinkButton>
            ) : (
              <LinkButton href="/app/entries" variant="secondary">
                Filter zurücksetzen
              </LinkButton>
            )
          }
        />
      ) : (
        <ListPanel>
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
                  <p className="truncate text-sm font-medium text-gh-text">{e.title}</p>
                  <p className="mt-0.5 text-xs text-gh-text-muted">
                    {cat}
                    {bucket ? (
                      <>
                        {" · "}
                        <span
                          className={
                            bucketType === "shared" ? "font-medium text-gh-accent" : undefined
                          }
                        >
                          {bucket}
                          {bucketType === "shared" ? " (gemeinsam)" : ""}
                        </span>
                      </>
                    ) : null}{" "}
                    · {new Date(e.occurred_at).toLocaleString("de-DE")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
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
                  {canEdit ? (
                    <Link
                      href={`/app/entries/${e.id}/edit`}
                      className="text-xs font-medium text-gh-text-muted underline decoration-gh-border transition-colors hover:text-gh-accent"
                    >
                      Bearbeiten
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ListPanel>
      )}
    </div>
  );
}
