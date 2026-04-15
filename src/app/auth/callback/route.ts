import { AUTH_QUERY_ERRORS } from "@/lib/auth/user-messages";
import { getSafeInternalPath } from "@/lib/url";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Email confirmation / PKCE: exchanges `code` or verifies `token_hash` for a session.
 * Add to Supabase Auth redirect URLs: {SITE_URL}/auth/callback
 */
export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { searchParams, origin } = new URL(request.url);
  const next = getSafeInternalPath(searchParams.get("next"), "/app");

  if (!url || !key) {
    return NextResponse.redirect(`${origin}/login?error=${AUTH_QUERY_ERRORS.CONFIG}`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* ignore when not mutable */
        }
      },
    },
  });

  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${AUTH_QUERY_ERRORS.CALLBACK_VERIFY}`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${AUTH_QUERY_ERRORS.CALLBACK_EXCHANGE}`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=${AUTH_QUERY_ERRORS.MISSING_CODE}`);
}
