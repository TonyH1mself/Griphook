import { EmptyState } from "@/components/app/empty-state";
import { CategoryArchiveToggle } from "@/components/categories/category-archive-toggle";
import { CategoryCreateForm } from "@/components/categories/category-create-form";
import { CategoryEditForm } from "@/components/categories/category-edit-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ListPanel } from "@/components/ui/list-panel";
import { requireUser } from "@/lib/auth/guards";
import Link from "next/link";

export default async function CategoriesPage() {
  const { supabase } = await requireUser();

  const { data: categories } = await supabase
    .from("categories")
    .select("id,name,is_system,is_archived,created_by_user_id")
    .order("is_system", { ascending: false })
    .order("name");

  const system = categories?.filter((c) => c.is_system) ?? [];
  const yoursActive = categories?.filter((c) => !c.is_system && !c.is_archived) ?? [];
  const yoursArchived = categories?.filter((c) => !c.is_system && c.is_archived) ?? [];

  return (
    <div className="space-y-10">
      <header>
        <Link
          href="/app/settings"
          className="text-sm font-medium text-gh-text-muted transition-colors hover:text-gh-accent"
        >
          ← Einstellungen
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-gh-text">Kategorien</h1>
        <p className="mt-1 text-sm text-gh-text-muted">
          System-Kategorien sind fest. Eigene Kategorien ergänzen sie in Einträgen und
          Wiederkehrenden.
        </p>
      </header>

      <Card>
        <CardTitle>Neue Kategorie</CardTitle>
        <CardDescription>
          Erscheint in Auswahllisten neben den GripHook-Standards.
        </CardDescription>
        <div className="mt-6 max-w-lg">
          <CategoryCreateForm />
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gh-text">Standard</h2>
        {!system.length ? (
          <EmptyState
            title="Keine System-Kategorien"
            description="Bitte Datenbank-Seed prüfen."
          />
        ) : (
          <ListPanel>
            {system.map((c) => (
              <li key={c.id} className="px-4 py-3 text-sm text-gh-text">
                {c.name}
              </li>
            ))}
          </ListPanel>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gh-text">Deine</h2>
        {!yoursActive.length ? (
          <EmptyState
            title="Noch keine eigenen Kategorien"
            description="Oben anlegen — sie bleiben privat für dein Konto."
          />
        ) : (
          <ul className="space-y-3">
            {yoursActive.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-gh-border-subtle bg-gh-surface/85 p-4 shadow-gh-panel backdrop-blur-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <CategoryEditForm categoryId={c.id} initialName={c.name} />
                  <CategoryArchiveToggle categoryId={c.id} isArchived={false} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {yoursArchived.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gh-text">Archiviert</h2>
          <p className="text-xs text-gh-text-muted">
            In Auswahllisten ausgeblendet. Bestehende Einträge behalten ihre Zuordnung.
          </p>
          <ul className="space-y-3">
            {yoursArchived.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-gh-border-subtle bg-gh-surface-inset/40 p-4 ring-1 ring-gh-border-subtle"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-gh-text-secondary">{c.name}</p>
                  <CategoryArchiveToggle categoryId={c.id} isArchived />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
