import { EntryForm, type EntryInitial } from "@/components/entries/entry-form";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entry } = await supabase.from("entries").select("*").eq("id", id).maybeSingle();

  if (!entry || entry.created_by_user_id !== user?.id) notFound();

  const { data: categories } = await supabase.from("categories").select("id,name").order("name");
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
          className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          ← Entries
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Edit entry
        </h1>
      </div>
      <EntryForm
        categories={categories ?? []}
        buckets={buckets ?? []}
        mode="edit"
        initial={initial}
      />
    </div>
  );
}
