/**
 * Canonical site URL for redirects, Supabase email links, and OAuth callbacks.
 * Prefer NEXT_PUBLIC_APP_URL in all deployed environments (Vercel + Supabase Auth URLs must match).
 */
export function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    if (explicit) return explicit;
    return window.location.origin.replace(/\/$/, "");
  }

  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (explicit) return explicit;

  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;

  return "http://localhost:3000";
}

export function getAuthCallbackUrl(nextPath = "/app"): string {
  const base = getSiteUrl();
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${base}/auth/callback?next=${encodeURIComponent(next)}`;
}
