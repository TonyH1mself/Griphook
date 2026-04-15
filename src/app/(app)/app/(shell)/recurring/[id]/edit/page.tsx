import { RecurringForm, type RecurringInitial } from "@/components/recurring/recurring-form";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditRecurringPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: row } = await supabase
    .from("recurring_entry_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!row || row.created_by_user_id !== user?.id) notFound();

  const { data: categories } = await supabase.from("categories").select("id,name").order("name");
  const { data: buckets } = await supabase
    .from("buckets")
    .select("id,name,type")
    .eq("is_archived", false)
    .order("name");

  const freq = row.frequency === "weekly" ? "weekly" : "monthly";

  const initial: RecurringInitial = {
    id: row.id,
    transaction_type: row.transaction_type as "income" | "expense",
    amount: String(row.amount),
    title: row.title,
    notes: row.notes,
    category_id: row.category_id,
    bucket_id: row.bucket_id,
    frequency: freq,
    next_due_at: row.next_due_at,
  };

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/app/recurring"
          className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          ← Recurring
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Edit template
        </h1>
      </div>
      <RecurringForm
        categories={categories ?? []}
        buckets={buckets ?? []}
        mode="edit"
        initial={initial}
      />
    </div>
  );
}
