import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ warn?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.username) redirect("/app");

  const sp = await searchParams;
  const profileFetchWarn = sp.warn === "profile_fetch";

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Finish your profile
      </h1>
      <p className="mt-2 text-sm text-slate-500">Pick a username and how we should greet you.</p>
      {profileFetchWarn ? (
        <p
          className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          We could not load your profile from the server. You can still try to save below — if it keeps failing,
          check your connection and that Supabase migrations are applied (see docs/setup.md).
        </p>
      ) : null}
      <div className="mt-8">
        <OnboardingForm />
      </div>
    </main>
  );
}
