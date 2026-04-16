import { SignupForm } from "@/components/auth/signup-form";
import { getSafeInternalPath } from "@/lib/url";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sp = await searchParams;
  if (user) redirect(getSafeInternalPath(sp.redirect, "/app"));

  return (
    <div>
      <Link
        href="/"
        className="text-sm font-medium text-gh-text-muted transition-colors hover:text-gh-accent"
      >
        ← Zurück
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-gh-text">Konto erstellen</h1>
      <p className="mt-2 text-sm text-gh-text-muted">
        Buckets, Einträge und gemeinsame Töpfe — in wenigen Minuten.
      </p>
      <div className="mt-8">
        <SignupForm />
      </div>
    </div>
  );
}
