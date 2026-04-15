import { EntryForm } from "@/components/entries/entry-form";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function NewEntryPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id,name").order("name");
  const { data: buckets } = await supabase.from("buckets").select("id,name,type").eq("is_archived", false).order("name");

  return (
    <div className="space-y-8">
      <div>
        <Link href="/app/entries" className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
          ← Entries
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">New entry</h1>
        <p className="mt-1 text-sm text-slate-500">Optimized for quick mobile capture.</p>
      </div>
      <EntryForm categories={categories ?? []} buckets={buckets ?? []} />
    </div>
  );
}
