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
      <h1 className="text-2xl font-semibold tracking-tight text-gh-text">Finish your profile</h1>
      <p className="mt-2 text-sm text-gh-text-muted">Pick a username and how we should greet you.</p>
      {profileFetchWarn ? (
        <p
          className="mt-4 rounded-2xl border border-gh-warning/30 bg-gh-warning-soft px-4 py-3 text-sm text-gh-warning"
          role="status"
        >
          We could not load your profile from the server. You can still try to save below — if it
          keeps failing, check your connection and that Supabase migrations are applied (see
          docs/setup.md).
        </p>
      ) : null}
      <div className="mt-8">
        <OnboardingForm />
      </div>
    </main>
  );
}
