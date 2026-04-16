import { EntryForm } from "@/components/entries/entry-form";
import { requireUser } from "@/lib/auth/guards";
import { categoriesPickerOrFilter } from "@/lib/supabase/categories-picker-filter";
import Link from "next/link";

export default async function NewEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, user } = await requireUser();
  const [{ data: categories }, { data: buckets }] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name")
      .or(categoriesPickerOrFilter(user.id))
      .order("name"),
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
      <EntryForm categories={categories ?? []} buckets={buckets ?? []} returnTo={sp.returnTo} />
    </div>
  );
}
