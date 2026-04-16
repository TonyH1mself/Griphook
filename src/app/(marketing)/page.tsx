import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app");

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gh-text-muted">GripHook</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gh-text">
        Dein Monat, in einer ruhigen Ansicht.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-gh-text-secondary">
        Einnahmen und Ausgaben mit Buckets verfolgen — optional mit gemeinsamen Haushaltstöpfen und
        dezenten Fairness-Signalen. Ohne Tabellenkalkulation, ohne Buchhalter-Zweitjob.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <LinkButton href="/signup" className="h-12 w-full px-5 text-base sm:w-auto">
          Konto erstellen
        </LinkButton>
        <LinkButton
          href="/login"
          variant="secondary"
          className="h-12 w-full px-5 text-base sm:w-auto"
        >
          Anmelden
        </LinkButton>
      </div>
      <p className="mt-10 text-xs text-gh-text-muted">
        Auf iPhone installieren: Nach dem Anmelden „Teilen → Zum Home-Bildschirm“. Offline-Modus ist
        noch nicht aktiviert, aber die Shell ist PWA-ready.
      </p>
    </main>
  );
}
