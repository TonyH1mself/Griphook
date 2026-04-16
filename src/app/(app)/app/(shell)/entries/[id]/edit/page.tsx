import { DeleteEntryButton } from "@/components/entries/delete-entry-button";
import { EntryForm, type EntryInitial } from "@/components/entries/entry-form";
import { requireUser } from "@/lib/auth/guards";
import { fetchCategoriesForPicker } from "@/lib/supabase/categories-picker-filter";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const { data: entry } = await supabase.from("entries").select("*").eq("id", id).maybeSingle();

  if (!entry || entry.created_by_user_id !== user.id) notFound();

  const categories = await fetchCategoriesForPicker(supabase, user.id, entry.category_id);
  const { data: buckets } = await supabase
    .from("buckets")
    .select("id,name,type")
    .eq("is_archived", false)
    .order("name");

  const initial: EntryInitial = {
    id: entry.id,
    transaction_type: entry.transaction_type as "income" | "expense",
    amount: String(entry.amount),
    title: entry.title,
    notes: entry.notes,
    category_id: entry.category_id,
    bucket_id: entry.bucket_id,
    occurred_at: entry.occurred_at,
  };

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/app/entries"
          className="text-sm font-medium text-gh-text-muted transition-colors hover:text-gh-accent"
        >
          ← Entries
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-gh-text">Edit entry</h1>
      </div>
      <EntryForm
        categories={categories}
        buckets={buckets ?? []}
        mode="edit"
        initial={initial}
      />
      <DeleteEntryButton entryId={entry.id} title={entry.title} />
    </div>
  );
}
