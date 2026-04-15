import { EmptyState } from "@/components/app/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function BucketsPage() {
  const supabase = await createClient();
  const { data: buckets } = await supabase
    .from("buckets")
    .select("id,name,type,has_budget,budget_amount,budget_period,join_code")
    .eq("is_archived", false)
    .order("name");

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Buckets</h1>
          <p className="mt-1 text-sm text-slate-500">Private or shared pots for your money.</p>
        </div>
        <LinkButton href="/app/buckets/new">New bucket</LinkButton>
      </header>

      {!buckets?.length ? (
        <EmptyState
          title="No buckets yet"
          description="Create a bucket to group spending — with or without a monthly budget cap."
          action={<LinkButton href="/app/buckets/new">Create bucket</LinkButton>}
        />
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900/40">
          {buckets.map((b) => (
            <li key={b.id}>
              <Link href={`/app/buckets/${b.id}`} className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-900/60">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{b.name}</p>
                  <p className="text-xs text-slate-500">
                    {b.type === "shared" ? "Shared" : "Private"}
                    {b.has_budget ? ` · Budget (${b.budget_period})` : ""}
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-400">Open →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
