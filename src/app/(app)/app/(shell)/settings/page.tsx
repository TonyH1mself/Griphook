import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/server/auth-actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).single()
    : { data: null };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Profile, session, and future preferences.</p>
      </header>

      <Card>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Synced from your GripHook profile row.</CardDescription>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Email</dt>
            <dd className="mt-1 text-slate-900 dark:text-white">{user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Username</dt>
            <dd className="mt-1 text-slate-900 dark:text-white">{profile?.username ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Display name</dt>
            <dd className="mt-1 text-slate-900 dark:text-white">{profile?.display_name ?? "—"}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <CardTitle>Session</CardTitle>
        <CardDescription>Sign out on this device.</CardDescription>
        <form action={signOut} className="mt-4">
          <Button type="submit" variant="secondary" className="rounded-2xl">
            Log out
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Coming soon</CardTitle>
        <CardDescription>Currency defaults, categories management, notifications.</CardDescription>
      </Card>
    </div>
  );
}
