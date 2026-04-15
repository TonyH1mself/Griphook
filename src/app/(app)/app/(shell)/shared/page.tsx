import { EmptyState } from "@/components/app/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function SharedPage() {
  const supabase = await createClient();
  const { data: buckets } = await supabase
    .from("buckets")
    .select("id,name,join_code")
    .eq("type", "shared")
    .eq("is_archived", false)
    .order("name");

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Shared</h1>
          <p className="mt-1 text-sm text-slate-500">Households, trips, and other shared pots.</p>
        </div>
        <LinkButton href="/app/shared/join" variant="secondary">
          Join with code
        </LinkButton>
      </header>

      {!buckets?.length ? (
        <EmptyState
          title="No shared buckets yet"
          description="Create a shared bucket from Buckets, or join someone else’s with a 6-digit code."
          action={<LinkButton href="/app/shared/join">Join bucket</LinkButton>}
        />
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900/40">
          {buckets.map((b) => (
            <li key={b.id}>
              <Link href={`/app/shared/${b.id}`} className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-900/60">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{b.name}</p>
                  <p className="text-xs text-slate-500">Code {b.join_code}</p>
                </div>
                <span className="text-xs font-medium text-slate-400">Fairness view →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
