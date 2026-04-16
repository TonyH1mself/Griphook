import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
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
        <h1 className="text-2xl font-semibold tracking-tight text-gh-text">Einstellungen</h1>
        <p className="mt-1 text-sm text-gh-text-muted">
          Profil, Sitzung und weitere Einstellungen.
        </p>
      </header>

      <Card>
        <CardTitle>Profil</CardTitle>
        <CardDescription>Aus deinem GripHook-Profil übernommen.</CardDescription>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-gh-text-muted">E-Mail</dt>
            <dd className="mt-1 text-gh-text">{user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gh-text-muted">Benutzername</dt>
            <dd className="mt-1 text-gh-text">{profile?.username ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gh-text-muted">Anzeigename</dt>
            <dd className="mt-1 text-gh-text">{profile?.display_name ?? "—"}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <CardTitle>Sitzung</CardTitle>
        <CardDescription>Auf diesem Gerät abmelden.</CardDescription>
        <form action={signOut} className="mt-4">
          <Button type="submit" variant="secondary" className="rounded-2xl">
            Abmelden
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Kategorien</CardTitle>
        <CardDescription>
          Eigene Kategorien für Einträge und wiederkehrende Posten anlegen oder archivieren.
        </CardDescription>
        <LinkButton href="/app/categories" className="mt-4 min-h-11 rounded-2xl">
          Kategorien verwalten
        </LinkButton>
      </Card>

      <Card>
        <CardTitle>Kommt bald</CardTitle>
        <CardDescription>
          Währungsvorgaben, Benachrichtigungen und weitere Einstellungen.
        </CardDescription>
      </Card>
    </div>
  );
}
