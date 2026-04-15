import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

const btnPrimary =
  "inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-base font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100";
const btnSecondary =
  "inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-base font-medium text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app");

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">GripHook</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Your month, in one calm view.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
        Track income and expenses with buckets, optional shared household pots, and lightweight
        fairness signals — without running a spreadsheet or a second job as an accountant.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/signup" className={btnPrimary}>
          Create account
        </Link>
        <Link href="/login" className={btnSecondary}>
          Sign in
        </Link>
      </div>
      <p className="mt-10 text-xs text-slate-400">
        Install on iPhone: Share → Add to Home Screen after signing in. Offline mode is not enabled
        yet; the shell is PWA-ready.
      </p>
    </main>
  );
}
