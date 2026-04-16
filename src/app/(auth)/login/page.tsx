import { LoginForm } from "@/components/auth/login-form";
import { loginPageErrorMessage } from "@/lib/auth/user-messages";
import { getSafeInternalPath } from "@/lib/url";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sp = await searchParams;
  if (user) redirect(getSafeInternalPath(sp.redirect, "/app"));

  const authError = loginPageErrorMessage(sp.error);

  return (
    <div>
      <Link
        href="/"
        className="text-sm font-medium text-gh-text-muted transition-colors hover:text-gh-accent"
      >
        ← Back
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-gh-text">Sign in</h1>
      <p className="mt-2 text-sm text-gh-text-muted">Welcome back to GripHook.</p>
      {authError ? (
        <p className="mt-4 rounded-2xl border border-gh-danger/35 bg-gh-danger-soft px-4 py-3 text-sm text-gh-error-text">
          {authError}
        </p>
      ) : null}
      <div className="mt-8">
        <LoginForm defaultRedirect={sp.redirect} />
      </div>
    </div>
  );
}
