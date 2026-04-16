import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app");

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gh-text-muted">GripHook</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gh-text">
        Your month, in one calm view.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-gh-text-secondary">
        Track income and expenses with buckets, optional shared household pots, and lightweight
        fairness signals — without running a spreadsheet or a second job as an accountant.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <LinkButton href="/signup" className="h-12 w-full px-5 text-base sm:w-auto">
          Create account
        </LinkButton>
        <LinkButton href="/login" variant="secondary" className="h-12 w-full px-5 text-base sm:w-auto">
          Sign in
        </LinkButton>
      </div>
      <p className="mt-10 text-xs text-gh-text-muted">
        Install on iPhone: Share → Add to Home Screen after signing in. Offline mode is not enabled
        yet; the shell is PWA-ready.
      </p>
    </main>
  );
}
