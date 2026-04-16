import type { AuthError } from "@supabase/supabase-js";

/** Query param values for /login?error=… (callback and config). */
export const AUTH_QUERY_ERRORS = {
  CONFIG: "config",
  CALLBACK_EXCHANGE: "callback_exchange",
  CALLBACK_VERIFY: "callback_verify",
  MISSING_CODE: "missing_code",
} as const;

const LOGIN_MESSAGES: Record<string, string> = {
  [AUTH_QUERY_ERRORS.CONFIG]:
    "Die App ist nicht vollständig konfiguriert (Supabase-Einstellungen fehlen). Bitte Umgebungsvariablen prüfen und erneut versuchen.",
  [AUTH_QUERY_ERRORS.CALLBACK_EXCHANGE]:
    "Die Anmeldung über den Link konnte nicht abgeschlossen werden. Der Link ist möglicherweise abgelaufen — neuen Link anfordern oder mit Passwort anmelden.",
  [AUTH_QUERY_ERRORS.CALLBACK_VERIFY]:
    "Der E-Mail-Link konnte nicht verifiziert werden. Möglicherweise ist er abgelaufen — bitte neuen Bestätigungslink anfordern oder mit Passwort anmelden.",
  [AUTH_QUERY_ERRORS.MISSING_CODE]:
    "Dieser Anmeldelink war unvollständig. Bitte Link erneut aus der E-Mail öffnen oder mit Passwort anmelden.",
};

export function loginPageErrorMessage(param: string | null | undefined): string | null {
  if (param == null || param === "") return null;
  const decoded = (() => {
    try {
      return decodeURIComponent(param);
    } catch {
      return param;
    }
  })();
  const known = LOGIN_MESSAGES[decoded];
  if (known) return known;
  if (/^[a-z0-9_]+$/.test(decoded)) {
    return "Bei der Anmeldung ist etwas schiefgelaufen. Bitte erneut versuchen.";
  }
  return decoded;
}

function normalizeAuthError(err: AuthError | { message?: string; status?: number; code?: string }) {
  const message = (err.message ?? "").toLowerCase();
  const code = "code" in err && err.code ? String(err.code).toLowerCase() : "";
  return { message, code, status: "status" in err ? err.status : undefined };
}

/** Maps Supabase auth errors from sign-in / sign-up to a short user-facing string. */
export function formatAuthErrorForUser(err: AuthError): string {
  const { message, code } = normalizeAuthError(err);

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "Bitte bestätige zuerst deine E-Mail. Den Bestätigungslink findest du in deinem Posteingang.";
  }
  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid email or password")
  ) {
    return "Falsche E-Mail oder falsches Passwort.";
  }
  if (message.includes("user already registered") || code === "signup_disabled") {
    return "Diese E-Mail ist bereits registriert. Bitte anmelden.";
  }
  if (message.includes("password") && message.includes("at least")) {
    return "Das Passwort erfüllt nicht die Anforderungen. Mindestens 8 Zeichen verwenden.";
  }
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Zu viele Versuche. Bitte einen Moment warten und erneut versuchen.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "Netzwerkfehler. Bitte Verbindung prüfen und erneut versuchen.";
  }

  return "Etwas ist schiefgelaufen. Bitte erneut versuchen.";
}
