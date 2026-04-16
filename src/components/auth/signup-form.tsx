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
      <div className="space-y-4 rounded-2xl border border-gh-border-subtle bg-gh-surface/90 p-5 shadow-gh-panel backdrop-blur-sm">
        <p className="text-sm font-medium text-gh-text">Check your email</p>
        <p className="text-sm leading-relaxed text-gh-text-secondary">
          We sent a confirmation link to{" "}
          <span className="font-medium text-gh-text">{email}</span>. After you confirm, you will be
          signed in and can finish your profile.
        </p>
        <p className="text-xs text-gh-text-muted">
          If the link opens in the wrong environment, set{" "}
          <code className="rounded bg-gh-surface-inset px-1 text-gh-text-secondary ring-1 ring-gh-border-subtle">
            NEXT_PUBLIC_APP_URL
          </code>{" "}
          to your app URL (e.g. on Vercel) and add{" "}
          <code className="rounded bg-gh-surface-inset px-1 text-gh-text-secondary ring-1 ring-gh-border-subtle">
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
        <p className="text-center text-sm text-gh-text-muted">
          <Link
            href="/login"
            className="font-medium text-gh-accent underline decoration-gh-accent/40 underline-offset-2 transition-colors hover:text-gh-accent-hover"
          >
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
        <p className="text-xs text-gh-text-muted">At least 8 characters.</p>
      </div>
      {error ? <p className="text-sm text-gh-error-text">{error}</p> : null}
      <Button type="submit" className="min-h-11 w-full rounded-2xl" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-gh-text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-gh-accent underline decoration-gh-accent/40 underline-offset-2 transition-colors hover:text-gh-accent-hover"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
