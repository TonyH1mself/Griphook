import { RegenerateJoinButton } from "@/components/buckets/regenerate-join-button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function BucketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: bucket } = await supabase.from("buckets").select("*").eq("id", id).maybeSingle();
  if (!bucket) notFound();

  const { data: membership } = await supabase
    .from("bucket_members")
    .select("role")
    .eq("bucket_id", id)
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  const { data: members } = await supabase
    .from("bucket_members")
    .select("id,user_id,role,share_percent")
    .eq("bucket_id", id);

  const userIds = members?.map((m) => m.user_id) ?? [];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id,username,display_name").in("id", userIds)
      : { data: [] as { id: string; username: string | null; display_name: string | null }[] };

  const profileById = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/app/buckets" className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
          ← Buckets
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{bucket.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {bucket.type === "shared" ? "Shared bucket" : "Private bucket"}
          {bucket.has_budget ? ` · Budget ${bucket.budget_period}` : ""}
        </p>
      </div>

      {bucket.description ? (
        <Card>
          <CardTitle>Description</CardTitle>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{bucket.description}</p>
        </Card>
      ) : null}

      {bucket.type === "shared" ? (
        <Card>
          <CardTitle>Join code</CardTitle>
          <CardDescription>Share this code with household members.</CardDescription>
          <p className="mt-4 text-3xl font-semibold tracking-[0.25em] tabular-nums text-slate-900 dark:text-white">
            {bucket.join_code}
          </p>
          {membership?.role === "admin" ? (
            <div className="mt-6">
              <RegenerateJoinButton bucketId={bucket.id} />
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-500">Only admins can rotate the join code.</p>
          )}
        </Card>
      ) : null}

      {bucket.type === "shared" ? (
        <Card>
          <CardTitle>Members</CardTitle>
          <CardDescription>Percentages should sum to 100% (adjust after new joins).</CardDescription>
          <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
            {(members ?? []).map((m) => {
              const p = profileById.get(m.user_id);
              const label = p?.display_name || p?.username || m.user_id.slice(0, 8);
              return (
                <li key={m.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
                    <p className="text-xs text-slate-500">{m.role}</p>
                  </div>
                  <p className="text-sm tabular-nums text-slate-700 dark:text-slate-200">{Number(m.share_percent).toFixed(1)}%</p>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            Editing shares fairly across members is a follow-up; for now, admins can adjust in SQL or we extend the UI next.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
