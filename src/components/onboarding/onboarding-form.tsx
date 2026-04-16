"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboarding, type ProfileActionState } from "@/server/profile-actions";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

function fe(state: ProfileActionState, key: string) {
  return state.fieldErrors?.[key];
}

export function OnboardingForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<ProfileActionState, FormData>(
    completeOnboarding,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      router.replace("/app");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Benutzername</Label>
        <Input id="username" name="username" autoComplete="username" className="min-h-11" />
        <p className="text-xs text-gh-text-muted">
          Kleinbuchstaben, Zahlen und Unterstriche. Einzigartig.
        </p>
        {fe(state, "username") ? (
          <p className="text-xs text-gh-error-text">{fe(state, "username")}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="display_name">Anzeigename</Label>
        <Input id="display_name" name="display_name" autoComplete="name" className="min-h-11" />
        {fe(state, "display_name") ? (
          <p className="text-xs text-gh-error-text">{fe(state, "display_name")}</p>
        ) : null}
      </div>
      {state.error ? <p className="text-sm text-gh-error-text">{state.error}</p> : null}
      <Button type="submit" className="min-h-11 w-full rounded-2xl" disabled={pending}>
        {pending ? "Speichere…" : "Weiter"}
      </Button>
    </form>
  );
}
