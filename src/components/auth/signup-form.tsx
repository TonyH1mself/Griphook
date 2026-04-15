"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatAuthErrorForUser } from "@/lib/auth/user-messages";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl, getSiteUrl } from "@/lib/url";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsEmailConfirmation(false);
    setPending(true);
    try {
      const supabase = createClient();
      const redirectTo = getAuthCallbackUrl("/app/onboarding");
      const { data, error: signError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      if (signError) {
        setError(formatAuthErrorForUser(signError));
        return;
      }
      if (data.session) {
        router.push("/app/onboarding");
        router.refresh();
        return;
      }
      setNeedsEmailConfirmation(true);
    } finally {
      setPending(false);
    }
  }

  if (needsEmailConfirmation) {
    return (
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/50">
        <p className="text-sm font-medium text-slate-900 dark:text-white">Check your email</p>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          We sent a confirmation link to{" "}
          <span className="font-medium text-slate-900 dark:text-white">{email}</span>. After you
          confirm, you will be signed in and can finish your profile.
        </p>
        <p className="text-xs text-slate-500">
          If the link opens in the wrong environment, set{" "}
          <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">NEXT_PUBLIC_APP_URL</code>{" "}
          to your app URL (e.g. on Vercel) and add{" "}
          <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">
            {getSiteUrl()}/auth/callback
          </code>{" "}
          under Supabase Auth redirect URLs.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="w-full rounded-2xl"
          onClick={() => setNeedsEmailConfirmation(false)}
        >
          Use a different email
        </Button>
        <p className="text-center text-sm text-slate-500">
          <Link href="/login" className="font-medium text-slate-900 underline dark:text-white">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="min-h-11"
        />
        <p className="text-xs text-slate-500">At least 8 characters.</p>
      </div>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <Button type="submit" className="min-h-11 w-full rounded-2xl" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-slate-900 underline dark:text-white">
          Sign in
        </Link>
      </p>
    </form>
  );
}
