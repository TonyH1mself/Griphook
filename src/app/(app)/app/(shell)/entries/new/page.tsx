import { EntryForm } from "@/components/entries/entry-form";
import { requireUser } from "@/lib/auth/guards";
import { loadCategoriesForPicker } from "@/lib/supabase/categories-picker-filter";
import Link from "next/link";

export default async function NewEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, user } = await requireUser();
  const [picker, { data: buckets }] = await Promise.all([
    loadCategoriesForPicker(supabase, user.id),
    supabase.from("buckets").select("id,name,type").eq("is_archived", false).order("name"),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/app/entries"
          className="text-sm font-medium text-gh-text-muted transition-colors hover:text-gh-accent"
        >
          ← Einträge
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-gh-text">Neuer Eintrag</h1>
        <p className="mt-1 text-sm text-gh-text-muted">Für schnelle Erfassung auf dem Handy.</p>
      </div>
      <EntryForm
        categories={picker.rows}
        buckets={buckets ?? []}
        returnTo={sp.returnTo}
        categoriesLoadError={picker.loadError}
      />
    </div>
  );
}
