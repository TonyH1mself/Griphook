"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const items = [
  { href: "/app", label: "Home", match: (p: string) => p === "/app" },
  { href: "/app/entries", label: "Entries", match: (p: string) => p.startsWith("/app/entries") },
  { href: "/app/buckets", label: "Buckets", match: (p: string) => p.startsWith("/app/buckets") },
  { href: "/app/shared", label: "Shared", match: (p: string) => p.startsWith("/app/shared") },
  { href: "/app/recurring", label: "Repeat", match: (p: string) => p.startsWith("/app/recurring") },
  { href: "/app/settings", label: "More", match: (p: string) => p.startsWith("/app/settings") },
] as const;

function hapticTap() {
  if (typeof window === "undefined") return;
  const nav = window.navigator as Navigator & { vibrate?: (n: number | number[]) => boolean };
  nav.vibrate?.(10);
}

const itemInteraction =
  "transition-[transform,background-color,color,box-shadow] duration-150 ease-out motion-reduce:transition-none motion-reduce:transform-none";

export function AppBottomNav() {
  const pathname = usePathname();

  useEffect(() => {
    // #region agent log
    const w = typeof window !== "undefined" ? window.innerWidth : 0;
    fetch("http://127.0.0.1:7794/ingest/09b0aba0-4f5a-4ca4-8763-6c4f0cd89420", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "60d861" },
      body: JSON.stringify({
        sessionId: "60d861",
        location: "app-bottom-nav.tsx:mount",
        message: "bottom_nav_mount",
        data: { innerWidth: w, belowMd: w < 768 },
        timestamp: Date.now(),
        hypothesisId: "H2",
        runId: "verify-fab",
      }),
    }).catch(() => {});
    // #endregion
  }, []);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-gh-border-subtle bg-gh-surface/88 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-gh-float backdrop-blur-lg md:hidden"
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-1 px-2">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                prefetch
                onPointerDown={() => hapticTap()}
                className={cn(
                  "flex min-h-12 min-w-[44px] flex-col items-center justify-center rounded-2xl px-1 py-2 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-gh-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gh-surface",
                  itemInteraction,
                  active
                    ? "bg-gh-accent-muted text-gh-accent shadow-[inset_0_0_0_1px_rgb(106_158_148/0.35)]"
                    : "text-gh-text-muted hover:bg-gh-surface-elevated hover:text-gh-text-secondary active:scale-[0.96]",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
