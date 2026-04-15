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
          className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          ← Entries
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          New entry
        </h1>
        <p className="mt-1 text-sm text-slate-500">Optimized for quick mobile capture.</p>
      </div>
      <EntryForm categories={categories ?? []} buckets={buckets ?? []} returnTo={sp.returnTo} />
    </div>
  );
}
