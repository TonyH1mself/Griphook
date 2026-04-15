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
    "The app is not fully configured (missing Supabase settings). Check environment variables and try again.",
  [AUTH_QUERY_ERRORS.CALLBACK_EXCHANGE]:
    "We could not complete sign-in from your link. The link may have expired — request a new one or sign in with your password.",
  [AUTH_QUERY_ERRORS.CALLBACK_VERIFY]:
    "We could not verify your email link. It may have expired — request a new confirmation email or sign in with your password.",
  [AUTH_QUERY_ERRORS.MISSING_CODE]:
    "That sign-in link was incomplete. Open the link from your email again, or sign in with your password.",
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
    return "Something went wrong during sign-in. Please try again.";
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
    return "Please confirm your email first. Check your inbox for the confirmation link.";
  }
  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid email or password")
  ) {
    return "Incorrect email or password.";
  }
  if (message.includes("user already registered") || code === "signup_disabled") {
    return "This email is already registered. Try signing in instead.";
  }
  if (message.includes("password") && message.includes("at least")) {
    return "Password does not meet requirements. Use at least 8 characters.";
  }
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Too many attempts. Wait a moment and try again.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "Network error. Check your connection and try again.";
  }

  return "Something went wrong. Please try again.";
}
