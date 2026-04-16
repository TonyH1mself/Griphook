import { EmptyState } from "@/components/app/empty-state";
import { RecurringForm } from "@/components/recurring/recurring-form";
import { RecurringToggleButton } from "@/components/recurring/recurring-toggle-button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ListPanel } from "@/components/ui/list-panel";
import { requireUser } from "@/lib/auth/guards";
import { formatEur } from "@/lib/format";
import { loadCategoriesForPicker } from "@/lib/supabase/categories-picker-filter";
import Link from "next/link";

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, user } = await requireUser();

  const [{ data: templates }, picker, { data: buckets }] = await Promise.all([
    supabase
      .from("recurring_entry_templates")
      .select(
        "id,title,amount,transaction_type,frequency,next_due_at,is_active,categories(name),buckets(name)",
      )
      .order("next_due_at", { ascending: true }),
    loadCategoriesForPicker(supabase, user.id),
    supabase.from("buckets").select("id,name,type").eq("is_archived", false).order("name"),
  ]);
  const categories = picker.rows;

  return (
    <div className="space-y-10">
      <header>
        <Link
          href="/app/settings"
          className="text-sm font-medium text-gh-text-muted transition-colors hover:text-gh-accent"
        >
          ← Einstellungen
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-gh-text">Wiederkehrend</h1>
        <p className="mt-1 text-sm text-gh-text-muted">
          Vorlagen für wiederkehrende Einnahmen und Ausgaben — Teil der App-Verwaltung.
        </p>
      </header>

      {sp.saved === "1" ? (
        <p className="rounded-2xl border border-gh-accent/25 bg-gh-info-soft px-4 py-3 text-sm text-gh-positive">
          Vorlage gespeichert.
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gh-text">Vorlagen</h2>
        {!templates?.length ? (
          <EmptyState
            title="Keine Vorlagen"
            description="Lege wiederkehrende Posten wie Miete, Abos oder Gehalt an."
          />
        ) : (
          <ListPanel>
            {templates.map((t) => {
              const cat =
                t.categories && typeof t.categories === "object" && "name" in t.categories
                  ? String((t.categories as { name: string }).name)
                  : "—";
              const bkt =
                t.buckets && typeof t.buckets === "object" && "name" in t.buckets
                  ? String((t.buckets as { name: string }).name)
                  : null;
              return (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gh-text">{t.title}</p>
                    <p className="text-xs text-gh-text-muted">
                      {cat}
                      {bkt ? ` · ${bkt}` : ""} ·{" "}
                      {t.frequency === "weekly"
                        ? "wöchentlich"
                        : t.frequency === "biweekly"
                          ? "14-tägig"
                          : t.frequency === "monthly"
                            ? "monatlich"
                            : t.frequency === "quarterly"
                              ? "quartalsweise"
                              : t.frequency === "yearly"
                                ? "jährlich"
                                : t.frequency}{" "}
                      · nächste Fälligkeit {new Date(t.next_due_at).toLocaleString("de-DE")}
                      {!t.is_active ? " · pausiert" : ""}
                    </p>
                    <Link
                      href={`/app/recurring/${t.id}/edit`}
                      className="mt-1 inline-block text-xs font-medium text-gh-text-muted underline decoration-gh-border transition-colors hover:text-gh-accent"
                    >
                      Bearbeiten
                    </Link>
                  </div>
                  <div className="flex items-center gap-3">
                    <p
                      className={
                        t.transaction_type === "income"
                          ? "text-sm font-semibold tabular-nums text-gh-positive"
                          : "text-sm font-semibold tabular-nums text-gh-danger"
                      }
                    >
                      {t.transaction_type === "income" ? "+" : "−"}
                      {formatEur(Number(t.amount))}
                    </p>
                    <RecurringToggleButton templateId={t.id} isActive={t.is_active} />
                  </div>
                </li>
              );
            })}
          </ListPanel>
        )}
      </section>

      <Card>
        <CardTitle>Neue Vorlage</CardTitle>
        <CardDescription>
          Wir speichern den Zeitplan — die Ausführung kann manuell oder automatisiert erfolgen.
        </CardDescription>
        <div className="mt-6">
          <RecurringForm categories={categories ?? []} buckets={buckets ?? []} />
        </div>
      </Card>
    </div>
  );
}
