import { LoginForm } from "@/components/auth/login-form";
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
  if (user) redirect("/app");

  const sp = await searchParams;
  const authError = sp.error ? decodeURIComponent(sp.error) : null;

  return (
    <div>
      <Link
        href="/"
        className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
      >
        ← Back
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Sign in
      </h1>
      <p className="mt-2 text-sm text-slate-500">Welcome back to GripHook.</p>
      {authError ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {authError}
        </p>
      ) : null}
      <div className="mt-8">
        <LoginForm defaultRedirect={sp.redirect} />
      </div>
    </div>
  );
}
