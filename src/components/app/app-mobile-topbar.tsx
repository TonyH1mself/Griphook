"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBrandDots, IconSettings } from "./nav-icons";
import { AppRefreshButton } from "./app-refresh-button";

/**
 * Mobile-only slim topbar. Surfaces the two things the Arc menu deliberately
 * does NOT carry to keep the fan compact:
 *  – Aktualisieren (router.refresh)
 *  – Einstellungen
 *
 * Intentionally lightweight: no page titles here — the page itself owns its
 * H1. This bar is purely a utility shelf within the mobile safe area.
 */
export function AppMobileTopbar() {
  const pathname = usePathname();
  const settingsActive = pathname === "/app/settings" || pathname.startsWith("/app/settings/");

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-gh-border-subtle/70 bg-gh-canvas/85 px-4 py-2.5 backdrop-blur-md md:hidden">
      <Link
        href="/app"
        aria-label="Zur Startseite"
        className="group flex items-center gap-2 rounded-xl px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-gh-ring"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-gh-accent/30 bg-gh-accent/15 text-gh-accent">
          <IconBrandDots size={16} />
        </span>
        <span className="text-sm font-semibold tracking-tight text-gh-text">GripHook</span>
      </Link>
      <div className="flex items-center gap-2">
        <AppRefreshButton />
        <Link
          href="/app/settings"
          aria-label="Einstellungen"
          aria-current={settingsActive ? "page" : undefined}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border border-gh-border-subtle bg-gh-surface-elevated/90 text-gh-text-secondary shadow-[0_6px_18px_-10px_rgb(0_0_0/0.6)] outline-none transition-[background-color,color,border-color,transform] duration-150 hover:border-gh-border hover:text-gh-text motion-safe:active:scale-[0.94] motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-gh-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gh-canvas",
            settingsActive && "border-gh-accent/40 bg-gh-accent-muted text-gh-accent",
          )}
        >
          <IconSettings size={18} />
        </Link>
      </div>
    </header>
  );
}
