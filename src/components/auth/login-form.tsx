"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatAuthErrorForUser } from "@/lib/auth/user-messages";
import { createClient } from "@/lib/supabase/client";
import { getSafeInternalPath } from "@/lib/url";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm({ defaultRedirect }: { defaultRedirect?: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeInternalPath(defaultRedirect || searchParams.get("redirect"), "/app");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
      if (signError) {
        setError(formatAuthErrorForUser(signError));
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-Mail</Label>
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
        <Label htmlFor="password">Passwort</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="min-h-11"
        />
      </div>
      {error ? <p className="text-sm text-gh-error-text">{error}</p> : null}
      <Button type="submit" className="min-h-11 w-full rounded-2xl" disabled={pending}>
        {pending ? "Melde an…" : "Anmelden"}
      </Button>
      <p className="text-center text-sm text-gh-text-muted">
        Noch kein Konto?{" "}
        <Link
          href="/signup"
          className="font-medium text-gh-accent underline decoration-gh-accent/40 underline-offset-2 transition-colors hover:text-gh-accent-hover"
        >
          Registrieren
        </Link>
      </p>
    </form>
  );
}
