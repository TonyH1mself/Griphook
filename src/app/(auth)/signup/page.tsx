import { SignupForm } from "@/components/auth/signup-form";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app");

  return (
    <div>
      <Link
        href="/"
        className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
      >
        ← Back
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Create your account
      </h1>
      <p className="mt-2 text-sm text-slate-500">Buckets, entries, and shared pots — in minutes.</p>
      <div className="mt-8">
        <SignupForm />
      </div>
    </div>
  );
}
