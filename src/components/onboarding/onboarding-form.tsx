"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboarding, type ProfileActionState } from "@/server/profile-actions";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

export function OnboardingForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<ProfileActionState, FormData>(completeOnboarding, {});

  useEffect(() => {
    if (state.ok) {
      router.replace("/app");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" autoComplete="username" required minLength={2} />
        <p className="text-xs text-slate-500">Lowercase, unique, at least 2 characters.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="display_name">Display name</Label>
        <Input id="display_name" name="display_name" autoComplete="name" required />
      </div>
      {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      <Button type="submit" className="h-11 w-full rounded-2xl" disabled={pending}>
        {pending ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
